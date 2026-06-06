import { Platform } from 'react-native';

/** User-facing app store name (never mention RevenueCat in UI). */
export function getAppStoreName(): string {
  return Platform.OS === 'ios' ? 'App Store' : 'Google Play';
}

export function subscriptionStoreMessage(): string {
  return `Abonamentele KHEYA Pro se activează prin ${getAppStoreName()}.`;
}

export function paymentsUnavailableMessage(): string {
  if (__DEV__) {
    const key =
      Platform.OS === 'ios'
        ? 'EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE'
        : 'EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE';
    return `Plățile nu sunt configurate. Adaugă ${key} în .env și reconstruiește app-ul.`;
  }
  return `Plățile nu sunt disponibile în această versiune. Actualizează aplicația din ${getAppStoreName()} sau contactează contact@kheya.ro.`;
}
