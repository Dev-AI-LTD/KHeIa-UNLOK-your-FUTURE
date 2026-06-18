# App Store Connect — IAP promotional images (Guideline 2.3.2)

Apple a respins build 14/16 pentru că imaginile promo la abonamente erau **identice cu iconița app** sau **duplicate** între monthly/yearly.

## Imagini generate (gata de upload)

Script stilizat: logo KHEYA + layout paywall (beneficii, preț, CTA verde). Fundal blur din captura paywall.

```powershell
cd c:\Users\octav\Desktop\KHEIA3\KHeIa-UNLOK-your-FUTURE
# Fără captură paywall (gradient simplu):
node scripts/generate-asc-promo-placeholders.mjs
# Cu captura ta de paywall (recomandat):
node scripts/generate-asc-promo-placeholders.mjs marketing/app-store/export/promo-images/paywall-source.png
```

Output în `marketing/app-store/export/promo-images/`:
- `kheya-pro-monthly-promo.png` (1290×2796) — plan **LUNAR** 29 RON/lună
- `kheya-pro-yearly-promo.png` (1290×2796) — plan **ANUAL** 249 RON/an + badge „Cel mai avantajos”
- Variante `-1024.png` pentru preview

**Nu** folosi `kheya_icon_1024x1024.png` sau aceeași imagine pe ambele subs.

## Opțiunea A — șterge promo (dacă nu promovezi IAP în App Store)

1. **App Store Connect → Subscriptions → kheya**
2. **KHEYA_pro_monthly** → secțiunea **App Store Promotion** / **Promotional Image**
3. **Delete** imaginea promo
4. Repetă pentru **KHEYA_pro_yearly**
5. **Save**

## Opțiunea B — încarcă imagini distincte per plan

Încarcă în ASC:
- **KHEYA_pro_monthly** → `marketing/app-store/export/promo-images/kheya-pro-monthly-promo.png`
- **KHEYA_pro_yearly** → `marketing/app-store/export/promo-images/kheya-pro-yearly-promo.png`

### B1 — Placeholder (rapid, fără capturi TestFlight)

```powershell
cd c:\Users\octav\Desktop\KHEIA3\KHeIa-UNLOK-your-FUTURE
node scripts/generate-asc-promo-placeholders.mjs
```

Output în `marketing/app-store/export/promo-images/`:
- `kheya-pro-monthly-promo.png` + `-1024.png`
- `kheya-pro-yearly-promo.png` + `-1024.png`

Înlocuiește cu capturi reale din paywall când le ai.

### B2 — Din capturi paywall reale

1. Fă 2 capturi de ecran din paywall (TestFlight build 16)
2. Rulează:

```powershell
cd c:\Users\octav\Desktop\KHEIA3\KHeIa-UNLOK-your-FUTURE
node scripts/prepare-asc-promo-images.mjs path\to\paywall-monthly.png path\to\paywall-yearly.png
```

3. Încarcă în ASC:
   - **KHEYA_pro_monthly** → `marketing/app-store/export/promo-images/kheya-pro-monthly-promo.png`
   - **KHEYA_pro_yearly** → `marketing/app-store/export/promo-images/kheya-pro-yearly-promo.png`

**Nu** folosi `kheya_icon_1024x1024.png` sau aceeași imagine pe ambele subs.

## Dimensiuni

- Review screenshot subs: **1290×2796** sau **1284×2778**
- Promo image: folosește dimensiunea cerută de ASC la upload (scriptul exportă 1290×2796)
