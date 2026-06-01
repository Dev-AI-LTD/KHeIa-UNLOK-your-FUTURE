import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { getSupabaseUser } from '../_shared/auth.ts';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_type, referral_premium_until')
    .eq('id', user.id)
    .maybeSingle();

  const planType = (profile?.subscription_type as string) ?? 'free';
  const referralUntil = profile?.referral_premium_until as string | null;
  const referralActive = referralUntil && new Date(referralUntil) > new Date();

  const reviewEmails = (Deno.env.get('REVIEW_ACCOUNT_EMAILS') ?? 'apple.review@kheia.ro')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = user.email?.toLowerCase() ?? '';
  const isReviewAccount = reviewEmails.includes(email);

  const premium = isReviewAccount || planType !== 'free' || referralActive;

  if (!premium) {
    const { count } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count ?? 0) >= 1) {
      return new Response(
        JSON.stringify({
          error: 'Free limit reached. Upgrade to Pro.',
          limit_reached: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      );
    }
  }

  if (!backendUrl) {
    return new Response(JSON.stringify({ error: 'Backend not configured' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const backendRes = await fetch(`${backendUrl.startsWith('http') ? '' : 'https://'}${backendUrl}/api/generate/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, user_id: user.id }),
    });
    const payload = await backendRes.json();

    if (backendRes.ok) {
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
