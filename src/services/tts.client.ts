import { getNodeBackendUrl } from '@/lib/nodeBackendUrl';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/services/supabase';
import { isLikelyMp3Buffer, parseTtsErrorFromBuffer } from '@/utils/audio';

type TtsErrorBody = { error?: string };

async function parseTtsError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as TtsErrorBody;
    if (body?.error) return body.error;
  } catch {
    // not JSON (e.g. HTML 404 page)
  }
  if (res.status === 404) {
    return 'Serviciul TTS nu este disponibil pe server. Repornește backend-ul sau redeploy Supabase (tts-speak).';
  }
  return `${fallback} (${res.status})`;
}

function assertValidMp3Buffer(buffer: ArrayBuffer): void {
  const jsonError = parseTtsErrorFromBuffer(buffer);
  if (jsonError) {
    throw new Error(jsonError);
  }
  if (!isLikelyMp3Buffer(buffer)) {
    throw new Error(
      'Răspuns invalid de la serverul TTS. Verifică OPENAI_API_KEY pe Supabase sau redeploy backend.',
    );
  }
}

async function fetchTtsFromNodeBackend(text: string, chapterId: string): Promise<ArrayBuffer | null> {
  const base = getNodeBackendUrl();
  if (!base) return null;

  const res = await fetch(`${base}/api/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, chapterId }),
  });

  if (res.ok) {
    const buffer = await res.arrayBuffer();
    assertValidMp3Buffer(buffer);
    return buffer;
  }

  if (res.status === 404) {
    return null;
  }

  throw new Error(await parseTtsError(res, 'Eroare TTS'));
}

async function fetchTtsFromSupabaseEdge(text: string, chapterId: string): Promise<ArrayBuffer> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${supabaseUrl}/functions/v1/tts-speak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
    },
    body: JSON.stringify({ text, chapterId }),
  });

  if (!res.ok) {
    throw new Error(await parseTtsError(res, 'Eroare TTS'));
  }

  const buffer = await res.arrayBuffer();
  assertValidMp3Buffer(buffer);
  return buffer;
}

export function isTtsAvailable(): boolean {
  const hasSupabase =
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseAnonKey.includes('missing') &&
    !supabaseUrl.includes('placeholder');
  return hasSupabase;
}

/**
 * Use Supabase Edge Function for TTS.
 *
 * Security: do not call the node-backend directly from the client, because the backend is protected
 * with a server-to-server token.
 */
export async function fetchChapterTtsAudio(text: string, chapterId: string): Promise<ArrayBuffer> {
  return fetchTtsFromSupabaseEdge(text, chapterId);
}
