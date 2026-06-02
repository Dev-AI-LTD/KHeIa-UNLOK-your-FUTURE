# Cont Apple Review — email + parolă + Premium complet

Folosește un cont dedicat ca reviewerii Apple să intre **fără OTP** și să vadă **tot conținutul Pro** (fără paywall, fără cumpărare sandbox obligatorie).

## Credențiale recomandate

| Câmp | Valoare (exemplu — schimbă parola în producție) |
|------|--------------------------------------------------|
| **Email (User Name în App Store Connect)** | `contact@devaieood.com` |
| **Parolă** | parola setată în Kinde (**Set temporary password**) — nu o pune în git |

Același email trebuie configurat în:
- **Kinde** (utilizator cu parolă)
- **Supabase secret** `REVIEW_ACCOUNT_EMAILS` (vezi mai jos)
- **EAS / .env** `EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS` (pentru build-ul din TestFlight)

---

## Pas 1 — Kinde (autentificare)

1. [Kinde Dashboard](https://app.kinde.com) → aplicația KHEYA.
2. **Authentication** → activează doar **Email** (username + password).
3. **Dezactivează** passwordless / magic link / OTP / MFA pentru acest flux (obligatoriu pentru review).
4. **Users** → **Add user**:
   - Email: `contact@devaieood.com`
   - Parolă: ce pui în App Store Connect
5. **Settings → Applications** → Callback URLs: `kheia://kinde_callback`

---

## Pas 2 — Supabase (Premium automat la login)

La **primul login** (și la fiecare login), funcția `kinde-bridge` setează Premium pentru emailurile din lista de review.

```bash
npx supabase secrets set REVIEW_ACCOUNT_EMAILS=contact@devaieood.com
npx supabase functions deploy kinde-bridge
```

Dacă userul există deja fără Premium, rulează o dată în **SQL Editor**:

```sql
-- docs/sql/grant-review-premium.sql (înlocuiește emailul)
```

sau loghează-te o dată în app după deploy la `kinde-bridge` — Premium se aplică automat.

---

## Pas 3 — Build app (EAS)

Adaugă în **EAS Environment** (production / preview) sau în `.env` local:

```
EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS=contact@devaieood.com
```

Reconstruiește iOS dacă schimbi variabila (`eas build --platform ios`).

---

## Pas 4 — App Store Connect → App Review Information

| Câmp | Valoare |
|------|---------|
| **Sign-in required** | Yes |
| **User name** | `contact@devaieood.com` (emailul complet) |
| **Password** | parola setată în Kinde |

**Notes (copy-paste):** vezi varianta completă (UGC chat, restore, GDPR) în **`docs/APP_STORE_REVIEW_NOTES.md`**.

Scurt:

```
Sign-in: email + password only (Kinde). No OTP or magic link for this account.

This review account has full KHEYA Pro access (all chapters, unlimited tests, 10-question quizzes, unlimited theory audio) — granted server-side for App Review. No in-app purchase is required to test content.

Global chat: long-press message → Report / Block. Header → Reguli.

Optional: Sandbox Apple ID can be used separately to test subscription purchase flow.
```

---

## Verificare

1. Instalează build-ul TestFlight.
2. **Autentificare** → email + parolă review.
3. **Profil** → ar trebui „KHEYA Pro activ (full_edumat)”.
4. Deschide capitol 3+ → **fără** paywall.
5. Pornește mai mult de 1 test → permis.

---

## Tehnic (ce face codul)

- `kinde-bridge`: `subscription_type = full_edumat`, `referral_premium_until = 2099`, rând activ în `subscriptions`.
- App: `isReviewAccountEmail()` + `hasSupabaseGrantedPremium()` — RevenueCat **nu** resetează Premium-ul la sync dacă nu există achiziție în magazin.

---

## Securitate

- Folosește un email dedicat, parolă puternică, doar pentru review.
- Nu publica parola în repo; doar în Kinde și App Store Connect.
- Poți schimba emailul implicit editând `REVIEW_ACCOUNT_EMAILS` / `EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS`.
