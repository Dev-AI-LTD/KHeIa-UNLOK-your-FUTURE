#!/usr/bin/env node
/**
 * Verifică dacă backend-ul Railway răspunde și OpenAI e configurat.
 * Usage: node scripts/verify-backend.js [URL]
 * Exemplu: node scripts/verify-backend.js https://xxx.up.railway.app
 */

const url = process.argv[2] || process.env.NODE_BACKEND_URL || 'http://localhost:8080';
const base = url.replace(/\/$/, '');

async function check(name, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${name}: ${result}`);
    return true;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`\nVerificare backend: ${base}\n`);

  const ok1 = await check('GET /api/health', async () => {
    const res = await fetch(`${base}/api/health`);
    const data = await res.json();
    if (!res.ok) throw new Error(res.status);
    if (!data.openaiConfigured) throw new Error('OPENAI_API_KEY lipsește');
    return `status=${data.status}, openai=${data.openaiConfigured}`;
  });

  const ok2 = await check('POST /api/generate/chapter fără token → 401', async () => {
    const res = await fetch(`${base}/api/generate/chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Test',
        subject_id: 'sub-test',
        level: 'liceu',
      }),
    });
    if (res.status !== 401) {
      throw new Error(
        `Așteptat 401 (SERVICE_TOKEN activ), primit ${res.status}. Redeploy Railway cu codul nou + SERVICE_TOKEN.`,
      );
    }
    return '401 Unauthorized (corect)';
  });

  const serviceToken = process.env.SERVICE_TOKEN?.trim();
  let ok3 = true;
  if (serviceToken) {
    ok3 = await check('POST /api/generate/chapter cu x-service-token', async () => {
      const res = await fetch(`${base}/api/generate/chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-token': serviceToken,
        },
        body: JSON.stringify({
          topic: 'Test',
          subject_id: 'sub-test',
          level: 'liceu',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`${res.status} ${data?.error?.message ?? ''}`);
      if (data.source === 'error') throw new Error(data.content);
      return `source=${data.source}, content length=${data.content?.length ?? 0}`;
    });
  } else {
    console.log('ℹ️  Sari testul cu token: setează SERVICE_TOKEN în env pentru verificare completă.');
  }

  console.log('');
  if (ok1 && ok2 && ok3) {
    console.log('Backend OK – Supabase poate seta NODE_BACKEND_URL la:', base);
  } else {
    console.log('Unele verificări au eșuat. Vezi docs/SERVICE_TOKEN_SETUP.md');
    process.exit(1);
  }
}

main();
