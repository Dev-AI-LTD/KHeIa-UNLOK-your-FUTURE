# Ghid Deployment: GitHub + Railway

## Ce se deployează unde

| Componentă        | Locație           | Descriere                         |
|------------------|-------------------|-----------------------------------|
| **Cod sursă**    | GitHub            | Tot proiectul (KHEYA – Unlock Your Future) |
| **Node backend**  | Railway           | API-ul pentru AI (OpenAI)         |
| **Supabase**     | Supabase Cloud    | DB, Edge Functions (deja configurat) |
| **App mobil**    | Expo / EAS Build  | Pentru App Store / Play Store      |

---

## Pas 1: Pregătește proiectul pentru GitHub

### 1.1 Inițializează Git (dacă nu e deja)

```powershell
cd c:\Users\octav\KHeIa-UNLOK-your-FUTURE
git init
```

### 1.2 Verifică .gitignore

- `.env` și `supabase/.env` **NU** trebuie comise (conțin chei secrete).
- `.gitignore` exclude deja aceste fișiere.

### 1.3 Adaugă remote și push

```powershell
git add .
git commit -m "Initial commit - KHEYA – Unlock Your Future"
git branch -M main
git remote add origin https://github.com/boctavian2014-ux/KHeIa-UNLOK-your-FUTURE.git
git push -u origin main
```

### 1.4 Verificare

- Mergi pe https://github.com/boctavian2014-ux/KHeIa-UNLOK-your-FUTURE
- Confirmă că **nu** există fișiere `.env` în repo (sunt doar în `.gitignore`).

---

## Pas 2: Deploy Node backend pe Railway

### 2.1 Conectează GitHub

1. Intră pe https://railway.app
2. **Start a New Project** → **Deploy from GitHub repo**
3. Autorizează GitHub și selectează `KHeIa-UNLOK-your-FUTURE`

### 2.2 Configurează serviciul

Railway va detecta automat un repo. Trebuie să îi spunem să ruleze doar `node-backend`:

1. **Settings** → **Root Directory** → `node-backend`
2. **Build Command** → `npm run build`
3. **Start Command** → `npm start`
4. **Watch Paths** (opțional): `node-backend/**`

### 2.3 Variabile de mediu

În **Variables** adaugă:

| Variabilă        | Valoare                             |
|------------------|-------------------------------------|
| `OPENAI_API_KEY` | `sk-proj-3JUHEN...` (din supabase/.env) |
| `GEMINI_API_KEY` | `AIzaSy...` (din supabase/.env)     |
| `PORT`           | `8080` (sau lasă implicit)          |

### 2.4 Obține URL-ul

1. **Settings** → **Networking** → **Generate Domain**
2. Vei primi un URL de tip: `https://kheia-node-backend-xxxx.up.railway.app` sau `https://kheia-unlok-your-future-production.up.railway.app`
3. Copiază acest URL.

### 2.5 După git push – Railway redeploy

Dacă proiectul Railway este **conectat la GitHub** (Deploy from GitHub repo):

- La fiecare **push pe branch-ul monitorizat** (de obicei `main`), Railway face **redeploy automat** al `node-backend`.
- Nu e nevoie să faci nimic manual: după `git push origin main`, intră pe [railway.app](https://railway.app) → proiectul tău → **Deployments** și verifică că ultimul deploy e „Success”.
- Dacă vrei redeploy manual: **Deployments** → **Redeploy** pe ultima versiune.

---

## Pas 3: Configurează Supabase

### 3.1 Setează Edge Function secrets

În **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**, adaugă:

| Secret | Value | Notă |
|--------|--------|------|
| `NODE_BACKEND_URL` | `https://kheia-unlok-your-future-production.up.railway.app` | URL-ul backend-ului (Railway). Folosit de `generate-chapter-content`, `generate-chapter-summary`, `generate-test`. |
| `SUPABASE_SERVICE_ROLE_KEY` | (din Project Settings → API) | De obicei există deja; verifică. Folosit de `webhook-revenuecat`, `delete-account`, `_shared/supabase-client`. |
| `REVENUECAT_WEBHOOK_AUTH` | (opțional) un secret ales de tine | Dacă îl setezi, webhook-ul RevenueCat verifică header-ul `Authorization` (sau `Bearer <secret>`). Configurează același secret în RevenueCat la webhook URL. |

**Pași:** Add new secret → Name + Value → Save. După ce adaugi sau modifici secrets, redeployează Edge Functions dacă e cazul.

### 3.2 Redeployează Edge Functions (dacă e nevoie)

```powershell
supabase functions deploy generate-chapter-content
supabase functions deploy generate-chapter-summary
```

---

## Pas 4: Configurează aplicația mobilă

### 4.1 EXPO_PUBLIC_NODE_BACKEND_URL (opțional)

Dacă aplicația Expo apelează direct backend-ul (ex. chat), setează în `.env`:

```
EXPO_PUBLIC_NODE_BACKEND_URL=https://kheia-node-backend-xxxx.up.railway.app
```

În arhitectura actuală, app-ul apelează prin **Supabase Edge Functions**, care la rândul lor apelează backend-ul. Deci `NODE_BACKEND_URL` în Supabase este suficient.

---

## Rezumat flux

```
[App mobil] → [Supabase Edge Functions] → [Node backend pe Railway] → [OpenAI]
```

- **GitHub**: cod sursă
- **Railway**: doar `node-backend/` (API AI)
- **Supabase**: DB + Edge Functions

---

## Verificare

1. **Backend**: `https://your-railway-url.up.railway.app/api/health`  
   → ar trebui să returneze `{ "status": "ok", "openaiConfigured": true }`

2. **App**: Generează un capitol sau un rezumat de teorie – ar trebui să funcționeze dacă totul e configurat corect.
