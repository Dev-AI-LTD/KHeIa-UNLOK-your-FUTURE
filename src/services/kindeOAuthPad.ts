import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { AuthRequest, exchangeCodeAsync } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  getActiveStorage,
  mapLoginMethodParamsForUrl,
  PromptTypes,
  StorageKeys,
} from '@kinde/js-utils';
import { getKindeAuthOptions, getKindeRedirectUri } from '@/lib/kindeConfig';

const OAUTH_TIMEOUT_MS = 5 * 60 * 1000;
const KINDE_SCOPES = ['openid', 'profile', 'email', 'offline'];

export type KindeOAuthPadMode = 'login' | 'register';

export type KindeOAuthPadResult = {
  success: boolean;
  accessToken?: string;
  errorMessage?: string;
};

function getKindeEnv(): { domain: string; clientId: string } {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const domain =
    process.env.EXPO_PUBLIC_KINDE_DOMAIN?.trim() ||
    extra?.EXPO_PUBLIC_KINDE_DOMAIN?.trim() ||
    '';
  const clientId =
    process.env.EXPO_PUBLIC_KINDE_CLIENT_ID?.trim() ||
    extra?.EXPO_PUBLIC_KINDE_CLIENT_ID?.trim() ||
    '';

  if (!domain || !clientId) {
    throw new Error('Kinde nu este configurat (domain / clientId).');
  }

  return { domain: domain.replace(/\/$/, ''), clientId };
}

function redirectMatches(url: string, redirectUri: string): boolean {
  const normalizedRedirect = redirectUri.split('?')[0];
  const normalizedUrl = url.split('?')[0];
  return normalizedUrl === normalizedRedirect || url.startsWith('kheia://kinde_callback');
}

async function waitForOAuthRedirect(redirectUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      subscription.remove();
      fn();
    };

    const subscription = Linking.addEventListener('url', (event) => {
      if (redirectMatches(event.url, redirectUri)) {
        finish(() => resolve(event.url));
      }
    });

    const timeout = setTimeout(() => {
      finish(() => reject(new Error('Autentificarea a expirat. Încearcă din nou.')));
    }, OAUTH_TIMEOUT_MS);

    void Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && redirectMatches(initialUrl, redirectUri)) {
        finish(() => resolve(initialUrl));
      }
    });
  });
}

async function persistKindeTokens(tokens: {
  accessToken?: string | null;
  idToken?: string | null;
  refreshToken?: string | null;
}): Promise<void> {
  const storage = getActiveStorage();
  if (!storage) return;

  if (tokens.accessToken) {
    await storage.setSessionItem(StorageKeys.accessToken, tokens.accessToken);
  }
  if (tokens.idToken) {
    await storage.setSessionItem(StorageKeys.idToken, tokens.idToken);
  }
  if (tokens.refreshToken) {
    await storage.setSessionItem(StorageKeys.refreshToken, tokens.refreshToken);
  }
}

/**
 * iPad OAuth: full-screen SFSafariViewController + deep-link callback.
 * Avoids ASWebAuthenticationSession sheet where the keyboard often fails on iPadOS.
 */
export async function kindeOAuthPadLogin(mode: KindeOAuthPadMode): Promise<KindeOAuthPadResult> {
  const { domain, clientId } = getKindeEnv();
  const redirectUri = getKindeRedirectUri();
  const authOptions = getKindeAuthOptions();

  const discovery = {
    authorizationEndpoint: `${domain}/oauth2/auth`,
    tokenEndpoint: `${domain}/oauth2/token`,
  };

  const extraParams = {
    ...mapLoginMethodParamsForUrl({
      ...authOptions,
      redirectURL: redirectUri,
      prompt: mode === 'register' ? PromptTypes.create : PromptTypes.login,
    }),
    has_success_page: 'true',
  };

  const request = new AuthRequest({
    clientId,
    redirectUri,
    scopes: KINDE_SCOPES,
    extraParams,
    usePKCE: true,
  });

  const authUrl = await request.makeAuthUrlAsync(discovery);
  const redirectPromise = waitForOAuthRedirect(redirectUri);

  void WebBrowser.openBrowserAsync(authUrl, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    dismissButtonStyle: 'cancel',
    enableBarCollapsing: false,
  });

  let redirectUrl: string;
  try {
    redirectUrl = await redirectPromise;
  } catch (e) {
    await WebBrowser.dismissBrowser();
    return {
      success: false,
      errorMessage: e instanceof Error ? e.message : 'Autentificare anulată.',
    };
  }

  await WebBrowser.dismissBrowser();

  const parsed = request.parseReturnUrl(redirectUrl);
  if (parsed.type !== 'success' || !parsed.params?.code) {
    return {
      success: false,
      errorMessage: parsed.type === 'error' ? 'Eroare la autentificare.' : 'Autentificare anulată.',
    };
  }

  try {
    const tokenResponse = await exchangeCodeAsync(
      {
        clientId,
        code: String(parsed.params.code),
        redirectUri,
        extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      discovery,
    );

    await persistKindeTokens({
      accessToken: tokenResponse.accessToken,
      idToken: tokenResponse.idToken,
      refreshToken: tokenResponse.refreshToken,
    });

    if (!tokenResponse.accessToken) {
      return { success: false, errorMessage: 'Nu am primit token de acces.' };
    }

    return { success: true, accessToken: tokenResponse.accessToken };
  } catch (e) {
    return {
      success: false,
      errorMessage: e instanceof Error ? e.message : 'Schimb cod OAuth eșuat.',
    };
  }
}
