# SERVICE_TOKEN — setup, deploy, verificare

Token partajat între **Supabase Edge Functions** și **Railway (node-backend)**. Clientul mobil **nu** primește acest token.

Header așteptat de backend: `x-service-token: <SERVICE_TOKEN>`

---

## Stare proiect KHEYA (verificat 2026-06-02)

| Componentă | Status |
|------------|--------|
| Cod backend `serviceAuth` pe `/api/generate/*` și `/api/tts/speak` | ✅ în repo |
| Secret Supabase `SERVICE_TOKEN` | ✅ prezent (`supabase secrets list`) |
| Secret Supabase `NODE_BACKEND_URL` | ✅ prezent |
| Edge Functions deployate | ✅ `generate-chapter-content`, `generate-chapter-summary`, `generate-test`, `tts-speak`, `kinde-bridge`, … |
| Edge Function `generate-chat` | ⚠️ deploy după pull (proxy KHEYA AI cu token) |
| Railway `SERVICE_TOKEN` + cod nou | ⚠️ **verifică** — health OK, dar `POST /api/generate/chapter` **fără token** a răspuns 200 (posibil deploy vechi pe Railway) |

---

## 1. Generează token

```powershell
# PowerShell — token random 48 bytes hex
-join ((1..48) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

Păstrează-l într-un password manager. **Același** string peste tot.

---

## 2. Setează secretul (ambele părți)

### Supabase (proiect `lbvltfvdrsdrmpuglboh`)

```powershell
cd C:\Users\octav\Desktop\KHEIA3\KHeIa-UNLOK-your-FUTURE
supabase login
supabase link --project-ref lbvltfvdrsdrmpuglboh

supabase secrets set SERVICE_TOKEN="PASTE_TOKEN_HERE"
# deja setat dacă apare în `supabase secrets list`
```

### Railway (service node-backend)

1. [Railway Dashboard](https://railway.app) → proiect **KHEYA** → service backend  
2. **Variables** → `SERVICE_TOKEN` = același token  
3. **Redeploy** (Deploy → Redeploy) după orice schimbare

Variabile obligatorii Railway (minim):

- `SERVICE_TOKEN`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY` (dacă folosești Gemini)
- `PORT=8080`

---

## 3. Deploy Edge Functions

```powershell
cd C:\Users\octav\Desktop\KHEIA3\KHeIa-UNLOK-your-FUTURE

supabase functions deploy generate-chapter-content
supabase functions deploy generate-chapter-summary
supabase functions deploy generate-test
supabase functions deploy tts-speak
supabase functions deploy generate-chat
supabase functions deploy kinde-bridge
supabase functions deploy delete-account
supabase functions deploy webhook-revenuecat
```

### Alte secrete utile (dacă lipsesc)

```powershell
supabase secrets set REVIEW_ACCOUNT_EMAILS=contact@devaieood.com
supabase secrets set NODE_BACKEND_URL=https://kheia-unlok-your-future-production.up.railway.app
supabase secrets set TTS_VOICE=nova
# OPENAI_API_KEY deja în secrets pentru tts-speak
```

---

## 4. Verificare automată

### A) Health Railway (fără token)

```powershell
node scripts/verify-backend.js https://kheia-unlok-your-future-production.up.railway.app
```

Așteptat: `GET /api/health` → `status=ok`, `openaiConfigured=true`.

### B) Generare **fără** token → trebuie 401 (după deploy corect)

```powershell
curl -s -o NUL -w "%{http_code}" -X POST `
  "https://kheia-unlok-your-future-production.up.railway.app/api/generate/chapter" `
  -H "Content-Type: application/json" `
  -d "{\"topic\":\"Test\",\"subject_id\":\"x\",\"level\":\"liceu\"}"
```

Așteptat: **`401`** (nu 200).

### C) Generare **cu** token (doar test manual)

```powershell
curl -X POST "https://kheia-unlok-your-future-production.up.railway.app/api/generate/chapter" `
  -H "Content-Type: application/json" `
  -H "x-service-token: PASTE_TOKEN_HERE" `
  -d "{\"topic\":\"Test\",\"subject_id\":\"x\",\"level\":\"liceu\"}"
```

Așteptat: **200** + JSON cu `content`.

### D) Edge Function (necesită user logat în app)

În app, după login:

1. **Generează teorie** pe un capitol → OK  
2. **Ascultă teoria** (TTS) → OK  
3. Tab **KHEYA** → întrebare → răspuns AI → OK (după deploy `generate-chat`)

Erori tipice:

| Simptom | Cauză |
|---------|--------|
| `SERVICE_TOKEN missing` în logs Edge | Secret lipsă în Supabase |
| 401 din Edge / backend | Token diferit Railway vs Supabase |
| KHEYA chat „Eroare server (401)” | App încă apelează Railway direct — folosește build cu `generate-chat` |
| TTS 401 | Railway fără token sau redeploy vechi |

---

## 5. Fluxuri și cine apelează ce

| Funcție app | Client apelează | Token |
|-------------|-----------------|-------|
| Generează capitol/teorie/test | `supabase.functions.invoke('generate-*')` | Edge → Railway cu `x-service-token` |
| TTS | `functions/v1/tts-speak` | OpenAI key în Supabase (nu Railway) |
| KHEYA AI chat | `functions/v1/generate-chat` | Edge → Railway cu token |
| Chat global | Supabase DB direct | JWT user (fără SERVICE_TOKEN) |

**Important:** `EXPO_PUBLIC_NODE_BACKEND_URL` nu mai trebuie folosit din app pentru generare/TTS; poate rămâne pentru debug. Chat-ul KHEYA nu trebuie să apeleze `/api/generate/chat` direct din mobil.

---

## 6. Rotație token (dacă a fost expus)

1. Generează token nou  
2. `supabase secrets set SERVICE_TOKEN=...`  
3. Railway → update `SERVICE_TOKEN` → Redeploy  
4. `supabase functions deploy` (toate care folosesc backend-ul)  
5. Re-testează B + D de mai sus  

---

## Fișiere relevante

- `node-backend/src/middleware/auth.middleware.ts`
- `supabase/functions/generate-*/index.ts`
- `supabase/functions/generate-chat/index.ts`
- `.env.example` (documentație, nu valori reale)
