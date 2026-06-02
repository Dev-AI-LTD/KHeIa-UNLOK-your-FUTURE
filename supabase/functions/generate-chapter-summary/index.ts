import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { getSupabaseUser } from '../_shared/auth.ts';

function requireServiceTokenHeaders(): Record<string, string> {
  const token = (Deno.env.get('SERVICE_TOKEN') ?? '').trim();
  if (!token) {
    throw new Error('SERVICE_TOKEN missing.');
  }
  return { 'x-service-token': token };
}

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
    const body = (await req.json()) as { chapter_id: string; topic?: string };

    const user = await getSupabaseUser(req);
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (!body?.chapter_id) {
      return jsonResponse({ source: 'error', content: 'Lipsește chapter_id.' });
    }

    const hashKey = `summary:${body.chapter_id}`;

    const { data: cached } = await supabase
      .from('ai_cache')
      .select('payload')
      .eq('hash_key', hashKey)
      .maybeSingle();

    if (cached?.payload) {
      return jsonResponse(cached.payload);
    }

    let topic = body.topic;
    if (!topic) {
      const { data: ch } = await supabase
        .from('chapters')
        .select('title')
        .eq('id', body.chapter_id)
        .maybeSingle();
      topic = ch?.title ?? body.chapter_id;
    }

    let backendUrl = (Deno.env.get('NODE_BACKEND_URL') ?? '').trim();
    if (!backendUrl) {
      return jsonResponse({ source: 'error', content: 'NODE_BACKEND_URL nu este configurat.' });
    }
    if (!backendUrl.startsWith('http')) {
      backendUrl = `https://${backendUrl}`;
    }

    const backendRes = await fetch(`${backendUrl}/api/generate/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...requireServiceTokenHeaders() },
      body: JSON.stringify({ ...body, topic, summaryOnly: true }),
    });

    let payload: unknown;
    try {
      payload = await backendRes.json();
    } catch {
      payload = { source: 'error', content: `Backend răspuns invalid: ${backendRes.status}` };
    }

    if (!backendRes.ok) {
      return jsonResponse(
        (payload as { content?: string })?.content
          ? payload
          : { source: 'error', content: `Backend: ${backendRes.status}` }
      );
    }

    const { error: insertErr } = await supabase.from('ai_cache').insert({
      hash_key: hashKey,
      payload,
      source: 'node-backend',
    });

    if (insertErr) {
      console.error('ai_cache insert failed:', insertErr);
    }

    return jsonResponse(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('generate-chapter-summary error:', err);
    return jsonResponse({ source: 'error', content: `Eroare: ${msg}` });
  }
});
