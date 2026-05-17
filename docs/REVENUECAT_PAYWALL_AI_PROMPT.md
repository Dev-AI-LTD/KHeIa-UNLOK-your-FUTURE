# Prompt pentru Paywall AI (RevenueCat)

Copiază tot blocul de mai jos în **RevenueCat → Paywalls → Create paywall → AI** (sau editor), apoi leagă paywall-ul de offering-ul **`default`**.

---

## Prompt (copy-paste)

```
Creează un paywall mobil pentru aplicația educațională românească KHEYA (pregătire Evaluare Națională și Bacalaureat).

BRAND
- Nume: KHEYA – Unlock Your Future
- Ton: prietenos, motivant, pentru elevi 13–19 ani și părinți
- Culori: fundal închis (#0f172a / #1e293b), accent violet (#8b5cf6 / #a78bfa), accent secundar verde pentru CTA (#22c55e) sau albastru (#60a5fa)
- Limbă: română (RO) – toate textele în română

PLANURI (exact 2 abonamente – offering default)
1. LUNAR – 30 RON/lună
   - Package identifier RevenueCat: monthly
   - Beneficii: acces complet, quiz 10 întrebări, teorie audio nelimitată, fără limită 5 min/zi
2. ANUAL – 300 RON/an (evidențiat ca „Cel mai avantajos” / Best value – economisești față de lunar)
   - Package identifier RevenueCat: yearly
   - Același conținut ca lunar, facturare anuală

ENTITLEMENT
- Identifier (RevenueCat API): KheIA Pro
- Paywall-ul deblochează entitlement-ul „KheIA Pro”

FREE vs PREMIUM (afișează clar pe paywall)
Gratuit:
- 5 minute ascultare teorie (TTS) pe zi
- Quiz cu 5 întrebări
- Primele 2 capitole per materie

Premium (KHEYA Pro):
- Teorie audio nelimitată (Ascultă teoria)
- Quiz cu 10 întrebări
- Toate capitolele
- Fără reclame

STRUCTURĂ UI (texte exacte – diacritice și branding)
- Titlu principal (mare, centrat sau stânga): **Deblochează KHEYA Pro**
  - Brand vizibil: **KHEYA** (cu Y — nu KheIA, nu KhEIa)
  - „Pro” pe același rând sau sub titlu, același font weight
- Subtitlu (Subhead 15pt, culoare secundară): „Pregătire completă pentru Evaluare Națională și Bacalaureat”
- Text scurt sub subtitlu (Caption): „Teorie audio, quiz-uri complete și progres salvat în cloud”
- Listă 4–5 bullet benefits cu iconițe
- Două carduri plan: Lunar și Anual (Anual mai mare sau cu badge „-17%” sau „Economisești 60 RON”)
- Buton principal pe cardul selectat: „Continuă cu KHEYA Pro”
- Buton secundar (dacă există): „Mai târziu” — discret, fără accent
- Link discret jos: „Restaurează cumpărăturile”
- Text legal mic: „Abonamentul se reînnoiește automat. Poți anula oricând din Google Play.”
- Nu include plan lifetime / plată unică – doar lunar și anual

TEHNIC (RevenueCat)
- Offering: default (current)
- Packages: monthly, yearly
- Platformă prioritară: Google Play (Android), package com.kheia.edumat
- Publicare paywall după generare și asociere la offering default
```

---

## După generare în RevenueCat

1. **Offerings → default** – verifică pachetele `monthly` și `yearly` cu produsele Google Play.
2. **Google Play Console** – prețuri: 30 RON/lună, 300 RON/an (sau echivalent; store-ul poate rotunji).
3. **Publish** paywall-ul.
4. În app: Profil → **Deblochează KHEYA Pro** sau quiz → paywall nativ (`presentPaywall`).

## Env app

```env
EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE=goog_...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=KheIA Pro
```
