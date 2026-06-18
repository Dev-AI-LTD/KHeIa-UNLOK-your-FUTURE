# App Store Connect — App Review Information (copy-paste)

**App:** KHEYA – Unlock Your Future (`com.kheia.edumat`)  
**ASC App ID:** `6774581226`  
**Submission ID:** `c2a26678-324f-41c4-9ce8-6c05bcbd76c2`

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

REVIEW ACCOUNT (full Pro access — content only, NOT for IAP purchase testing)
- Email: contact@devaieood.com
- Password: [same as in the Sign-In fields above]
- This account receives KHEYA Pro server-side (all chapters, unlimited tests, 10-question quizzes, unlimited theory audio). No purchase is required to test educational content.
- To test subscription purchase, sign out and use a NEW free account (not this email) with a Sandbox Apple ID.

HOW TO TEST IN-APP PURCHASES (KHEYA Pro monthly / yearly) — Guideline 2.1(b)
1. Sign out OR register a new free account (not contact@devaieood.com).
2. Configure Sandbox Apple ID on device: Settings → App Store → Sandbox Account.
3. Profile tab (bottom) → "Setări / Settings" (swipe profile tabs if needed).
4. Tap "KHEYA Pro — planuri și prețuri".
5. Select Monthly or Yearly and complete sandbox purchase.
6. Alternative paths: Home → subject → chapter 3+ → paywall; Tests tab → second test.

HOW TO TEST ACCOUNT DELETION — Guideline 5.1.1(v)
Screen recording attached. In-app path (no website required):
1. Sign in (use a test account if demonstrating deletion; review account is for content only).
2. Profile tab → Evoluție → scroll to "Cont / Account" → "Șterge cont / Delete account"
   OR Profile → Setări / Settings → "Șterge cont / Delete account"
   OR Profile → Legal → Cont / Account → same option.
3. Confirm twice → account and data deleted → returned to login.

SUBSCRIPTIONS & LEGAL — Guideline 3.1.2(c)
- KHEYA Pro Monthly and Yearly: auto-renewing subscriptions via Apple IAP (RevenueCat).
- Paywall shows subscription name, length, and price before purchase.
- Privacy Policy: https://www.kheya.ro/politicadeconfidentialitate (in-app + ASC metadata)
- Terms of Use (EULA): https://kheya.ro/terms (in-app + App Description + paywall footer)
- Restore: Profile → Setări / Settings → "Restaurare / Gestionează abonamentul"
- Cancel: Apple ID → Subscriptions

HOW TO TEST MAIN FLOWS
1. Sign in with the review account.
2. Home → pick a subject → open a chapter → Theory / Quiz.
3. Tab "KHEYA" → ask a study question (AI tutor, requires network).
4. Tab "Chat" → global community chat. Long-press message → Report or Block. Tap "Reguli" in header.
5. Profile → Legal (Privacy, Terms online links + embedded text).

USER-GENERATED CONTENT (Guideline 1.2)
- Global chat moderated: report + block; contact@kheya.ro

NETWORK / BACKEND
- Internet required for login, sync, AI, TTS, chat.

CONTACT
- support: contact@kheya.ro
- developer: contact@devaieood.com
```

---

## Notes (Română)

```
AUTENTIFICARE: email + parolă (Kinde). Fără OTP pentru contul de review.

CONT REVIEW (Pro complet): contact@devaieood.com — parola din câmpurile Sign-In.
Pro este activ server-side; nu e nevoie de cumpărare pentru capitole/teste/audio.

TEST IAP: deconectare → cont nou + Sandbox Apple ID → Profil → Setări → KHEYA Pro — planuri și prețuri.

ȘTERGERE CONT: Profil → Evoluție → Cont / Account SAU Setări → „Șterge cont / Delete account”. Înregistrare ecran atașată.

TERMENI: https://kheya.ro/terms | CONFIDENȚIALITATE: https://www.kheya.ro/politicadeconfidentialitate
```

---

## Age Rating / Content

- **Category:** Education  
- **User-generated content:** Yes (global chat) — moderation in app  
- **Unrestricted web access:** No  

---

## Attachments (required for this rejection)

1. **Account deletion** — full flow on physical iPhone (`docs/ACCOUNT_DELETION_SCREEN_RECORDING.md`)
2. **IAP sandbox purchase** (recommended) — new account + Sandbox Apple ID → successful purchase

---

## Checklist înainte de Submit for Review

- [ ] IAP promo images: distinct monthly/yearly (`marketing/app-store/export/promo-images/`, `docs/ASC_IAP_PROMO_IMAGES.md`)
- [ ] App Description includes Terms + Privacy URLs (`docs/ASC_APP_DESCRIPTION.md`)
- [ ] `https://kheya.ro/terms` live (deploy `landing/terms.html`)
- [ ] RevenueCat: iOS products on offering `default` + paywall legal links (`docs/ASC_IAP_VALIDATION.md`)
- [ ] Paid Apps Agreement active; subs Ready to Submit on version 0.3.5
- [ ] `REVIEW_ACCOUNT_EMAILS` in Supabase + EAS production
- [ ] App Privacy labels (`docs/APP_STORE_PRIVACY_LABELS.md`)
- [ ] Resolution Center reply drafted (`docs/APP_STORE_RESOLUTION_REPLY.md`)

---

## Legături

- Review account setup: `docs/APPLE_REVIEW_ACCOUNT.md`
- IAP validation: `docs/ASC_IAP_VALIDATION.md`
