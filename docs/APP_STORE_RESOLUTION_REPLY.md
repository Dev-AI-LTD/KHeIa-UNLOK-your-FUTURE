# App Store Connect — Resolution Center reply

**Submission ID (respins):** `b3398f37-dd8e-431e-8625-6588df35005a`  
**Review date:** 16 June 2026 · **Device:** iPad Air 11-inch (M3)  
**Version respinsă:** **0.3.5 (16)** — build-ul din TestFlight marcat „Rejected”

| Build | EAS / ASC | Notă |
|-------|-----------|------|
| **16** | Respins App Review | Submission `b3398f37-…` — guidelines 2.3.2, 2.1(a), 2.1(b), 5.1.1(v) |
| 14 | Mai vechi | Posibil review anterior; **nu** retrimite build 14 |

### Ce înseamnă „Rejected” la TestFlight

Nu e defect la fișierul IPA. Apple a **respins trimiterea** versiunii 0.3.5 cu build 16. Build-ul rămâne în TestFlight cu status **Rejected** și **nu poate fi retrimis singur** — trebuie:

1. **Remedieri** (metadata, imagini IAP, notes, recording ștergere cont, etc.)
2. Dacă schimbi **codul** (ex. tastatură iPad): **build nou 17** + upload
3. Dacă doar **metadata**: uneori poți retrimite aceeași versiune cu build 16 după fixuri ASC (fără binary nou)
4. **Reply** în Resolution Center + **Submit for Review** din nou pe pagina versiunii 0.3.5

**Următorul pas binary:** după fixuri în cod → `eas build --platform ios --profile production` → **build 17** în `app.json`.

Copy-paste în **App Store Connect → Resolution Center → Reply** (English).

---

```
Thank you for your feedback on submission b3398f37-dd8e-431e-8625-6588df35005a.

We have addressed all cited guidelines for resubmission of version 0.3.5 (build 16 was rejected under submission b3398f37-dd8e-431e-8625-6588df35005a; fixes are detailed below).

---

2.3.2 — Promotional images

We removed promotional images that duplicated the app icon or were identical between subscriptions.
Each subscription now has a distinct image (monthly vs yearly paywall artwork), or promotional images were removed if we are not promoting IAP on the product page.

Assets: marketing/app-store/export/promo-images/
• Promo (optional, 1024×1024): kheya-pro-monthly-promo-1024.png, kheya-pro-yearly-promo-1024.png
• Review screenshot (1284×2778): kheya-pro-monthly-review-portrait.png, kheya-pro-yearly-review-portrait.png

---

2.1(a) — iPad keyboard on login / registration

We fixed authentication on iPad: login and registration open Kinde in a full-screen browser session (SFSafariViewController) instead of ASWebAuthenticationSession, which resolves the keyboard not appearing on iPadOS. Tested on iPad.

---

2.1(b) — Locating In-App Purchases (KHEYA Pro monthly / yearly)

Subscriptions are available in-app via:
• Profile tab → Settings → "KHEYA Pro — planuri și prețuri"
• Or: Home → subject → chapter 3+ → paywall
• Or: Tests tab → second test → paywall

IMPORTANT — review account vs IAP testing:
The review account (contact@devaieood.com) has KHEYA Pro server-side for content testing and will NOT show the purchase paywall.

To test IAP in Sandbox:
1. Sign out OR register a NEW free account (not contact@devaieood.com).
2. Settings → App Store → Sandbox Account → sign in with a Sandbox Apple ID.
3. Profile → Settings → KHEYA Pro plans → select Monthly or Yearly → complete sandbox purchase.

Paid Apps Agreement is active. Products KHEYA_pro_monthly and KHEYA_pro_yearly are attached to this app version and mapped in RevenueCat offering "default".

---

5.1.1(v) — Account deletion

Permanent in-app account deletion (no website required):
• Profile → Settings → "Șterge cont / Delete account"
• Double confirmation → deletes profile, progress, and auth data → returns to login screen.

Screen recording of the full flow is attached in App Review Information.

---

3.1.2(c) — Subscriptions metadata (if applicable)

• Privacy Policy: https://www.kheya.ro/politicadeconfidentialitate
• Terms of Use (EULA): https://kheya.ro/terms (App Description + in-app + paywall footer)
• Paywall shows subscription name, length, and price before purchase.

---

REVIEW ACCOUNT (content — Pro without purchase)
Email: contact@devaieood.com
Password: [as in App Review Sign-In fields]

Support: contact@kheya.ro
```

---

## Unde pui ce

| Ce | Unde în ASC |
|----|-------------|
| **Reply** (textul de mai sus) | **Resolution Center** → submission respins → **Reply** |
| **Notes** + sign-in + attachments | **App** → version **0.3.5** → **App Review Information** |
| IAP review screenshot | **Monetization → Subscriptions** → fiecare produs → **Review Information** |

---

## Atașamente (App Review Information)

1. **Screen recording — account deletion:** sign in → Profile → Delete account → confirm → login. Vezi `docs/ACCOUNT_DELETION_SCREEN_RECORDING.md`.
2. **Screen recording — IAP (optional):** cont nou + Sandbox Apple ID → paywall → purchase.

---

## Înainte de Submit for Review

| Task | Doc |
|------|-----|
| Fix metadata + subscriptions, apoi **Submit for Review** (build 16 dacă nu schimbi codul, sau **build 17** după `eas build`) | — |
| Distinct promo images or delete promo | `docs/ASC_IAP_PROMO_IMAGES.md` |
| Review screenshot **1284×2778** per subscription | `scripts/asc_review_screenshot_1024.py` |
| App Description + Terms URL | `docs/ASC_APP_DESCRIPTION.md` |
| `https://kheya.ro/terms` live (nu 404) | `landing/terms.html` |
| RevenueCat iOS products + paywall legal | `docs/ASC_IAP_VALIDATION.md` |
| Reviewer notes | `docs/APP_STORE_REVIEW_NOTES.md` |

---

## După reply

1. Remediază toate punctele (imagini IAP, notes, recording, terms live).
2. Dacă ai schimbat cod → upload **build 17** și selectează-l pe versiunea 0.3.5.
3. Reply în **Resolution Center**.
4. **Submit for Review** (versiunea revine din „Rejected” la „Waiting for Review”).
