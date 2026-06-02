import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseUser } from '../_shared/auth.ts';

function requireServiceTokenHeaders(): Record<string, string> {
  const token = (Deno.env.get('SERVICE_TOKEN') ?? '').trim();
  if (!token) {
    throw new Error('SERVICE_TOKEN missing.');
  }
  return { 'x-service-token': token };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  const user = await getSupabaseUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const backendUrl = (Deno.env.get('NODE_BACKEND_URL') ?? '').trim();
  if (!backendUrl) {
    return new Response(JSON.stringify({ error: 'NODE_BACKEND_URL missing.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const serviceHeaders = requireServiceTokenHeaders();
    const base = backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`;
    const backendRes = await fetch(`${base.replace(/\/$/, '')}/api/generate/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...serviceHeaders },
      body: JSON.stringify({ messages: body.messages ?? [] }),
    });

    const payload = await backendRes.json();
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: backendRes.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backend error';
    return new Response(JSON.stringify({ error: message, content: '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
