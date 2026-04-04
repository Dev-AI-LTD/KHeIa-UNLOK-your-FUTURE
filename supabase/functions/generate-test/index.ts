import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { getSupabaseUser, isUserPremium } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Authenticate first
  const user = await getSupabaseUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  // 2. Parse request body early to validate it's valid JSON
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const supabase = getSupabaseClient();
  const backendUrl = Deno.env.get('NODE_BACKEND_URL') ?? '';

  if (!backendUrl) {
    return new Response(JSON.stringify({ error: 'Backend not configured' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  // 3. Check premium status for access control
  const premium = await isUserPremium(supabase, user.id);

  if (!premium) {
    // Check if user has already used their free test
    const { count } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= 1) {
      return new Response(JSON.stringify({ error: 'Free limit reached. Upgrade to Pro.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
  }

  try {
    const backendRes = await fetch(`${backendUrl.startsWith('http') ? '' : 'https://'}${backendUrl}/api/generate/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, user_id: user.id }),
    });
    const payload = await backendRes.json();

    if (backendRes.ok) {
      // For non-premium users, verify they still haven't exceeded limit (race condition protection)
      if (!premium) {
        const { count } = await supabase
          .from('tests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if ((count ?? 0) >= 1) {
          // Race condition: user already has a test from another request
          // Block the result to prevent abuse
          return new Response(JSON.stringify({ 
            error: 'Free limit reached. Upgrade to Pro.',
            limit_reached: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
      }

      // Only insert test record if limit check passed
      await supabase.from('tests').insert({
        user_id: user.id,
        type: body.exam_type as string,
        subject_set: (body.subjects as string[]) ?? [],
        started_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: backendRes.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
