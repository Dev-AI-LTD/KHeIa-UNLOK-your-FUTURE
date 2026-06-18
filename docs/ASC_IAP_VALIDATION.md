# App Store Connect + RevenueCat — IAP validation (Guideline 2.1(b))

Use this checklist before resubmitting build **16** (or next build). The error **"The product is not available for purchase"** is almost always a **configuration mismatch**, not app UI code.

## App Store Connect

| # | Check | Where | Expected |
|---|-------|-------|----------|
| 1 | Paid Apps Agreement | Agreements, Tax, and Banking | **Active** |
| 2 | Subscription group | Subscriptions → `kheya` | Linked to app |
| 3 | Monthly product | `KHEYA_pro_monthly` | **Ready to Submit** / Approved |
| 4 | Yearly product | `KHEYA_pro_yearly` | **Ready to Submit** / Approved |
| 5 | Products on version | App version 0.3.5 → In-App Purchases | Both subs attached |
| 6 | Review screenshot | Each subscription | Uploaded |
| 7 | Shared Secret | App Information → App-Specific Shared Secret | Set in RevenueCat iOS app |

**Product IDs must match exactly** what RevenueCat maps for Apple (typically `KHEYA_pro_monthly`, `KHEYA_pro_yearly`).

## RevenueCat dashboard

| # | Check | Where | Expected |
|---|-------|-------|----------|
| 1 | iOS app | Project → Apps | Bundle `com.kheia.edumat`, Shared Secret set |
| 2 | Products (Apple) | Project → Products | `KHEYA_pro_monthly`, `KHEYA_pro_yearly` |
| 3 | Entitlement | Project → Entitlements | Identifier **`KheIA Pro`** (matches app env) |
| 4 | Offering | Project → Offerings → **default** | Marked **Current** |
| 5 | Packages | In `default` offering | `monthly` → Apple monthly product; `yearly` → Apple yearly product |
| 6 | Paywall | Project → Paywalls | **Published**, linked to `default` |
| 7 | Paywall legal links | Paywall editor footer | Privacy + Terms URLs (see `docs/REVENUECAT_PAYWALL_AI_PROMPT.md`) |
| 8 | API key | Project → API Keys | Production **`appl_…`** in EAS Secrets |

## EAS / build env

```powershell
eas secret:list
```

Required for iOS production:

- `EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE` = production Apple public key
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` = `KheIA Pro` (optional if default)
- `EXPO_PUBLIC_PRIVACY_POLICY_URL` = `https://www.kheya.ro/politicadeconfidentialitate`
- `EXPO_PUBLIC_TERMS_URL` = `https://kheya.ro/terms` (must be live — deploy `landing/terms.html`)

## TestFlight sandbox test (required)

1. **Sign out** of review account (`contact@devaieood.com`).
2. **Register** a new free account (disposable email).
3. Device: **Settings → App Store → Sandbox Account** → sandbox Apple ID.
4. App: **Profil → Setări / Settings → KHEYA Pro — planuri și prețuri**.
5. Select **Yearly** or **Monthly** → complete sandbox purchase.
6. Confirm **KHEYA Pro activ** in Profile.

If step 5 fails, fix ASC + RevenueCat mapping before resubmitting.

## In-app diagnostics (build with latest code)

If offerings are misconfigured, the app shows **"Abonament indisponibil"** with a reason instead of a generic StoreKit error (`getPaywallDiagnostics()` in `src/services/purchases.service.ts`).

## Common root causes

| Symptom | Fix |
|---------|-----|
| Paywall shows, purchase = "not available" | RC packages point to wrong/missing **Apple** product IDs |
| Paywall empty or instant error | Offering `default` not current or no packages |
| Works in dev, fails in review | Production `appl_` key missing in EAS; subs not on submitted build |
| Reviewer on Pro review account | Use **new account** + Sandbox Apple ID for IAP (see review notes) |
