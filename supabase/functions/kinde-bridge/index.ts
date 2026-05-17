import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

type KindeProfile = {
  id?: string;
  sub?: string;
  email?: string;
  preferred_email?: string;
  given_name?: string;
  family_name?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function mintSupabaseSession(
  supabaseUrl: string,
  serviceKey: string,
  email: string,
): Promise<{ access_token: string; refresh_token: string } | { error: string }> {
  const admin = createClient(supabaseUrl, serviceKey);
  const baseUrl = supabaseUrl.replace(/\/$/, '');

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    return { error: linkError?.message ?? 'Nu s-a putut genera sesiunea Supabase' };
  }

  const verifyRes = await fetch(`${baseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      type: 'magiclink',
      token_hash: tokenHash,
    }),
  });

  const verifyBody = (await verifyRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    msg?: string;
    error_description?: string;
    error?: string;
  };

  if (!verifyRes.ok) {
    const msg =
      verifyBody.msg ??
      verifyBody.error_description ??
      verifyBody.error ??
      `Verificare sesiune eșuată (${verifyRes.status})`;
    return { error: msg };
  }

  if (!verifyBody.access_token || !verifyBody.refresh_token) {
    return { error: 'Răspuns invalid: lipsesc token-urile de sesiune' };
  }

  return {
    access_token: verifyBody.access_token,
    refresh_token: verifyBody.refresh_token,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing Kinde access token' }, 401);
  }

  const kindeDomain = Deno.env.get('KINDE_DOMAIN') ?? Deno.env.get('EXPO_PUBLIC_KINDE_DOMAIN');
  if (!kindeDomain) {
    return jsonResponse(
      { error: 'KINDE_DOMAIN lipsește. Rulează: supabase secrets set KINDE_DOMAIN=https://....kinde.com' },
      500,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY lipsesc' }, 500);
  }

  if (serviceKey.startsWith('sb_publishable_')) {
    return jsonResponse(
      {
        error:
          'SUPABASE_SERVICE_ROLE_KEY este cheie publishable/anon. Folosește service_role din Supabase → Settings → API.',
      },
      500,
    );
  }

  const kindeToken = authHeader.replace('Bearer ', '');
  const profileRes = await fetch(`${kindeDomain.replace(/\/$/, '')}/oauth2/v2/user_profile`, {
    headers: { Authorization: `Bearer ${kindeToken}` },
  });

  if (!profileRes.ok) {
    return jsonResponse({ error: 'Token Kinde invalid sau expirat' }, 401);
  }

  const profile = (await profileRes.json()) as KindeProfile;
  const email = (profile.email ?? profile.preferred_email)?.trim().toLowerCase();
  if (!email) {
    return jsonResponse({ error: 'Profilul Kinde trebuie să conțină email' }, 400);
  }

  const displayName =
    [profile.given_name, profile.family_name].filter(Boolean).join(' ').trim() ||
    email.split('@')[0];

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    return jsonResponse(
      {
        error: `listUsers: ${listError.message}. Verifică SUPABASE_SERVICE_ROLE_KEY (service_role, nu anon).`,
      },
      500,
    );
  }

  const existing = listed.users.find((u) => u.email?.toLowerCase() === email);
  if (!existing) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        kinde_id: profile.id ?? profile.sub,
      },
    });
    if (createError || !created.user) {
      return jsonResponse({ error: createError?.message ?? 'Nu s-a putut crea utilizatorul' }, 500);
    }
  }

  const session = await mintSupabaseSession(supabaseUrl, serviceKey, email);
  if ('error' in session) {
    return jsonResponse({ error: session.error }, 500);
  }

  return jsonResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
});
