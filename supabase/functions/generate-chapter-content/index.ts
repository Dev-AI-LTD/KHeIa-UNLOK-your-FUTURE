import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { getSupabaseUser, isUserPremium } from '../_shared/auth.ts';

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

    // 3. Check premium status before any content access
    const premium = await isUserPremium(supabase, user.id);

    // 4. Check Cache (only serve cache to premium users or for free chapters)
    const hashKey = `${body.topic}:${body.subject_id}:${body.level}`;
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('payload')
      .eq('hash_key', hashKey)
      .maybeSingle();

    if (cached?.payload) {
      // Even for cached content, verify premium for chapter > 2
      if (!premium && body.chapter_id) {
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('order_index')
          .eq('id', body.chapter_id)
          .single();

        // If chapter doesn't exist or there's an error, deny access for security
        if (chapterError || !chapter) {
          return jsonResponse({
            source: 'error',
            content: 'Capitolul nu a fost găsit.'
          }, 404);
        }

        if (chapter.order_index > 2) {
          return jsonResponse({
            source: 'error',
            content: 'Upgrade la Pro pentru a genera conținut pentru acest capitol.'
          }, 403);
        }
      }
      return jsonResponse(cached.payload);
    }

    // 5. If NOT in cache, check premium for generation

    if (!premium) {
      // If we have a chapter_id, we can check its order
      if (body.chapter_id) {
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('order_index')
          .eq('id', body.chapter_id)
          .single();

        // If chapter doesn't exist or there's an error, deny access for security
        if (chapterError || !chapter) {
          return jsonResponse({
            source: 'error',
            content: 'Capitolul nu a fost găsit.'
          }, 404);
        }

        // FREE_CHAPTERS_PER_SUBJECT = 2
        if (chapter.order_index > 2) {
          return jsonResponse({
            source: 'error',
            content: 'Upgrade la Pro pentru a genera conținut pentru acest capitol.'
          }, 403);
        }
      } else {
        // If no chapter_id provided, default to blocking generation for safety
        return jsonResponse({
          source: 'error',
          content: 'Upgrade la Pro pentru a genera conținut nou.'
        }, 403);
      }
    }

    // 6. Proceed to generation
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
