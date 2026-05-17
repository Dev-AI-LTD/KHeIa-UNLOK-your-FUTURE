import { getNodeBackendUrl } from '@/lib/nodeBackendUrl';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/services/supabase';

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

async function fetchTtsFromNodeBackend(text: string, chapterId: string): Promise<ArrayBuffer | null> {
  const base = getNodeBackendUrl();
  if (!base) return null;

  const res = await fetch(`${base}/api/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, chapterId }),
  });

  if (res.ok) {
    return res.arrayBuffer();
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

  return res.arrayBuffer();
}

export function isTtsAvailable(): boolean {
  const hasBackend = !!getNodeBackendUrl();
  const hasSupabase =
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseAnonKey.includes('missing') &&
    !supabaseUrl.includes('placeholder');
  return hasBackend || hasSupabase;
}

/** Node backend first; Supabase edge `tts-speak` if route missing on Railway. */
export async function fetchChapterTtsAudio(text: string, chapterId: string): Promise<ArrayBuffer> {
  const fromNode = await fetchTtsFromNodeBackend(text, chapterId);
  if (fromNode) {
    return fromNode;
  }

  return fetchTtsFromSupabaseEdge(text, chapterId);
}
