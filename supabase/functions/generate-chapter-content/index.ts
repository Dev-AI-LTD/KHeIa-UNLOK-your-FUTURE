import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { getSupabaseUser } from '../_shared/auth.ts';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // 1. Authenticate first (required for both cache lookup and generation)
    const user = await getSupabaseUser(req);
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // 2. Get request body
    const body = (await req.json()) as { topic?: string; subject_id?: string; level?: string; chapter_id?: string };

    if (!body?.topic || !body?.subject_id || !body?.level) {
      return jsonResponse({ source: 'error', content: 'Lipsesc topic, subject_id sau level.' }, 400);
    }

    const hashKey = `${body.topic}:${body.subject_id}:${body.level}`;
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('payload')
      .eq('hash_key', hashKey)
      .maybeSingle();

    if (cached?.payload) {
      return jsonResponse(cached.payload);
    }

    // Proceed to generation
    let backendUrl = (Deno.env.get('NODE_BACKEND_URL') ?? '').trim();
    if (!backendUrl) return jsonResponse({ source: 'error', content: 'NODE_BACKEND_URL missing.' }, 500);

    const backendRes = await fetch(`${backendUrl.startsWith('http') ? '' : 'https://'}${backendUrl}/api/generate/chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let payload: Record<string, unknown>;
    try {
      payload = await backendRes.json();
    } catch {
      payload = { source: 'error', content: `Backend invalid: ${backendRes.status}` };
    }

    if (backendRes.ok) {
      await supabase.from('ai_cache').insert({
        hash_key: hashKey,
        payload,
        source: 'node-backend',
      });
    }

    return jsonResponse(payload, backendRes.status);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ source: 'error', content: `Eroare: ${errorMessage}` }, 500);
  }
});
