/**
 * Încarcă .env și pune EXPO_PUBLIC_NODE_BACKEND_URL în expo.extra (citit în app via Constants).
 * Unde pui variabila:
 * 1) Fișier .env în rădăcina proiectului (același folder cu app.json):
 *    EXPO_PUBLIC_NODE_BACKEND_URL=https://kheia-unlok-your-future-production.up.railway.app
 * 2) Dacă nu există .env sau e gol, se folosește URL-ul implicit de mai jos.
 * După modificare la .env: repornește cu "npx expo start -c".
 */
const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch {
  // dotenv opțional
}

const DEFAULT_NODE_BACKEND_URL = 'https://kheia-unlok-your-future-production.up.railway.app';

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    EXPO_PUBLIC_NODE_BACKEND_URL:
      process.env.EXPO_PUBLIC_NODE_BACKEND_URL?.trim() || DEFAULT_NODE_BACKEND_URL,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
    EXPO_PUBLIC_KINDE_DOMAIN: process.env.EXPO_PUBLIC_KINDE_DOMAIN?.trim() ?? '',
    EXPO_PUBLIC_KINDE_CLIENT_ID: process.env.EXPO_PUBLIC_KINDE_CLIENT_ID?.trim() ?? '',
    EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE:
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE?.trim() ?? '',
    EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE:
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE?.trim() ?? '',
    EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID:
      process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'KheIA Pro',
    EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS:
      process.env.EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS?.trim() || 'contact@devaieood.com',
    EXPO_PUBLIC_PRIVACY_POLICY_URL:
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || 'https://kheya.ro/privacy',
    EXPO_PUBLIC_TERMS_URL:
      process.env.EXPO_PUBLIC_TERMS_URL?.trim() || 'https://kheya.ro/terms',
  },
});
