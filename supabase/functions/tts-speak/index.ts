import { corsHeaders } from '../_shared/cors.ts';

const MAX_CHARS = 4000;
const ALLOWED_VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);

function cleanTextForTts(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return jsonError('OPENAI_API_KEY lipsește în Supabase secrets.', 500);
  }

  let body: { text?: string; chapterId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('JSON invalid.', 400);
  }

  const rawText = body.text;
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return jsonError('Câmpul text este obligatoriu.', 400);
  }

  const cleaned = cleanTextForTts(rawText);
  if (!cleaned) {
    return jsonError('Text gol după curățare.', 400);
  }
  if (cleaned.length > MAX_CHARS) {
    return jsonError(`Text prea lung (max ${MAX_CHARS} caractere).`, 400);
  }

  const voiceEnv = (Deno.env.get('TTS_VOICE') ?? 'nova').trim().toLowerCase();
  const voice = ALLOWED_VOICES.has(voiceEnv) ? voiceEnv : 'nova';

  const openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      voice,
      input: cleaned,
      response_format: 'mp3',
    }),
  });

  if (!openAiRes.ok) {
    let message = `OpenAI TTS (${openAiRes.status})`;
    try {
      const errBody = (await openAiRes.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) message = errBody.error.message;
    } catch {
      // not JSON
    }
    return jsonError(message, openAiRes.status >= 500 ? 502 : openAiRes.status);
  }

  const audio = await openAiRes.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=86400',
    },
  });
});
