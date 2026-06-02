# 10 screenshot-uri App Store în Figma (Apple)

Dimensiuni acceptate de Apple (iPhone 6.7" — recomandat pentru upload principal):

| Orientare | Lățime × Înălțime |
|-----------|-------------------|
| Portrait | **1284 × 2778** px (sau 1290 × 2796) |
| Landscape | **2778 × 1284** px |

Alternativ (6.5"): **1242 × 2688** / **2688 × 1242**.

---

## Pas 0 — Pregătește imaginile din telefon

1. Copiază cele **13 capturi** din telefon în:

```text
KHeIa-UNLOK-your-FUTURE/marketing/app-store/source/
```

2. Redenumește-le (sugestie) după ecran:

| Fișier sursă | Ecran |
|--------------|--------|
| `01-home.png` | Acasă – Welcome + countdown EN/BAC |
| `02-istorie-capitole.png` | Istorie – listă capitole |
| `03-teorie.png` | Teorie – România modernă |
| `04-quiz-intrebare.png` | Quiz – întrebare (înainte de răspuns) |
| `05-quiz-corect.png` | Quiz – răspuns corect |
| `06-teste.png` | Tab Teste |
| `07-kheia-chatbot.png` | Tab KHEYA – chatbot |
| `08-chat-global.png` | Chat global |
| `09-profil.png` | Profil – Evoluție |
| `10-statistici.png` | Profil – Statistici |
| `11-genereaza-capitol.png` | Generează capitol |

3. Rulează scriptul de redimensionare (vezi finalul doc) → output în `marketing/app-store/export/1284x2778/`.

---

## Pas 1 — Fișier Figma nou

1. [figma.com](https://figma.com) → **New design file**
2. Nume: `KHEYA – App Store Screenshots iOS`
3. Sau: **Community** → caută **「App Store Screenshot」** / **「iOS App Store」** → **Duplicate** un template gratuit

---

## Pas 2 — Frame-uri la dimensiune exactă

Pentru fiecare screenshot:

1. **F** (Frame) sau **Frame tool**
2. În dreapta, la **Design**:
   - W: **1284**
   - H: **2778**
3. Nume frame: `01 – Home`, `02 – Capitole`, etc.

Creează **10 frame-uri** (sau un **Section** cu 10 frame-uri aliniate).

**Shortcut:** selectează frame → **Duplicate** (Ctrl+D) → schimbă conținutul.

---

## Pas 3 — Fundal + device (2 variante)

### Varianta A — Screenshot full-screen (cel mai simplu)

Folosește captura ta așa cum e (deja are UI-ul app + background graffiti).

1. Trage PNG-ul din `export/1284x2778/` în frame
2. Redimensionează cu **Fill** (nu Fit) dacă vrei full bleed, sau **Fit** dacă vrei să vezi tot ecranul fără tăiere
3. Pentru App Store, de obicei **Fill** + centrat arată bine (fundalul graffiti umple frame-ul)

### Varianta B — Cu mockup iPhone (mai „Apple”)

1. **Plugins** → **Find more plugins** → instalează unul din:
   - **Mockuuups Studio**
   - **Angle Mockups**
   - **Vectary 3D Mockups**
2. Alege **iPhone 15 Pro Max** / **iPhone 16 Pro Max**
3. Plasează screenshot-ul în ecranul device-ului
4. Fundal frame: gradient închis `#0f172a` → `#1e293b` (sau lasă fundalul din mockup)

---

## Pas 4 — Text marketing (headline) — recomandat

Apple apreciază screenshot-uri cu **mesaj clar**, nu doar UI gol.

Structură pe fiecare frame:

```text
┌─────────────────────────────┐
│  HEADLINE (2 linii max)     │  ← zona sigură sus, ~120–200px padding
│  Subtitlu scurt (opțional)  │
│                             │
│     [ screenshot app ]      │
│                             │
└─────────────────────────────┘
```

### Copy pentru cele 10 screenshot-uri

| # | Frame | Headline | Subtitlu (opțional) |
|---|--------|----------|---------------------|
| 1 | Home | **Unlock Your Future** | Pregătire EN & Bac 2026 |
| 2 | Capitole | **Capitole după programă** | Istorie, Română, Matematică… |
| 3 | Teorie | **Învață teoria clar** | Rezumat + ascultare audio |
| 4 | Quiz | **Quiz-uri pe capitole** | Feedback instant |
| 5 | Quiz corect | **Vezi răspunsul corect** | 5 sau 10 întrebări |
| 6 | Teste | **Simulări EN & BAC** | Teste oficiale și generate |
| 7 | KHEYA AI | **Întreabă AI-ul KHEYA** | Ajutor pentru EN și Bac |
| 8 | Chat | **Comunitate de elevi** | Chat global live |
| 9 | Profil | **Urmărește progresul** | XP, monede, streak |
| 10 | Generează | **Generează capitole** | Teme frecvente la BAC |

**Tipografie în Figma:**

- Headline: **SF Pro Display** / **Inter** — **Bold**, 72–96px, alb `#FFFFFF`
- Subtitlu: **Regular**, 36–44px, `#94a3b8`
- Accent: verde KHEYA `#22c55e` pe un cuvânt cheie (opțional)

---

## Pas 5 — Cele 10 screenshot-uri (mapare din capturile tale)

| Ordine upload ASC | Folosește captura | Frame |
|-------------------|-------------------|--------|
| 1 | Home Welcome | `01-home` |
| 2 | Istorie capitole | `02-istorie-capitole` |
| 3 | Teorie (+ TTS) | `03-teorie` |
| 4 | Quiz întrebare | `04-quiz-intrebare` |
| 5 | Quiz corect | `05-quiz-corect` |
| 6 | Tab Teste | `06-teste` |
| 7 | KHEYA chatbot | `07-kheia-chatbot` |
| 8 | Chat global | `08-chat-global` |
| 9 | Profil Evoluție | `09-profil` |
| 10 | Generează capitol | `11-genereaza-capitol` |

*Nu e nevoie de toate cele 13 — Apple cere **3–10** screenshot-uri per dimensiune de display.*

---

## Pas 6 — Export din Figma

1. Selectează toate cele 10 frame-uri (sau un frame)
2. Panoul dreapta → secțiunea **Export**
3. **+** → format **PNG**
4. Verifică dimensiunea: trebuie **1284 × 2778** (Figma arată dimensiunea la export dacă frame-ul e setat corect)
5. **Export 10 layers** (sau Export selection)

Dacă scale-ul e 2x: frame = 1284×2778, export **1x** (nu 2x) ca să nu depășești.

**Export și pentru 1242×2688:** duplică pagina, schimbă frame la 1242×2688, re-export (sau folosește același design scalat).

---

## Pas 7 — Upload App Store Connect

1. **App Store Connect** → app **KHEYA** → **App Store** → versiunea ta
2. **Screenshots** → **6.7" Display** (sau iPhone 15 Pro Max)
3. Trage cele **10 PNG** în ordine (1 = prima imagine în carousel)
4. Opțional: **6.5" Display** → upload set 1242×2688

**Nu** pune text cu prețuri false; prețurile abonamentului sunt în app / pe store listing.

---

## Pas 8 — Script automat (redimensionare)

Din rădăcina proiectului, după ce ai pus PNG-urile în `marketing/app-store/source/`:

```powershell
cd KHeIa-UNLOK-your-FUTURE
node scripts/prepare-app-store-screenshots.mjs
```

Generează:

- `marketing/app-store/export/1284x2778/`
- `marketing/app-store/export/1242x2688/`

Apoi imporți în Figma frame-urile deja la dimensiunea corectă.

---

## Checklist rapid

- [ ] 10 frame-uri 1284 × 2778
- [ ] Headline românesc pe fiecare (sau template unitar)
- [ ] Fără status bar cu baterie 20% tăiat urât (opțional: crop ușor sus)
- [ ] Fără date personale sensibile în chat (OK: „Cosmin Popa” generic — sau blur dacă vrei)
- [ ] Export PNG
- [ ] Upload în App Store Connect → 6.7" display

---

## Plugin-uri Figma utile

| Plugin | Util |
|--------|------|
| **Redact** | Blur text în chat dacă e nevoie |
| **Content Reel** | Text placeholder (nu e nevoie dacă folosești copy-ul de mai sus) |
| **Image Tracer** | — |
| **Apple Design Resources** | Device frames oficiale |

---

## Landscape (opțional)

Apple cere screenshot-uri portrait pentru majoritatea app-urilor educaționale. Landscape **2778 × 1284** e opțional; poți sări dacă nu ai layout landscape în app.
