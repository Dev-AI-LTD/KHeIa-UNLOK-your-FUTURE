# Audit pentru publicare (Google Play / App Store)

Listă de verificări ca la o revizie de tip „Google / Apple” înainte de aprobare pentru publicare. Bifează pe măsură ce rezolvi.

---

## 1. Politici și conformitate (obligatoriu)

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 1.1 | **Privacy Policy** – URL public | ⬜ | Play Store și App Store cer un link către politica de confidențialitate. Ai text în app (Profil → Legal) și `landing/privacy.html` – publică `privacy.html` pe un domeniu (ex. kheia.ro/privacy) și pune URL-ul în store. |
| 1.2 | **Terms of Service** – URL public | ⬜ | Idem: termeni și condiții pe URL public (ex. kheia.ro/terms), completat în fiecare store. |
| 1.3 | **Data safety (Google Play)** | ⬜ | Completează în Play Console ce date colectezi (email, progres, ID device), scopul, dacă le partajezi. Aliniază cu `src/content/legal.ts` și cu politica de confidențialitate. |
| 1.4 | **App Privacy (App Store)** | ⬜ | În App Store Connect completează label-urile de confidențialitate (date colectate, tracking etc.). |
| 1.5 | **Ștergere cont (GDPR)** | ✅ | În Profil → Setări există „Șterge cont (GDPR)” cu confirmare dublă. Edge Function `delete-account` șterge toate datele utilizatorului; deploy: `supabase functions deploy delete-account`. Opțional: setează `SUPABASE_ANON_KEY` în secrets pentru verificare JWT. |
| 1.6 | **Export date (portabilitate GDPR)** | ⬜ | Opțional dar recomandat: opțiune „Descarcă datele mele” (export JSON/PDF cu progres, profil). |
| 1.7 | **Contact pentru date** | ✅ | contact@kheya.ro, contact@devaieood.com menționate în legal – păstrează aceste emailuri valide. |

---

## 2. Monetizare și abonamente (obligatoriu pentru IAP)

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 2.1 | **Restore purchases** | ✅ | Buton **„Restaurare / Gestionează abonamentul”** în Profil → Setări (`presentCustomerCenter()`). |
| 2.2 | **Anulare abonament** | ⬜ | Textul „Anulare oricând” pe ecranul de abonament e ok; asigură-te că în Customer Center (RevenueCat) userul poate deschide setările de abonament de la Google/Apple pentru anulare. |
| 2.3 | **Prețuri afișate clar** | ✅ | Prețuri RON pe planuri (Lunar, Anual). Verifică că prețurile din app sunt aliniate cu cele din Play/App Store. |
| 2.4 | **Perioadă de facturare** | ⬜ | Menționează explicit „facturare lunară” / „facturare anuală” lângă preț (ex. „X RON/lună”, „Y RON/an”). |

---

## 3. Autentificare și cont

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 3.1 | **Deconectare** | ✅ | Buton Deconectare în Profil. |
| 3.2 | **Recuperare parolă** | ⬜ | Reset parolă prin **pagina Kinde** (hosted UI), nu ecran dedicat în app. Verifică că „Forgot password” funcționează în Kinde. |
| 3.3 | **Confirmare email** | ⬜ | Decizie în **Kinde Dashboard**: confirmare email la înregistrare activă/inactivă. Mesaj clar pentru user dacă e obligatorie. |
| 3.4 | **Autentificare doar email (Kinde)** | ✅ | Login/register prin Kinde (`kinde.login` / `kinde.register`). **Fără** login social (Google/Apple/Facebook). **Sign in with Apple nu e obligatoriu** (Guideline 4.8). |

---

## 4. Experiență utilizator și stabilitate

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 4.1 | **Error boundary (crash-uri)** | ⬜ | Nu există un Error Boundary la rădăcină. La o eroare neprinsă în React, aplicația poate rămâne cu ecran alb. Adaugă un Error Boundary în `_layout.tsx` care să afișeze un mesaj prietenos și opțiune de „Reîncearcă”. |
| 4.2 | **Stări de încărcare** | ✅ | ActivityIndicator pe login, subscription, etc. |
| 4.3 | **Stări goale (liste fără date)** | ⬜ | Verifică ecranele cu liste (capitole, teste, progres): dacă nu sunt date, afișează un mesaj clar (ex. „Niciun capitol încă”) în loc să rămână goale. |
| 4.4 | **Offline / rețea** | ⬜ | Există `OfflineBanner`; asigură-te că fluxurile critice (quiz, teorie) au fallback sau mesaj clar când nu e rețea. |
| 4.5 | **Accesibilitate** | ⬜ | Nu sunt folosite `accessibilityLabel` / `accessibilityRole` pe butoane și elemente interactive. Adaugă pe elementele cheie (butoane, link-uri) pentru screen readers. |

---

