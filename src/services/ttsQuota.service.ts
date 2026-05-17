import AsyncStorage from '@react-native-async-storage/async-storage';

/** Ascultare teorie (TTS) gratuită: 5 minute pe zi. */
export const FREE_TTS_DAILY_SECONDS = 5 * 60;

const STORAGE_PREFIX = '@kheya/tts_usage_';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(): string {
  return `${STORAGE_PREFIX}${todayKey()}`;
}

export async function getTtsUsedSecondsToday(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(storageKey());
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function getTtsRemainingSecondsToday(isPremium: boolean): Promise<number> {
  if (isPremium) return FREE_TTS_DAILY_SECONDS * 999;
  const used = await getTtsUsedSecondsToday();
  return Math.max(0, FREE_TTS_DAILY_SECONDS - used);
}

export async function canStartTtsListening(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const remaining = await getTtsRemainingSecondsToday(false);
  return remaining > 0;
}

/**
 * Înregistrează secunde de redare. Returnează false dacă s-a depășit limita zilnică.
 */
export async function recordTtsListeningSeconds(
  seconds: number,
  isPremium: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  if (isPremium || seconds <= 0) {
    return { allowed: true, remaining: FREE_TTS_DAILY_SECONDS };
  }

  const used = await getTtsUsedSecondsToday();
  const nextUsed = Math.min(FREE_TTS_DAILY_SECONDS, used + seconds);
  await AsyncStorage.setItem(storageKey(), String(nextUsed));
  const remaining = Math.max(0, FREE_TTS_DAILY_SECONDS - nextUsed);
  return { allowed: nextUsed < FREE_TTS_DAILY_SECONDS, remaining };
}

export function formatTtsRemaining(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
