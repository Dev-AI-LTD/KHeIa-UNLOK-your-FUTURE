# Verificare deployment – Supabase, Railway, Edge Functions

## Checklist pre-deploy

### 1. Railway (Node backend)

- [ ] Build reușit (Dockerfile cu multi-stage)
- [ ] Variabile setate: `OPENAI_API_KEY`, `GEMINI_API_KEY`
- [ ] Port: 8080
- [ ] Domain generat (ex: `https://xxx.up.railway.app`)

### 2. Supabase (Edge Functions)

- [ ] **Secrets** (Project Settings → Edge Functions → Secrets):
  - `NODE_BACKEND_URL` = URL Railway (ex: `https://kheia-unlok-your-future-production.up.railway.app`)
  - `SUPABASE_SERVICE_ROLE_KEY` = (verifică că există)
  - (Opțional) `REVENUECAT_WEBHOOK_AUTH` = secret pentru verificarea webhook-ului RevenueCat
- [ ] Edge Functions deployate:
  - `generate-chapter-content`
  - `generate-chapter-summary`
  - `generate-test` (dacă folosești teste)
  - `webhook-revenuecat` (pentru abonamente)

### 3. App (.env / supabase/.env)

- [ ] `EXPO_PUBLIC_NODE_BACKEND_URL` = URL Railway (pentru **Chat KHEYA**)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` și `EXPO_PUBLIC_SUPABASE_ANON_KEY` corecte

---

## Fluxuri care folosesc backend-ul

| Funcție | Edge Function | Backend endpoint | Folosit în app |
|---------|---------------|------------------|----------------|
| Generează capitol | `generate-chapter-content` | `/api/generate/chapter` | generate-chapter.tsx |
| Generează teorie | `generate-chapter-summary` | `/api/generate/summary` | generate-theory.tsx |
| Chat KHEYA | — | `/api/generate/chat` | kheia.tsx (direct) |
| Test EN/BAC | `generate-test` | `/api/generate/test` | test/[testId] (stub) |

**Important:** Chat-ul KHEYA apelează direct backend-ul. Dacă `EXPO_PUBLIC_NODE_BACKEND_URL` nu e setat, chat-ul nu funcționează.

---

## Teste manuale

### 1. Health check (Railway)

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

Răspuns așteptat:
```json
{"status":"ok","openaiConfigured":true}
```

### 2. Generează capitol (prin app)

1. Deschide o materie → **Generează capitol**
2. Scrie un topic (ex: „Fracții”)
3. Apasă **Generează capitol**
4. Ar trebui să apară capitolul în listă (fără eroare)

### 3. Generează teorie (prin app)

1. Deschide un capitol → **Teorie** → **Generează teorie**
2. Apasă **Generează teorie**
3. Ar trebui să se redea la ecranul de teorie cu conținut generat

### 4. Chat KHEYA (prin app)

1. Tab **KHEYA**
2. Scrie o întrebare și trimite
3. Ar trebui să primești un răspuns (dacă `EXPO_PUBLIC_NODE_BACKEND_URL` e setat)

---

## Erori frecvente

| Eroare | Cauză | Soluție |
|--------|-------|---------|
| „Nu s-a putut genera capitolul” | Edge Function nu poate apela Railway | Verifică `NODE_BACKEND_URL` în Supabase |
| „Serviciul de chat nu este configurat” | App nu are URL backend | Setează `EXPO_PUBLIC_NODE_BACKEND_URL` în .env |
| „openaiConfigured: false” | Lipsă OPENAI_API_KEY în Railway | Adaugă variabila în Railway |
| Build failed: „dist not found” | Dockerfile vechi | Folosește Dockerfile cu multi-stage build |
| Build failed: „@types/cors” | Lipsă tipuri TypeScript | `npm install --save-dev @types/cors` |

---

## Deploy Edge Functions manual

```powershell
cd c:\Users\octav\KHeIa-UNLOK-your-FUTURE
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-chapter-content
supabase functions deploy generate-chapter-summary
supabase functions deploy generate-test
supabase functions deploy delete-account
```
