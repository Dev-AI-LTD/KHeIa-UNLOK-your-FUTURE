# App Store Connect — App Review Information (copy-paste)

**App:** KHEYA – Unlock Your Future (`com.kheia.edumat`)  
**ASC App ID:** `6774581226`

Completează în **App Store Connect → App → App Review Information**.

---

## Sign-in required

| Câmp | Valoare |
|------|---------|
| **Sign-in required** | Yes |
| **User name** | `contact@devaieood.com` |
| **Password** | *(parola setată în Kinde — nu în git)* |

---

## Notes for reviewer (English — recomandat pentru ASC)

```
SIGN-IN
- Email + password only via Kinde (hosted login).
- No OTP, magic link, or MFA for the review account below.
- No Sign in with Apple required (no third-party social login in the app).

REVIEW ACCOUNT (full Pro access — content only, not for IAP purchase testing)
- Email: contact@devaieood.com
- Password: [same as in the Sign-In fields above]
- This account receives KHEYA Pro server-side (all chapters, unlimited tests, 10-question quizzes, unlimited theory audio). No purchase is required to test educational content.
- To test subscription purchase, sign out and use a NEW free account (not this email) with a Sandbox Apple ID.

HOW TO TEST IN-APP PURCHASES (KHEYA Pro monthly / yearly)
1. Sign out OR register a new free account (not contact@devaieood.com).
2. Configure Sandbox Apple ID on device: Settings → App Store → Sandbox Account.
3. Profile tab (bottom) → "Setări / Settings".
4. Tap "KHEYA Pro — planuri și prețuri" (visible for all users, including Pro).
5. Alternative paths: Home → subject → chapter 3+ → paywall; Tests tab → second test.

HOW TO TEST MAIN FLOWS
1. Sign in with the review account.
2. Home → pick a subject → open a chapter → Theory / Quiz.
3. Tab "KHEYA" → ask a study question (AI tutor, requires network).
4. Tab "Chat" → global community chat (real-time). Long-press another user's message → Report or Block. Tap "Reguli" in the header for community guidelines.
5. Profile → Legal (Privacy, Terms, GDPR). Profile → Setări / Settings → Restore/Manage subscription (RevenueCat Customer Center).
6. Profile → Setări / Settings → "Șterge cont / Delete account" (GDPR). Same option under Profile → Legal → Cont / Account.

USER-GENERATED CONTENT (Guideline 1.2)
- Global chat is moderated: users can report messages and block other users; reports are stored for review within 24 hours.
- Contact for abuse: contact@kheya.ro

SUBSCRIPTIONS
- KHEYA Pro: monthly and yearly auto-renewing subscriptions via Apple IAP (RevenueCat).
- Paywall: Profile → Setări / Settings → "KHEYA Pro — planuri și prețuri".
- Restore purchases: Profile → Setări / Settings → "Restaurare / Gestionează abonamentul".
- Cancel: Apple ID → Subscriptions (or Customer Center in app).
- iPad (build 16): login/register open full-screen browser; keyboard works for email/password on iPad Air.

NETWORK / BACKEND
- App requires internet for login, sync, AI generation, TTS, and chat.
- If AI or chat fails, verify network; review account should still access Pro content offline-cached where available.

CONTACT
- support: contact@kheya.ro
- developer: contact@devaieood.com
```

---

## Notes (Română — dacă preferi)

```
AUTENTIFICARE: email + parolă (Kinde). Fără OTP pentru contul de review.

CONT REVIEW (Pro complet): contact@devaieood.com — parola din câmpurile Sign-In.
Pro este activ server-side; nu e nevoie de cumpărare pentru capitole/teste/audio.

CHAT COMUNITATE: apasă lung pe mesajul altui user → Raportează / Blochează. „Reguli” în header.

ABONAMENT: Paywall în Profil → Setări / Settings → „KHEYA Pro — planuri și prețuri”. Restore în același tab.

Ștergere cont: Profil → Setări / Settings → „Șterge cont / Delete account” SAU Profil → Legal → Cont / Account.
```

---

## Age Rating / Content

- **Category:** Education  
- **User-generated content:** Yes (global chat) — moderation tools in app  
- **Unrestricted web access:** No (only validated HTTPS links for official edu PDFs where implemented)  
- **Cartoon/fantasy violence, etc.:** No  

---

## Demo video / attachment

Nu e obligatoriu dacă sign-in + notes sunt clare. Opțional: scurt screen recording (login → capitol → chat long-press menu).

---

## Checklist înainte de Submit for Review

- [ ] IAP promo images uploaded in ASC (`marketing/app-store/export/promo-images/`, `docs/ASC_IAP_PROMO_IMAGES.md`)
- [ ] Build 16 TestFlight: iPad login full-screen OAuth, paywall, delete account
- [ ] `REVIEW_ACCOUNT_EMAILS` setat în Supabase + `EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS` în EAS production
- [ ] Privacy Policy URL public
- [ ] App Privacy labels completate (`docs/APP_STORE_PRIVACY_LABELS.md`)
- [ ] Subscriptions „Ready to Submit” în ASC + RevenueCat offering live
- [ ] Migrări chat `020` + `022` rulate în Supabase producție

---

## Legătură

Detalii configurare cont review: `docs/APPLE_REVIEW_ACCOUNT.md`
