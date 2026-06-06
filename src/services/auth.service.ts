import { supabase } from './supabase';

let bridgeInFlight: Promise<{ error: Error | null }> | null = null;
let bridgeToken: string | null = null;

type BridgeResponse = {
  access_token: string;
  refresh_token: string;
  error?: string;
};

async function edgeFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback =
    error instanceof Error ? error.message : 'Autentificare eșuată (edge function)';

  const ctx = (error as { context?: Response })?.context;
  if (!ctx) {
    return fallback;
  }

  try {
    const body = (await ctx.json()) as { error?: string; message?: string };
    return body?.error ?? body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * After Kinde login, exchange the Kinde access token for a Supabase session
 * so existing RLS-backed tables keep working.
 */
async function bridgeKindeToSupabaseOnce(kindeAccessToken: string): Promise<{ error: Error | null }> {
  const { data, error } = await supabase.functions.invoke<BridgeResponse>('kinde-bridge', {
    headers: { Authorization: `Bearer ${kindeAccessToken}` },
  });

  if (error) {
    let message = await edgeFunctionErrorMessage(error);
    if (message.includes('not found')) {
      message =
        'Serviciul de autentificare nu este disponibil momentan. Încearcă din nou sau contactează contact@kheya.ro.';
    }
    return { error: new Error(message) };
  }

  if (data?.error || !data?.access_token || !data?.refresh_token) {
    return { error: new Error(data?.error ?? 'Răspuns invalid de la server') };
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) {
    return { error: sessionError };
  }

  return { error: null };
}

/** Idempotent bridge — safe when Kinde onSuccess and login() both fire. */
export function bridgeKindeToSupabase(kindeAccessToken: string): Promise<{ error: Error | null }> {
  if (bridgeInFlight && bridgeToken === kindeAccessToken) {
    return bridgeInFlight;
  }

  bridgeToken = kindeAccessToken;
  bridgeInFlight = bridgeKindeToSupabaseOnce(kindeAccessToken).finally(() => {
    bridgeInFlight = null;
  });

  return bridgeInFlight;
}

export async function signOutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Restores Supabase session from a persisted Kinde access token (offline scope + AsyncStorage).
 * Avoids forcing email/code login when only the Supabase JWT expired.
 */
export async function restoreSupabaseFromKinde(
  getKindeAccessToken: () => Promise<string | null>,
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return true;

  const kindeToken = await getKindeAccessToken();
  if (!kindeToken) return false;

  const { error } = await bridgeKindeToSupabase(kindeToken);
  return !error;
}

/**
 * GDPR: delete account via edge function (Supabase JWT after Kinde bridge).
 */
export async function deleteAccount(): Promise<{ error: Error | null }> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: sessionError ?? new Error('Nu ești autentificat.') };
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    return { error: new Error(error.message ?? 'Ștergerea contului a eșuat.') };
  }

  const body = data as { error?: string } | undefined;
  if (body?.error) {
    return { error: new Error(body.error) };
  }

  await supabase.auth.signOut();
  return { error: null };
}
