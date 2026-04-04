import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // REQUIRED: verify webhook using REVENUECAT_WEBHOOK_AUTH secret
    // This is mandatory to prevent attackers from granting themselves premium access
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
    if (!webhookSecret) {
      console.error('REVENUECAT_WEBHOOK_AUTH is not configured - webhook rejected for security');
      return new Response('Webhook not configured', { status: 500 });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const isValid = authHeader === webhookSecret || authHeader === `Bearer ${webhookSecret}`;
    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await req.json();

    const { event } = body;
    const userId = event.app_user_id;
    const entitlementId = Deno.env.get('REVENUECAT_ENTITLEMENT_ID') ?? 'pro'; // Configurable entitlement ID

    if (!userId) {
      return new Response('No user ID', { status: 400 });
    }

    // Determine new subscription type
    let subscriptionType = 'free';
    if (event.entitlement_ids && event.entitlement_ids.includes(entitlementId)) {
      const productPlan = String(event.product_id ?? '').toLowerCase();
      if (productPlan.includes('yearly')) subscriptionType = 'yearly';
      else if (productPlan.includes('monthly')) subscriptionType = 'monthly';
      else if (productPlan.includes('lifetime') || productPlan.includes('edumat')) subscriptionType = 'full_edumat';
      else subscriptionType = 'monthly'; // Default if pro entitlement is present
    }

    // Update Profile (using Service Role via getSupabaseClient to bypass RLS)
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        subscription_type: subscriptionType,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileErr) {
      console.error('Failed to update profile:', profileErr);
      return new Response(JSON.stringify({ error: 'Failed to update profile', details: profileErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Update Subscriptions table for history
    const { error: subscriptionErr } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_type: subscriptionType,
      status: subscriptionType === 'free' ? 'expired' : 'active',
      current_period_end: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      revenuecat_customer_id: event.app_user_id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (subscriptionErr) {
      console.error('Failed to upsert subscription:', subscriptionErr);
      // Include warning in response but still return success since profile was updated
      return new Response(JSON.stringify({ 
        success: true, 
        updated: subscriptionType,
        warning: 'Failed to update subscription history',
        subscriptionError: subscriptionErr.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, updated: subscriptionType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
