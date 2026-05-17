/**
 * Citește EXPO_PUBLIC_NODE_BACKEND_URL din expo.extra (încărcat din .env în app.config.js)
 * sau din process.env. Adaugă https:// dacă lipsește.
 * Folosește acest modul peste tot unde ai nevoie de URL-ul backend-ului Node.
 */
import Constants from 'expo-constants';

export function getNodeBackendUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.EXPO_PUBLIC_NODE_BACKEND_URL;
  const fromEnv = process.env.EXPO_PUBLIC_NODE_BACKEND_URL;
  const raw =
    (typeof fromExtra === 'string' ? fromExtra : '') ||
    (typeof fromEnv === 'string' ? fromEnv : '') ||
    '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function getChatApiUrl(): string | null {
  const base = getNodeBackendUrl();
  return base ? `${base}/api/generate/chat` : null;
}

export function getTtsApiUrl(): string | null {
  const base = getNodeBackendUrl();
  return base ? `${base}/api/tts/speak` : null;
}
