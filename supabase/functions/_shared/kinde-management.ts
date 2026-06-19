type KindeProfile = {
  id?: string;
  sub?: string;
  email?: string;
  preferred_email?: string;
};

export function getKindeDomain(): string | null {
  const domain = Deno.env.get('KINDE_DOMAIN') ?? Deno.env.get('EXPO_PUBLIC_KINDE_DOMAIN');
  return domain?.replace(/\/$/, '') ?? null;
}

export async function getKindeProfileFromToken(
  domain: string,
  accessToken: string,
): Promise<{ id: string; email?: string } | null> {
  const res = await fetch(`${domain}/oauth2/v2/user_profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const profile = (await res.json()) as KindeProfile;
  const id = profile.id ?? profile.sub;
  if (!id) return null;

  return {
    id,
    email: (profile.email ?? profile.preferred_email)?.trim().toLowerCase(),
  };
}

export async function getKindeM2MToken(domain: string): Promise<string | null> {
  const clientId = Deno.env.get('KINDE_M2M_CLIENT_ID');
  const clientSecret = Deno.env.get('KINDE_M2M_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const res = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `${domain}/api`,
    }),
  });

  if (!res.ok) {
    console.error('Kinde M2M token error:', await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function findKindeUserIdByEmail(
  domain: string,
  m2mToken: string,
  email: string,
): Promise<string | null> {
  const res = await fetch(
    `${domain}/api/v1/users?email=${encodeURIComponent(email)}&page_size=1`,
    {
      headers: {
        Authorization: `Bearer ${m2mToken}`,
        Accept: 'application/json',
      },
    },
  );

  if (!res.ok) {
    console.error('Kinde find user error:', await res.text());
    return null;
  }

  const data = (await res.json()) as { users?: Array<{ id?: string }> };
  return data.users?.[0]?.id ?? null;
}

export async function deleteKindeUser(
  domain: string,
  m2mToken: string,
  kindeUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${domain}/api/v1/user?id=${encodeURIComponent(kindeUserId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      Accept: 'application/json',
    },
  });

  if (res.ok || res.status === 404) return { ok: true };

  const text = await res.text();
  return { ok: false, error: text || `HTTP ${res.status}` };
}

export async function resolveAndDeleteKindeUser(options: {
  kindeAccessToken?: string | null;
  kindeIdFromMetadata?: string | null;
  email?: string | null;
}): Promise<{ deleted: boolean; error?: string }> {
  const domain = getKindeDomain();
  if (!domain) {
    return { deleted: false, error: 'KINDE_DOMAIN lipsește pe server.' };
  }

  let kindeUserId = options.kindeIdFromMetadata?.trim() || null;

  if (!kindeUserId && options.kindeAccessToken) {
    const profile = await getKindeProfileFromToken(domain, options.kindeAccessToken);
    kindeUserId = profile?.id ?? null;
  }

  const m2mToken = await getKindeM2MToken(domain);
  if (!m2mToken) {
    return {
      deleted: false,
      error:
        'Kinde M2M nu este configurat (KINDE_M2M_CLIENT_ID / KINDE_M2M_CLIENT_SECRET). Contul din aplicație se șterge, dar emailul rămâne în Kinde.',
    };
  }

  if (!kindeUserId && options.email) {
    kindeUserId = await findKindeUserIdByEmail(domain, m2mToken, options.email);
  }

  if (!kindeUserId) {
    return { deleted: false, error: 'Nu s-a găsit utilizatorul Kinde pentru ștergere.' };
  }

  const result = await deleteKindeUser(domain, m2mToken, kindeUserId);
  if (!result.ok) {
    return { deleted: false, error: result.error ?? 'Ștergerea din Kinde a eșuat.' };
  }

  return { deleted: true };
}
