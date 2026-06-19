import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { resolveAndDeleteKindeUser } from '../_shared/kinde-management.ts';

/**
 * GDPR: Șterge contul utilizatorului și toate datele asociate.
 * Cere Authorization: Bearer <session token>.
 * 1. Verifică userul din JWT
 * 2. Șterge date din tabele fără FK către auth.users (user_id doar)
 * 3. Șterge userul din auth (cascade șterge profiles, subscriptions, duel_sessions)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  let userId: string;

  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (supabaseAnonKey) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    userId = user.id;
  } else {
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token payload' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    userId = payload.sub;
  }
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(userId);
  if (authUserError || !authUserData.user) {
    return new Response(
      JSON.stringify({ error: 'Utilizator negăsit' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const authUser = authUserData.user;
  const kindeAccessToken = req.headers.get('X-Kinde-Token');
  const kindeIdFromMetadata =
    typeof authUser.user_metadata?.kinde_id === 'string' ? authUser.user_metadata.kinde_id : null;
  const email = authUser.email?.trim().toLowerCase() ?? null;

  try {
    const kindeDelete = await resolveAndDeleteKindeUser({
      kindeAccessToken,
      kindeIdFromMetadata,
      email,
    });

    if (!kindeDelete.deleted) {
      return new Response(
        JSON.stringify({
          error:
            kindeDelete.error ??
            'Nu s-a putut șterge contul Kinde. Contactează contact@kheya.ro dacă problema persistă.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Șterge din tabele care nu au FK on delete cascade către auth.users
    // Ordine: testitems (prin tests), tests, userquizitems, userchapterprogress, coin_transactions, reward_redemptions, user_gamification, duel_sessions
    await admin.from('coin_transactions').delete().eq('user_id', userId);
    await admin.from('reward_redemptions').delete().eq('user_id', userId);
    await admin.from('user_gamification').delete().eq('user_id', userId);
    await admin.from('userchapterprogress').delete().eq('user_id', userId);
    await admin.from('userquizitems').delete().eq('user_id', userId);

    const { data: tests } = await admin.from('tests').select('id').eq('user_id', userId);
    if (tests?.length) {
      const testIds = tests.map((t) => t.id);
      await admin.from('testitems').delete().in('test_id', testIds);
      await admin.from('tests').delete().eq('user_id', userId);
    }

    await admin.from('duel_sessions').delete().or(`creator_id.eq.${userId},opponent_id.eq.${userId}`);

    // 2. Șterge user din auth – cascade șterge profiles, subscriptions
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('deleteUser error:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('delete-account error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
