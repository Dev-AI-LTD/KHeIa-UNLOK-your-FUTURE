import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

/** Production / development build (com.kheia.edumat). Add in Kinde dashboard. */
export const KINDE_NATIVE_REDIRECT_URI = 'kheia://kinde_callback';

/**
 * Expo Go cannot open `kheia://` — OAuth would launch the native APK without Metro
 * → "Unable to load script". Use exp://…/--/kinde_callback in Expo Go instead.
 */
export function getKindeRedirectUri(): string {
  if (Constants.appOwnership === 'expo') {
    return Linking.createURL('kinde_callback');
  }
  return KINDE_NATIVE_REDIRECT_URI;
}

export function getKindeAuthOptions() {
  const redirectURL = getKindeRedirectUri();
  if (__DEV__ && Constants.appOwnership === 'expo') {
    console.info(
      '[Kinde] Expo Go redirect URL (add to Kinde → Callback URLs):\n',
      redirectURL,
    );
  }
  return { redirectURL };
}

/** @deprecated Use getKindeAuthOptions() — redirect differs in Expo Go vs native build. */
export const KINDE_REDIRECT_URI = KINDE_NATIVE_REDIRECT_URI;
