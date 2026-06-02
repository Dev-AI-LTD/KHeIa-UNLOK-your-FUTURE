# App Store Connect — App Privacy (Nutrition Labels)

Completează în **App Store Connect → App Privacy → Get Started → Edit**.

Aliniază cu `src/content/legal.ts`, `landing/privacy.html` și comportamentul real al app-ului (KHEYA v0.3.5).

---

## Pas 0 — Întrebări inițiale

| Întrebare ASC | Răspuns recomandat |
|---------------|-------------------|
| **Collect data from this app?** | **Yes** |
| **Use data for tracking?** | **No** (fără IDFA, fără SDK analytics/ads) |
| **Link data to user identity?** | **Yes** (pentru tipurile de mai jos, legate de cont) |

---

## Pas 1 — Tipuri de date (bifează și completează detaliile)

### Contact Info

| Sub-tip | Colectezi? | Legat de identitate | Tracking | Scopuri (bifează) |
|---------|------------|---------------------|----------|-------------------|
| **Email Address** | Da | Da | Nu | App Functionality, Account Management |

*Sursă: Kinde login (părinte/tutore).*

---

### User Content

| Sub-tip | Colectezi? | Legat de identitate | Tracking | Scopuri |
|---------|------------|---------------------|----------|---------|
| **Photos or Videos** | Da | Da | Nu | App Functionality |

*Sursă: poză profil opțională (`expo-image-picker` → bucket Supabase `avatars`).*

| Sub-tip | Colectezi? | Legat de identitate | Tracking | Scopuri |
|---------|------------|---------------------|----------|---------|
| **Other User Content** | Da | Da | Nu | App Functionality |

Include:
- mesaje **chat global** (`messages.body`);
- întrebări în tab **KHEYA** (trimise la AI);
- texte pentru **TTS** („Ascultă teoria”);
- nume afișat, username chat, școală/oraș (profil/clasament).

---

### Identifiers

| Sub-tip | Colectezi? | Legat de identitate | Tracking | Scopuri |
|---------|------------|---------------------|----------|---------|
| **User ID** | Da | Da | Nu | App Functionality |

*UUID Supabase / Kinde, nu IDFA.*

---

### Purchases

| Sub-tip | Colectezi? | Legat de identitate | Tracking | Scopuri |
|---------|------------|---------------------|----------|---------|
| **Purchase History** | Da | Da | Nu | App Functionality |

*Abonamente KHEYA Pro via **RevenueCat** + Apple IAP; starea se sincronizează în Supabase.*

---

### Usage Data

| Sub-tip | Colectezi? | Legat de identitate | Tracking | Scopuri |
|---------|------------|---------------------|----------|---------|
| **Product Interaction** | Da | Da | Nu | App Functionality, Analytics* |

*Progres capitole, scoruri quiz/teste, streak gamification, duel invite usage.*

\*Dacă nu folosești date pentru „îmbunătățire produs” în sens ASC, bifează doar **App Functionality**.

---

## Pas 2 — Ce NU bifezi (dacă nu e în app)

| Categorie | De ce Nu |
|-----------|----------|
| Location (Precise/Coarse) | Nu folosiți GPS; orașul e text introdus manual |
| Contacts | Nu |
| Browsing / Search History | Nu |
| Financial Info (card) | Plata e doar prin Apple; nu stocați carduri |
| Health & Fitness | Nu |
| Sensitive Info | Nu |
| Diagnostics / Crash Data | Nu (fără Sentry/Crashlytics în cod) |
| Advertising Data | Nu reclame terțe |

---

## Pas 3 — Third-party partners (la fiecare tip de date)

Când ASC cere „partajare cu terți”, menționează furnizori pentru **App Functionality** (nu tracking):

| Furnizor | Rol |
|----------|-----|
| **Supabase** | DB, auth session, chat, storage avatar, Edge Functions |
| **Kinde** | Autentificare email/parolă |
| **RevenueCat** | Abonamente IAP |
| **OpenAI** | TTS + generare conținut / chat AI (când userul folosește funcțiile) |
| **Google (Gemini)** | Generare conținut (dacă backend-ul folosește Gemini) |
| **Railway** | Hosting node-backend (procesare server-side) |

---

## Pas 4 — UGC (chat global) — notă pentru reviewer

În **App Review Information → Notes**, menționează (vezi `docs/APP_STORE_REVIEW_NOTES.md`):

- Chat public cu **raportare mesaj** + **blocare utilizator** + reguli comunitate în app.
- Moderare: raporturile în `chat_message_reports`; contact `contact@kheya.ro`.

Nu e un câmp separat în Privacy Labels, dar reduce respingerea la Guideline **1.2**.

---

## Pas 5 — URL-uri obligatorii în App Information

| Câmp ASC | URL recomandat (după publicare landing) |
|----------|----------------------------------------|
| **Privacy Policy URL** | `https://kheya.ro/privacy` sau GitHub Pages la `landing/privacy.html` |
| **Terms of Use (EULA)** | `https://kheya.ro/terms` sau link Apple standard + termeni în app |
| **Support URL** | `https://kheya.ro` sau `mailto:contact@kheya.ro` |

Textele există în app: **Profil → Legal** și în `landing/privacy.html`.

---

## Verificare rapidă înainte de Submit

- [ ] Privacy Policy URL deschide pagina publică (nu 404).
- [ ] Label-urile includ **Email**, **User Content** (chat + AI + TTS + foto profil), **User ID**, **Purchases**, **Product Interaction**.
- [ ] **Tracking = No** peste tot.
- [ ] Textul din politică menționează OpenAI/RevenueCat/Kinde/Supabase (deja în `legal.ts`).

---

## Google Play (Data safety) — mapare scurtă

| ASC (iOS) | Play Console (Android) |
|-----------|-------------------------|
| Email | Personal info → Email |
| User Content | Personal info → Photos (optional) + Messages / Other |
| User ID | Personal info → User IDs |
| Purchase History | Financial info → Purchase history |
| Product Interaction | App activity → App interactions |

Colectare: **Required for core features**. Sharing: **Yes, with service providers**. Encryption in transit: **Yes**.
