import { Linking } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

function readUrl(envKey: string, extraKey: string): string | null {
  const fromEnv = process.env[envKey]?.trim();
  const fromExtra = extra?.[extraKey]?.trim();
  const value = fromEnv || fromExtra || '';
  return value.length > 0 ? value : null;
}

/** Public privacy policy (App Store / Play). Set EXPO_PUBLIC_PRIVACY_POLICY_URL in EAS. */
export function getPrivacyPolicyUrl(): string | null {
  return readUrl('EXPO_PUBLIC_PRIVACY_POLICY_URL', 'EXPO_PUBLIC_PRIVACY_POLICY_URL');
}

/** Public terms of use. Set EXPO_PUBLIC_TERMS_URL in EAS. */
export function getTermsUrl(): string | null {
  return readUrl('EXPO_PUBLIC_TERMS_URL', 'EXPO_PUBLIC_TERMS_URL');
}

export async function openLegalUrl(url: string, label: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error(`Nu s-a putut deschide ${label}.`);
  }
  await Linking.openURL(url);
}
