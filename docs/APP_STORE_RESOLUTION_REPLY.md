# App Store Connect — Resolution Center reply (submission c2a26678)

**Submission ID:** `c2a26678-324f-41c4-9ce8-6c05bcbd76c2`  
**Version:** 0.3.5 · **Build:** 16

Copy-paste în **App Store Connect → Resolution Center** (English).

---

```
Thank you for your detailed feedback. We have addressed all four guidelines for resubmission.

---

2.3.2 — Promotional images

We removed the app-icon promotional images and uploaded distinct promotional images for each subscription:
• KHEYA_pro_monthly — monthly plan artwork (not the app icon)
• KHEYA_pro_yearly — yearly plan artwork (different from monthly)

Files are in our repo at marketing/app-store/export/promo-images/ and uploaded in App Store Connect per subscription.

---

3.1.2(c) — Subscriptions metadata (Terms of Use / EULA)

We updated App Store metadata:
• Privacy Policy URL: https://www.kheya.ro/politicadeconfidentialitate
• Terms of Use (EULA) link in the App Description: https://kheya.ro/terms
• In-app: Login screen and Profile → Legal include functional Privacy Policy and Terms links
• RevenueCat paywall footer includes Privacy Policy and Terms of Use links

Subscriptions displayed in the paywall include title (KHEYA Pro Monthly / Yearly), billing period, and price before purchase.

---

2.1(b) — In-App Purchase / subscription purchase

We verified App Store Connect and RevenueCat configuration:
• Paid Apps Agreement active
• KHEYA_pro_monthly and KHEYA_pro_yearly attached to this app version
• RevenueCat offering "default" maps iOS packages monthly/yearly to Apple product IDs KHEYA_pro_monthly and KHEYA_pro_yearly
• Tested successfully on TestFlight with a Sandbox Apple ID and a new free account (not the review account)

HOW TO TEST IAP (important):
1. Sign out of the review account (contact@devaieood.com) OR register a new free account.
2. Settings → App Store → Sandbox Account → sign in with Sandbox Apple ID.
3. Profile tab → Setări / Settings → "KHEYA Pro — planuri și prețuri".
4. Select Monthly or Yearly and complete the sandbox purchase.

The review account (contact@devaieood.com) has Pro content server-side for testing educational features without purchase. It should NOT be used for IAP purchase testing.

---

5.1.1(v) — Account deletion

Account deletion is available in-app without contacting support:
• Profile → Evoluție → Cont / Account → "Șterge cont / Delete account"
• OR Profile → Setări / Settings → "Șterge cont / Delete account"
• OR Profile → Legal → Cont / Account → same option

Flow: double confirmation → permanent deletion of profile, progress, and statistics via our delete-account API → return to login screen.

Screen recording of the full deletion flow is attached in App Review Information.

---

REVIEW ACCOUNT (content testing — Pro without purchase)
Email: contact@devaieood.com
Password: [as in Sign-In fields]

Support: contact@kheya.ro
```

---

## Atașamente (App Review Information)

1. **Screen recording — account deletion:** sign in → Profile → Delete account → confirm → login screen. See `docs/ACCOUNT_DELETION_SCREEN_RECORDING.md`.
2. **Screen recording — IAP (optional):** new account + Sandbox Apple ID → paywall → successful purchase.

---

## Înainte de Submit for Review

| Task | Doc |
|------|-----|
| Upload distinct promo images | `docs/ASC_IAP_PROMO_IMAGES.md` |
| App Description + Terms URL | `docs/ASC_APP_DESCRIPTION.md` |
| Deploy `landing/terms.html` → `https://kheya.ro/terms` (fix 404) | `landing/terms.html` |
| RevenueCat iOS product mapping + paywall legal links | `docs/ASC_IAP_VALIDATION.md`, `docs/REVENUECAT_PAYWALL_AI_PROMPT.md` |
| Reviewer notes | `docs/APP_STORE_REVIEW_NOTES.md` |

---

## După reply

1. Upload promo images to ASC (monthly vs yearly — not app icon).
2. Paste App Description from `docs/ASC_APP_DESCRIPTION.md`.
3. Deploy terms page so `https://kheya.ro/terms` returns 200.
4. Update RevenueCat paywall with Privacy + Terms footer links; verify iOS products on offering `default`.
5. Attach screen recordings in App Review Information.
6. **Submit for Review**.