## 5. Securitate și date sensibile

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 5.1 | **Chei API în cod** | ⬜ | În `eas.json` (production) sunt hardcodate `EXPO_PUBLIC_SUPABASE_URL` și `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Anon key e destinat clientului, dar e mai bine să fie în EAS Secrets și injectate la build. Verifică că **nicio cheie secretă** (service_role, OPENAI, etc.) nu ajunge în binarul app-ului. |
| 5.2 | **.env / .env.example** | ⬜ | `.env` nu trebuie comis. `.env.example` nu trebuie să conțină valori reale (doar placeholders). Verifică că `.gitignore` exclude `.env`. |
| 5.3 | **Link-uri externe** | ⬜ | Unde deschizi URL-uri (ex. documente oficiale, site-uri terți), folosește `Linking.openURL` – e ok; asigură-te că nu deschizi link-uri nesigure sau user-generated fără validare. |

---

## 6. Store listing și metadata

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 6.1 | **Icon aplicație** | ⬜ | `app.json` folosește `./assets/BECKGROUND.png` pentru icon și splash. Verifică că imaginea e potrivită ca icon (ex. 1024x1024 pentru iOS, adaptive icon Android) și că nu e doar un fundal. |
| 6.2 | **Splash screen** | ⬜ | Același asset; asigură-te că arată bine pe toate dimensiunile. |
| 6.3 | **Versiune și build** | ⬜ | `version`: "0.1.0". Pentru fiecare release: incrementează versiunea și setează `android.versionCode` / `ios.buildNumber` (în app.json sau app.config.js). |
| 6.4 | **Titlu store** | ⬜ | Titlu scurt (ex. „KHEYA – EN & BAC”) și descriere lungă/scurtă în română (și opțional engleză). |
| 6.5 | **Screenshot-uri** | ⬜ | 2–8 screenshot-uri pe telefon (și tabletă dacă e cazul). Ecrane cheie: Home, Capitol/Teorie, Quiz, Abonament, Profil. |
| 6.6 | **Feature graphic (Play Store)** | ⬜ | 1024 x 500 px. |
| 6.7 | **Clasificare vârstă / Content rating** | ⬜ | Completează în Play Console și App Store Connect (de obicei pentru educație: toate vârstele sau 3+). |
| 6.8 | **Categorie** | ⬜ | Educație. |
| 6.9 | **Cuvinte cheie** | ⬜ | Pentru Play Store (scurt), pentru App Store (keyword field). |

---

## 7. Funcționalitate end-to-end (testare ca reviewer)

| # | Flux | Ce să verifici |
|---|------|-----------------|
| 7.1 | **Prima deschidere** | Prezentare → Onboarding (examen, nivel) → Home. Fără crash. |
| 7.2 | **Fără cont** | „Continuă fără cont” → Home. Progres local; la reinstall progresul se pierde – e acceptabil dacă e comunicat. |
| 7.3 | **Înregistrare email (Kinde)** | Creează cont → pagina Kinde → (confirmare email dacă e activă în Kinde) → login → Home. |
| 7.4 | **Login email (Kinde)** | Autentificare → pagina Kinde (email + parolă) → revenire în app → Home. **Fără** Google/social. |
| 7.5 | **Reset parolă** | Ai uitat parola → email trimis → link funcțional. |
| 7.6 | **Capitol + teorie** | Alege materie → capitol → teorie (și genera teorie dacă e cazul). Conținut afișat corect. |
| 7.7 | **Quiz** | Quiz pe capitol → răspunsuri → rezultat. Fără crash când nu sunt întrebări. |
| 7.8 | **Abonament** | Profil → Deblochează KHEYA Pro → paywall RevenueCat → flux Google Play / App Store → Pro activ. |
| 7.9 | **Restaurare cumpărături** | Profil → Restaurare / Gestionează abonamentul → Customer Center → abonament reflectat în app. |
| 7.10 | **Profil** | Evoluție, statistici, Legal (GDPR, Confidentialitate, Termeni), Setări cont, Deconectare. |
| 7.11 | **Deep link** | Duel invite, share test – link-ul deschide app-ul și ajunge la ecranul corect. |

---

## 8. Backend și servicii

| # | Element | Status | Acțiune |
|---|--------|--------|---------|
| 8.1 | **Supabase + Kinde** | ⬜ | `kinde-bridge` deployat. Callback Kinde: `kheia://kinde_callback`. **Fără** Google OAuth în Supabase (auth doar email via Kinde). |
| 8.2 | **RevenueCat** | ⬜ | Produse (monthly, yearly) și offering configurate; pe production folosești cheia de producție (nu test_). |
| 8.3 | **Node backend (Railway)** | ⬜ | Generare teorie / chat – URL setat în env; health check ok. |
| 8.4 | **Edge Functions (Supabase)** | ⬜ | Dacă le folosești, sunt deployate și invocabile. |

---

## 9. Altele (best practice)

| # | Element | Acțiune |
|---|--------|---------|
| 9.1 | **Notificări push** | Dacă nu sunt implementate, nu declara în store că trimiți notificări. |
| 9.2 | **Tracking / analytics** | Dacă folosești (ex. Firebase, Mixpanel), menționează în Privacy Policy și Data safety. |
| 9.3 | **Consimțământ cookie / tracking** | În app mobil nu e tipic „banner cookie”, dar dacă folosești SDK-uri cu tracking, poate fi nevoie de consimțământ (ex. la primul launch). |
| 9.4 | **Link către politică în app** | În Profil ai Legal cu text; adaugă și un link „Politica de confidențialitate online” către URL-ul public (după ce îl publici). |

---

## Rezumat priorități

**Obligatorii înainte de trimitere:**
- Privacy Policy + Terms URL-uri publice și completate în store.
- Data safety (Play) / App Privacy (iOS) completate.
- **Restore purchases** / Customer Center vizibil în app (Profil → Setări).
- Ștergere cont (GDPR) – flow sau instrucțiuni clare + contact.
- Icon, splash, versiune/build, screenshot-uri, clasificare vârstă.
- **Kinde:** doar email activ; fără conexiuni sociale (Google/Apple/Facebook).

**Recomandate puternic:**
- Error Boundary la rădăcină.
- Stări goale pe liste.
- Accesibilitate minimă (label-uri pe butoane importante).
- Prețuri și perioadă de facturare foarte clare pe ecranul de abonament.

**După ce bifezi:** rulează o ultimă trecere ca „user nou” (install → onboarding → login → quiz → abonament → profil) pe device real și pe un emulator, apoi trimite la review.
