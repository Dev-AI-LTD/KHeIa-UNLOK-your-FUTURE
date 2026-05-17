import OpenAI from 'openai';
import { getEnv } from '../config/env';

const MAX_CHARS = 4000;

const ALLOWED_VOICES = new Set([
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
]);

export function cleanTextForTts(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SpeakResult =
  | { ok: true; buffer: Buffer; contentType: 'audio/mpeg' }
  | { ok: false; status: number; message: string };

/**
 * Generates MP3 speech via OpenAI TTS (natural voice, not device TTS).
 */
export async function speakText(text: string): Promise<SpeakResult> {
  const { openAiKey, ttsVoice } = getEnv();
  if (!openAiKey) {
    return { ok: false, status: 500, message: 'OPENAI_API_KEY lipsește în configurare.' };
  }

  const cleaned = cleanTextForTts(text);
  if (!cleaned) {
    return { ok: false, status: 400, message: 'Text gol după curățare.' };
  }
  if (cleaned.length > MAX_CHARS) {
    return {
      ok: false,
      status: 400,
      message: `Text prea lung (${cleaned.length} caractere, max ${MAX_CHARS}).`,
    };
  }

  const voice = ALLOWED_VOICES.has(ttsVoice) ? ttsVoice : 'nova';
  const openai = new OpenAI({ apiKey: openAiKey });

  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as 'nova',
      input: cleaned,
      response_format: 'mp3',
    });
    const arrayBuffer = await response.arrayBuffer();
    return {
      ok: true,
      buffer: Buffer.from(arrayBuffer),
      contentType: 'audio/mpeg',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare TTS necunoscută';
    return { ok: false, status: 500, message };
  }
}
