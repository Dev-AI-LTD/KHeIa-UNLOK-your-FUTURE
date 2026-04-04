# Configurare RevenueCat – pas cu pas

Acest ghid explică ce trebuie să faci **tu** (în dashboard-uri și în proiect) ca plățile pentru abonamente KHEYA Premium să funcționeze.

---

## Migrații Supabase

Copiază și lipește comenzile în terminal (din rădăcina proiectului). Pentru parolă: Supabase Dashboard → **Project Settings → Database → Database password**.

**1. Link la proiect** (doar dacă nu e deja linkuit):

```
npx supabase link --project-ref lbvltfvdrsdrmpuglboh
```

**2. Setează parola bazei** (PowerShell – înlocuiește `PAROLA_TA` cu parola din Supabase):

```
$env:SUPABASE_DB_PASSWORD = "PAROLA_TA"
```

**3. Aplică migrațiile:**

```
npx supabase db push
```

Migrația `015_auto_create_profile_on_signup.sql` creează un rând în `profiles` automat la fiecare user nou (email sau Google).

### Rulare manuală în Supabase (copy-paste SQL)

Deschide **Supabase Dashboard → SQL Editor → New query**. Cel mai simplu: deschide fișierul **`docs/supabase-migration-015-copy-paste.sql`** din proiect, selectează tot (Ctrl+A), copiază și lipește în SQL Editor, apoi Run. Alternativ, copiază doar liniile de SQL de mai jos (fără linia cu \`\`\`sql sau \`\`\` de la margini).

```sql
-- Auto-create a profile row when a new user signs up (email or OAuth e.g. Google).
-- Ensures Google sign-in and email sign-up get a profiles row for referral, subscription, etc.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  name_val text;
begin
  name_val := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  insert into public.profiles (id, display_name)
  values (new.id, name_val)
  on conflict (id) do update set
    display_name = coalesce(profiles.display_name, excluded.display_name);
  return new;
end;
$$;

-- Trigger on auth.users (runs after insert)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## Ce este RevenueCat?

RevenueCat e un serviciu care gestionează abonamentele (in-app purchases) pentru iOS și Android. Tu configurezi produsele în App Store Connect / Google Play, iar aplicația folosește SDK-ul RevenueCat pentru a afișa oferte și a procesa cumpărăturile.

---

## Pas 1: Cont și proiect RevenueCat

1. Creează cont pe [revenuecat.com](https://www.revenuecat.com) (dacă nu ai deja).
2. **Dashboard → Projects → Create new project** (ex: „KHEYA”).
3. Notează **Project API Key** (îl vei folosi în app).

---

## Pas 2: Conectare App Store (iOS)

1. În RevenueCat: **Project → Apps → Add app** → alege **Apple App Store**.
2. Introdu **App-specific shared secret** din App Store Connect:
   - App Store Connect → aplicația ta → **App Information** → **App-Specific Shared Secret** (sau **In-App Purchase** → **Manage** → Shared Secret).
3. Dacă nu ai Shared Secret, generează unul în **Users and Access → Shared Secret**.
4. În **App Store Connect** creează produsele de abonament:
   - **App → In-App Purchases** → **+** → **Auto-Renewable Subscription**.
   - Creează (sau grupezi) produse pentru:
     - **Lunar** (ex: `kheia_premium_monthly`)
     - **Anual** (ex: `kheia_premium_yearly`)
     - **KHEYA Premium** (lifetime, ex: `kheia_full_edumat` – poate fi consumable sau non-renewing, după cum vrei).
5. În RevenueCat, la app-ul iOS, asociază aceste **Product IDs** cu **Entitlements** (ex: entitlement `premium`).

---

## Pas 3: Conectare Google Play (Android)

> **Android nativ (Kotlin/Gradle):** dacă lucrezi într-un proiect Android nativ sau în folderul `android/` după `expo prebuild`, vezi ghidul detaliat [RevenueCat Android nativ (Kotlin)](./REVENUECAT_ANDROID_NATIVE.md) – Gradle, API key, entitlement KHEYA Pro, Paywall, Customer Center, cod complet.

1. În RevenueCat: **Project → Apps → Add app** → alege **Google Play**.
2. Legătura se face prin **Service credentials** (JSON) din Google Play Console:
   - Google Play Console → **Setup → API access** → link la **Google Cloud project**.
   - În Google Cloud: **APIs & Services → Credentials** → **Create credentials → Service account**.
   - Acordă acestui cont acces în Play Console (**Users and permissions** → invite service account cu drepturi pentru **Orders and subscriptions**).
   - Descarcă cheia JSON și o încarci în RevenueCat la app-ul Android.
3. În **Google Play Console** creează abonamentele:
   - **Monetize → Subscriptions** → creează abonamente cu aceleași ID-uri (sau altele) pe care le folosești în RevenueCat, ex:
     - `kheia_premium_monthly`
     - `kheia_premium_yearly`
     - `kheia_full_edumat`
4. În RevenueCat, la app-ul Google, mapezi aceste **Product IDs** la același **Entitlement** (ex: `premium`).

---

## Google Play – ghid detaliat (pas cu pas)

### A. Cont Google Play Console

1. Mergi la [Google Play Console](https://play.google.com/console) și autentifică-te cu contul Google (ex: Gmail).
2. **Plăți:** trebuie să ai **Cont merchant Google** (pentru încasări).  
   - **Setup → Payments profile** – dacă nu e creat, urmează pașii (țara, date fiscale, cont bancar). Aprobarea poate dura 1–2 zile.

### B. Aplicația în Play Console

1. **Toate aplicațiile → Create app** (sau deschide app-ul dacă există).
2. Completează **Store listing** (titlu, descriere, grafică) – necesar înainte de a publica.
3. **Release → Production** (sau Testing): încarcă primul build (AAB generat cu EAS: `eas build --platform android --profile production`).

### C. Facturare și abonamente

1. **Monetize → Subscriptions** (din meniul din stânga).
2. **Create subscription** pentru fiecare produs. Folosește **exact** aceste ID-uri (sau altele, dar trebuie să le folosești și în RevenueCat și în `purchases.service.ts`):
   - **Monthly:** Product ID = `monthly` (sau `kheia_premium_monthly`).
   - **Yearly:** Product ID = `yearly` (sau `kheia_premium_yearly`).
   - **Lifetime / KHEYA Premium:** Product ID = `lifetime` (sau `kheia_full_edumat`).  
   Pentru „lifetime” poți folosi **One-time product** (Monetize → One-time products) dacă nu e abonament recurent.
3. La fiecare abonament: setează prețul, perioada (1 lună / 1 an), trial gratuit (opțional).

#### C.1 Opțional: creare produs one-time prin Android Publisher API

Dacă preferi automatizarea (CLI, script), poți crea un **managed one-time** produs cu metoda [`inappproducts.insert`](https://developers.google.com/android-publisher/api-ref/rest/v3/inappproducts/insert). Ai nevoie de **Android Publisher API** activat în același proiect Google Cloud ca service account-ul, scope `https://www.googleapis.com/auth/androidpublisher`, și token (OAuth sau JWT pentru service account).

Exemplu:

```http
POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.kheia.edumat/inappproducts
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "packageName": "com.kheia.edumat",
  "sku": "kheia_pro_lifetime",
  "status": "active",
  "purchaseType": "managedUser",
  "defaultLanguage": "en-US",
  "listings": {
    "en-US": {
      "title": "KHEIA Pro - Permanent",
      "description": "Lifetime access to KHEIA Pro. One-time purchase."
    }
  },
  "prices": {
    "RO": { "currency": "RON", "priceMicros": "399000000" }
  }
}
```

`priceMicros` sunt în micro-unități ale monedei (ex. `399000000` ≈ 399,00 RON pentru regiunea `RO`).

**Aliniere cu app și RevenueCat:** în `src/services/purchases.service.ts`, `PLAN_TO_PACKAGE_ID` mapează lifetime la identificatorul `lifetime`. Dacă păstrezi SKU-ul `kheia_pro_lifetime` în Play, setează același **Product ID** în RevenueCat și actualizează maparea în cod; altfel folosește `lifetime` ca `sku` în request și în Console.

### D. Service account (legătura RevenueCat ↔ Google Play)

1. **Google Play Console → Setup → API access.**  
   Dacă vezi „Link to Google Cloud project”, apasă și creează/alege un proiect Google Cloud.
2. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)): deschide același proiect.
3. **APIs & Services → Credentials → Create credentials → Service account.**  
   - Nume: ex. „RevenueCat” → Create.  
   - Nu e nevoie să dai roluri în Google Cloud pentru acest cont.
4. După ce e creat: **Keys → Add key → Create new key → JSON** → Download. Păstrează fișierul JSON în siguranță.
5. Înapoi în **Google Play Console → Setup → API access.**  
   Găsești service account-ul creat. Apasă **Grant access** (sau „Invite user”):  
   - Adaugi email-ul service account-ului (ex: `revenuecat@proiect.iam.gserviceaccount.com`).  
   - Bifezi: **View financial data, orders and cancellation**, **Manage orders and subscriptions**.  
   Salvezi.

### E. RevenueCat – adăugare app Android

1. **RevenueCat → Project → Apps → Add app** → **Google Play**.
2. **Package name:** același ca în app (ex: `com.taptap.kheia` – verifică în `app.json` / `app.config.js` câmpul `android.package`).
3. **Service credentials:** încarcă fișierul JSON descărcat la pasul D.  
   RevenueCat va citi din el și va putea verifica cumpărăturile din Google Play.
4. Salvezi. După câteva minute, RevenueCat ar trebui să vadă tranzacțiile de test.

**Notă:** Nu este nevoie să pui în cod cheia publică RSA (Base64) din Play Console. Aceasta era folosită la License Verification Library (LVL) / verificare în app. Cu RevenueCat, verificarea se face pe server cu service account JSON; aplicația nu trebuie să conțină niciun string de tip „BASE64_PUBLIC_KEY”.

**Dacă nu poți crea cheie JSON** (politică organizație: „Service account key creation is disabled”):

1. **Cerere la admin organizație** (recomandat): Cineva cu rol **Organization Policy Administrator** în Google Cloud poate fie să dezactiveze politica `iam.disableServiceAccountKeyCreation` pentru proiectul tău, fie să creeze el cheia JSON pentru service account-ul RevenueCat și să ți-o trimită prin canal sigur (nu pe email public). Tu o încarci doar în RevenueCat.
2. **Proiect pe cont personal fără organizație**: Dacă Play Console e pe un cont Google personal (Gmail), verifică dacă proiectul Cloud e sub o organizație (IAM → Settings). Dacă da, poți încerca un proiect nou creat fără organizație (dacă interfața o permite). Dacă totul e deja sub organizație (ex: cont firmă/școală), rămâne varianta cu admin.
3. **Cont Google nou** (ultimă variantă): Cont Gmail nou → proiect Cloud nou (fără org) → service account + cheie JSON. Proiectul trebuie legat de **același** cont care are Play Console; deci trebuie să ai și Play Console pe contul nou (taxă 25 USD), apoi să muți aplicația acolo sau să o publici de pe contul nou. Cost și efort mari.
4. **RevenueCat**: Nu oferă alternativă (ex: OAuth) pentru Google Play; conexiunea se face doar cu service account JSON. Fără JSON, RevenueCat nu poate verifica cumpărăturile Android. iOS (App Store) funcționează cu Shared Secret, independent de Google.

### F. Produse în RevenueCat (Android)

1. **RevenueCat → Project → Products.**  
   Asigură-te că există produsele pentru Android cu **Identifier** = exact ID-urile din Play (ex: `monthly`, `yearly`, `lifetime`).
2. **Project → Entitlements:** entitlement-ul tău (ex: `pro`) trebuie să aibă atașate aceste produse Android.
3. **Project → Offerings** (ex: `default`): în offering, package-urile (monthly, yearly, lifetime) trebuie să pointeze la produsele Google cu ID-urile corecte.

### Rezumat checklist Google Play

- [ ] Cont merchant (Payments profile) în Play Console  
- [ ] App creată, Store listing complet, primul build încărcat (sau pe track de test)  
- [ ] Abonamente create (Monetize → Subscriptions) cu ID-uri: `monthly`, `yearly`, `lifetime` (sau cum le ai în cod)  
- [ ] Service account în Google Cloud, cheie JSON descărcată  
- [ ] Service account invitat în Play Console (API access) cu drepturi Orders and subscriptions  
- [ ] App Android adăugată în RevenueCat, JSON încărcat  
- [ ] Products + Entitlement + Offerings configurate în RevenueCat pentru aceste ID-uri  

### Ce trebuie în Play Console (orice variantă: același cont sau cont nou)

Indiferent dacă folosești același cont (cu cheie făcută de admin) sau un cont Google nou unde poți crea tu cheia, în **Play Console** trebuie să ai:

| # | Ce | Unde în Play Console | Detalii |
|---|----|----------------------|---------|
| 1 | **Cont developer** | – | Taxă unică ~25 USD dacă e cont nou |
| 2 | **Payments profile** | Setup → Payments profile | Cont merchant (țară, fiscal, bancar) |
| 3 | **Aplicația** | All apps → Create app (sau app existentă) | Package: `com.kheia.edumat` |
| 4 | **Store listing** | app → Main store listing | Titlu, descriere, grafică (minim pentru a putea încărca build) |
| 5 | **Abonament lunar** | Monetize → Subscriptions → Create | Product ID: `monthly` (sau exact cum e în `purchases.service.ts`) |
| 6 | **Abonament anual** | Idem | Product ID: `yearly` |
| 7 | **Lifetime** | Monetize → One-time products (sau Subscriptions) | Product ID: `lifetime` |
| 8 | **API access** | Setup → API access | Proiect Cloud legat; service account cu **Grant access** și drepturi: **View financial data, orders and cancellation** + **Manage orders and subscriptions** |
| 9 | **Build** | Release → Testing (sau Production) | Cel puțin un AAB încărcat (ex: `eas build --platform android`) |
| 10 | (Opțional) **License testers** | Setup → License testing | Gmail-uri care pot testa fără plată reală |

După ce ai JSON-ul service account-ului (din varianta aleasă), îl încarci în **RevenueCat** la app-ul Google Play (package `com.kheia.edumat`). Fără pasul 8 (API access + service account cu drepturi), RevenueCat nu poate citi comenzi din Play.  

---

## Pas 4: Entitlements și Offerings în RevenueCat

1. **Entitlements**  
   - **Project → Entitlements** → creează un entitlement, ex: `premium`.  
   - Acesta reprezintă „are acces premium” (lunar/anual/full_edumat).

2. **Products**  
   - **Project → Products** → asociază fiecare Product ID (iOS și Android) cu entitlement-ul `premium`.

3. **Offerings** (opțional dar recomandat)  
   - **Project → Offerings** → creează un offering, ex: `default`.  
   - Adaugă **packages**: monthly, yearly, lifetime (sau cum le ai tu).  
   - Astfel, app-ul poate încărca oferta cu `Purchases.getOfferings()` și afișa pachete cu prețuri reale.

---

## Pas 4b: Create your first paywall

Când în dashboard apare secțiunea **„Create your first paywall”**, ai două variante:

### Varianta A: Paywall cu editorul vizual RevenueCat (recomandat pentru început)

1. În RevenueCat: **Project → Paywalls** (sau link-ul **Create your first paywall**).
2. Apasă **New paywall** → alege un template (ex: „Default” sau „Minimal”).
3. **Design:** folosești editorul vizual pentru:
   - titlu, descriere, butoane (Monthly / Yearly / Lifetime);
   - culori, fonturi, imagine de fundal (dacă vrei).
4. **Offering:** asociază paywall-ul cu offering-ul tău (ex: `default`). Astfel, când app-ul apelează `presentPaywall()` sau `presentPaywallIfNeeded()`, RevenueCat trimite acest layout și prețurile din offering.
5. **Save** / **Publish**. Paywall-ul devine „current” pentru acel offering și va apărea în app la următorul apel.

**În app-ul tău (KHEYA):** deja folosești `presentPaywall()` și `presentPaywallIfNeeded()` din `purchases.service.ts`. După ce paywall-ul e creat și publicat în dashboard, aceste apeluri vor afișa paywall-ul configurat (în development build).

### Varianta B: Paywall propriu (custom UI)

Poți ignora paywall-ul din dashboard și să afișezi tu ecranul de abonament (ex: `app/subscription.tsx`) cu oferta luată din `getOfferings()` și cumpărăturile prin `purchasePackage()`. Aplicația ta face deja asta: ecranul de subscripție e custom, iar `presentPaywall()` e opțional dacă vrei în schimb UI-ul nativ RevenueCat.

**Rezumat:** La „Create your first paywall” poți apăsa **Create** → alege template → customizează → leagă de offering `default` → Publish. Apoi în app, la apelul `presentPaywall()` (sau la deschiderea ecranului de abonament, după cum e implementat), va apărea paywall-ul.

---

## Unde e setat paywall-ul / ecranul de abonament în app

- **Paywall UI RevenueCat** (`presentPaywall()` / `presentPaywallIfNeeded()`) din `src/services/purchases.service.ts` **nu e apelat nicăieri** în aplicație. Funcțiile există și pot fi folosite dacă vrei să afișezi paywall-ul nativ RevenueCat.
- **Ecranul de abonament folosit acum** este cel **custom**: `app/subscription.tsx` (ruta `/subscription`). Acesta afișează planurile (Lunar, Anual, KHEYA Premium) și folosește RevenueCat prin `purchasePackage()` din `purchases.service.ts`.

**Unde se deschide ecranul de abonament („paywall”):**

| Unde | Când | Cum |
|------|------|-----|
| **După rezultatul quiz-ului** | Când utilizatorul a făcut quiz-ul gratuit (5 întrebări) sau când e afișată oferta de discount (concierge) | Buton „Deblochează 10 întrebări și acces complet” → `router.push('/subscription', { source, discount24h })` |
| Fișier | `app/chapter/[chapterId]/quiz-result.tsx` | Vizibil dacă `fromFreeQuiz === 'true'` sau `showDiscountOffer` este true |

**Dacă vrei să folosești paywall-ul nativ RevenueCat** în loc de ecranul custom: poți apela în același context (ex. în quiz-result sau la deschiderea unei funcții premium) pe `presentPaywall()` sau `presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'pro' })` din `purchases.service.ts`. Trebuie să ai `react-native-purchases-ui` instalat și paywall creat în dashboard RevenueCat.

---

## Pas 5: Cheia API în aplicație

1. În RevenueCat: **Project → API Keys**.
2. Copiază **Public API key** (nu Secret key) pentru platforma dorită:
   - **Apple** – pentru build iOS.
   - **Google** – pentru build Android.  
   Poți folosi și o cheie comună dacă ai un singur proiect.
3. În proiectul tău:
   - Deschide `.env` (sau creează din `.env.example`).
   - Adaugă:
     ```env
     EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE=appl_xxxxxxxx
     EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE=goog_xxxxxxxx
     ```
   - Pentru development poți folosi temporar aceeași cheie pentru ambele; pentru producție folosești cheile per platformă.
4. În **EAS / build-uri** (ex: `eas.json` sau EAS Secrets), adaugă aceste variabile ca env la build, ca să fie disponibile în app.

---

## Pas 6: Pachete npm și build nativ

In-app purchases nu merg în **Expo Go**; trebuie **development build** (ex: `expo run:ios` / `expo run:android` sau EAS Build).

1. Instalare dependențe (în rădăcina proiectului):
   ```bash
   npx expo install react-native-purchases
   ```
2. **Identificatori de package în RevenueCat**  
   În dashboard, la Offering-ul tău (ex: `default`), asigură-te că package-urile au identifier-e pe care app-ul le folosește: `monthly`, `yearly`, `full_edumat`. Poți folosi și ID-urile implicite RevenueCat (`$rc_monthly`, `$rc_annual` etc.) – atunci în proiect trebuie actualizat maparea din `src/services/purchases.service.ts` (`PLAN_TO_PACKAGE_ID`).
3. Rebuild aplicație nativă:
   - iOS: `npx expo run:ios`
   - Android: `npx expo run:android`
   - Sau: `eas build --profile development` (apoi instalezi build-ul pe device/simulator).

După ce ai pus cheile în `.env` (și în EAS dacă folosești EAS Build), ecranul de abonament din app va folosi RevenueCat pentru oferte și cumpărături reale.

---

## Pas 7: Verificare / Make your first purchase

Când în RevenueCat vezi **„Make your first purchase”**, trebuie să faci o cumpărare de test din app.

### Cum declanșezi cumpărarea în app (KHEYA)

1. **Rulează app-ul** într-un **development build** (nu în Expo Go):
   ```bash
   npx expo run:android
   ```
   sau instalează un build EAS pe device.

2. **Deschide ecranul de abonament** (KHEYA Premium) – de obicei din meniu sau din prompt-ul „Upgrade”.

3. **Apasă pe un plan** (Lunar, Anual sau KHEYA Premium). Butonul apelează `handlePurchase(planId)` → `purchasePackage(packageId)` din `purchases.service.ts`, deci cumpărătura e declanșată direct din ecranul tău.

4. **Finalizează fluxul** în fereastra Google Play Billing (sandbox):
   - **Android:** dacă app-ul e pe **Internal testing** sau **Closed testing**, contul tău (sau conturile din **License testers** în Play Console) pot cumpăra fără card real; tranzacția e anulată automat după câteva minute.
   - Poți adăuga contul de test în **Play Console → Setup → License testing** ca „License tester” ca să nu fii debitat.

5. După ce „plata” reușește, app-ul te redirecționează la **subscription-success** și în **RevenueCat → Customers** ar trebui să apară tranzacția și utilizatorul cu entitlement-ul `premium` (sau `pro`).

**Rezumat:** La „Make your first purchase” nu trebuie să scrii cod suplimentar – doar rulezi app-ul în development build, mergi la ecranul Abonament, apeși pe un plan și finalizezi flow-ul de plată de test. RevenueCat va înregistra prima cumpărare și secțiunea va fi considerată completă.

---

## Secure your sandbox access (Sandbox allow list)

Când în RevenueCat vezi **„Secure your sandbox access”** / **Sandbox allow list**:

- **Ce este:** Cumpărăturile de test rulează în **sandbox**. Lista de allow list îți permite să restricționezi **cine** poate face cumpărături de test (ex: doar conturile tale de dezvoltare), astfel încât utilizatorii reali să nu primească accidental entitlement-uri sau monedă virtuală din sandbox.

- **Când o folosești:**  
  - **Opțional** la început: poți să lași lista goală și să testezi cu orice cont; pe Android, de fapt sandbox-ul e controlat de **Google Play** (Internal/Closed testing + License testers), nu direct de RevenueCat.  
  - **Recomandat** când ai mai mulți testeri sau vrei să te asiguri că doar anumite ID-uri de user (ex: `user_id` din Supabase) sau email-uri pot face cumpărături de test în RevenueCat.

- **Cum configurezi:** În RevenueCat → **Project → Sandbox** (sau secțiunea indicată în onboarding) adaugi în **Allow list**:
  - **App User ID-uri** (ex: ID-ul utilizatorului din app, același pe care îl trimiți la `Purchases.logIn(userId)`), sau  
  - **Email-uri** (dacă platforma suportă),  
  pentru persoanele care au dreptul la cumpărături sandbox. Doar aceste conturi vor putea finaliza plăți de test; restul vor vedea flow-ul de producție (sau eroare, în funcție de setare).

**Pe scurt:** E un pas de securitate opțional. Poți să îl sari la început; când vrei control mai strict, adaugi în Sandbox allow list ID-urile sau email-urile testerilor tăi.

---

## Create a real app configuration (Producție / Live purchases)

Când în RevenueCat vezi **„Create a real app configuration”** / **Your app is connected to the Test Store**:

- **Ce înseamnă:** App-ul tău folosește în prezent **Test Store** (sandbox). Înainte de a publica în Store, trebuie să ai o **configurare pentru magazinul real** (App Store / Play Store) și să folosești **API key-ul de producție** în build-urile live, ca RevenueCat să proceseze **cumpărături reale**, nu doar de test.

- **Ce faci:**

  1. **Configurarea „reală” e deja făcută** dacă ai adăugat în RevenueCat app-ul **Google Play** (și, pentru iOS, **App Store**) cu package name / bundle ID-ul aplicației și cu Service credentials (JSON) / Shared Secret. Același app din RevenueCat servește atât sandbox cât și producția; diferența o face **cheia API** folosită în app.

  2. **API Keys de producție:** În RevenueCat → **Project → API Keys** ai (de obicei) două chei publice:
     - una pentru **sandbox / test** (o folosești în development),
     - una pentru **production** (live).
     Copiază **Public API key** pentru **Production** (Google și/sau Apple).

  3. **În aplicația ta (KHEYA):** În build-urile de **producție** (cele care vor fi în Play Store / App Store) trebuie să folosești cheia de **producție**, nu cea de test.
     - În **EAS Build** pentru producție: adaugi în **EAS Secrets** (sau în `eas.json` sub env al profilului de producție) variabilele:
       - `EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE=<cheia_ta_production_google>`
       - `EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE=<cheia_ta_production_apple>` (când ai și iOS)
     - În **.env** local poți păstra cheile de test; la `eas build --profile production` EAS va injecta secreturile, deci build-ul de producție va folosi cheile live.

  4. **Verificare:** După ce ai setat cheile de producție în EAS (sau în alt sistem de build pentru release), următorul build de producție va trimite tranzacțiile live către RevenueCat. În **RevenueCat → Customers** vor apărea cumpărătorii reali după ce aplicația e publicată și utilizatorii cumpără.

**Rezumat:** „Real app configuration” = ai deja app-ul Store conectat în RevenueCat; mai trebuie doar să folosești **Production API key** în build-urile pe care le uploadezi în Play Store / App Store (ex: prin EAS Secrets pentru profilul `production`), nu cheia de test. Apoi RevenueCat procesează live purchases.

---

## Checklist complet – Apple App Store + Google Play

Toate punctele de mai jos sunt necesare pentru a avea abonamentele KHEYA Premium live pe ambele store-uri. Bifează pe măsură ce le finalizezi.

### Conturi și acces

| # | Task | Unde | Status |
|---|------|------|--------|
| 1 | Cont **RevenueCat** | [revenuecat.com](https://www.revenuecat.com) | ☐ |
| 2 | Proiect RevenueCat creat (ex: KHEYA) | RevenueCat → Projects | ☐ |
| 3 | Cont **Apple Developer** (99 USD/an) | [developer.apple.com](https://developer.apple.com) | ☐ |
| 4 | Cont **Google Play Console** (taxă unică ~25 USD) | [play.google.com/console](https://play.google.com/console) | ☐ |

---

### Apple App Store

| # | Task | Unde | Detalii | Status |
|---|------|------|---------|--------|
| 5 | App creată în **App Store Connect** | App Store Connect → My Apps | Bundle ID: `com.kheia.edumat` (din app.json) | ☐ |
| 6 | **App Information** completată | App → App Information | Nume, categorie, etc. | ☐ |
| 7 | **Shared Secret** generat | Users and Access → Shared Secret (sau App → In-App Purchase → Manage) | Copiezi valoarea pentru RevenueCat | ☐ |
| 8 | **In-App Purchase** – abonament lunar | App → In-App Purchases → + → Auto-Renewable Subscription | Product ID ex: `monthly` sau `kheia_premium_monthly` | ☐ |
| 9 | **In-App Purchase** – abonament anual | Idem | Product ID ex: `yearly` sau `kheia_premium_yearly` | ☐ |
| 10 | **In-App Purchase** – lifetime / KHEYA Premium | Idem sau Non-Renewing Subscription / Consumable | Product ID ex: `lifetime` sau `kheia_full_edumat` | ☐ |
| 11 | **App** iOS adăugat în RevenueCat | RevenueCat → Project → Apps → Add app → Apple | Bundle ID + Shared Secret introdus | ☐ |
| 12 | **Agreements, Tax, Banking** semnate | App Store Connect → Agreements, Tax | Necesar pentru a publica | ☐ |

---

### Google Play

| # | Task | Unde | Detalii | Status |
|---|------|------|---------|--------|
| 13 | **Payments profile** (cont merchant) | Play Console → Setup → Payments profile | Țară, date fiscale, cont bancar; aprobare 1–2 zile | ☐ |
| 14 | **Aplicație** creată | Play Console → All apps → Create app | Package: `com.kheia.edumat` | ☐ |
| 15 | **Store listing** complet | Play Console → app → Main store listing | Titlu, descriere, grafică, etc. | ☐ |
| 16 | **Subscriptions** – lunar | Monetize → Subscriptions → Create subscription | Product ID: `monthly` (sau aliniat cu cod) | ☐ |
| 17 | **Subscriptions** – anual | Idem | Product ID: `yearly` | ☐ |
| 18 | **Lifetime** (one-time) | Monetize → One-time products (sau Subscription) | Product ID: `lifetime` | ☐ |
| 19 | **Google Cloud** – Service account | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials | Create credentials → Service account → Keys → JSON download | ☐ |
| 20 | **Play Console → API access** – Grant access | Setup → API access → service account | Bifezi: View financial data, Manage orders and subscriptions | ☐ |
| 21 | **App** Android adăugat în RevenueCat | RevenueCat → Project → Apps → Add app → Google Play | Package name `com.kheia.edumat` + încărcare JSON | ☐ |

---

### RevenueCat – produse și oferte

| # | Task | Unde | Detalii | Status |
|---|------|------|---------|--------|
| 22 | **Entitlement** creat (ex: `pro`) | RevenueCat → Project → Entitlements | Un singur entitlement pentru „are premium” | ☐ |
| 23 | **Products** – iOS | RevenueCat → Project → Products | Product IDs din App Store Connect atașate la entitlement `pro` | ☐ |
| 24 | **Products** – Android | Idem | Product IDs din Play (monthly, yearly, lifetime) atașate la `pro` | ☐ |
| 25 | **Offering** (ex: `default`) | RevenueCat → Project → Offerings | Creare offering `default` | ☐ |
| 26 | **Packages** în offering | În offering-ul `default` | Packages: identifier `monthly`, `yearly`, `lifetime` (sau cum le folosești în cod) | ☐ |
| 27 | (Opțional) **Paywall** creat și publicat | RevenueCat → Paywalls | Template + legare la offering `default` | ☐ |

---

### Chei API și variabile în proiect

| # | Task | Unde | Detalii | Status |
|---|------|------|---------|--------|
| 28 | **API Keys** copiate din RevenueCat | RevenueCat → Project → API Keys | Public key pentru **Apple** și pentru **Google** (test și/sau production) | ☐ |
| 29 | **.env** în proiect | `.env` (din `.env.example`) | `EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE=...` și `EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE=...` | ☐ |
| 30 | **EAS Secrets** (pentru build) | `eas secret:list` / dashboard EAS | Aceleași variabile setate pentru profilele de build (development, preview, production) | ☐ |
| 31 | **Production** API keys în EAS | EAS Secrets pentru profil `production` | Pentru release în Store folosești cheile de **Production** din RevenueCat | ☐ |

---

### Build și publicare

| # | Task | Unde | Detalii | Status |
|---|------|------|---------|--------|
| 32 | **react-native-purchases** instalat | `package.json` | `npx expo install react-native-purchases` (și opțional react-native-purchases-ui) | ☐ |
| 33 | **Development build** Android | `npx expo run:android` sau EAS | In-app purchases nu merg în Expo Go | ☐ |
| 34 | **Development build** iOS | `npx expo run:ios` sau EAS | Idem | ☐ |
| 35 | **AAB** pentru Google Play | `eas build --platform android --profile production` | Încărcat pe Play Console → Release → Production (sau Testing) | ☐ |
| 36 | **IPA** pentru App Store | `eas build --platform ios --profile production` | Încărcat în App Store Connect (Transporter sau EAS Submit) | ☐ |
| 37 | **License testers** (Android, opțional) | Play Console → Setup → License testing | Conturi care pot testa cumpărături fără plată reală | ☐ |
| 38 | **Sandbox testers** (iOS, opțional) | App Store Connect → Users and Access → Sandbox | Conturi pentru testare în-app purchase | ☐ |

---

### Testare și go-live

| # | Task | Unde | Detalii | Status |
|---|------|------|---------|--------|
| 39 | **Test cumpărare** Android | App pe device (development build) | Ecran Abonament → apăsare plan → finalizare flow Google Play (sandbox) | ☐ |
| 40 | **Test cumpărare** iOS | App pe device/simulator (development build) | Idem, cu cont Sandbox Apple | ☐ |
| 41 | Verificare **RevenueCat → Customers** | RevenueCat dashboard | Tranzacția de test apare; user are entitlement `pro` | ☐ |
| 42 | (Opțional) **Sandbox allow list** | RevenueCat → Sandbox | Restricționare cine poate face cumpărături de test | ☐ |

---

### Rezumat pe categorii

- **Conturi:** RevenueCat, Apple Developer, Google Play Console, Payments profile (Google), Agreements (Apple).
- **App Store:** App + Shared Secret + 3 produse in-app (monthly, yearly, lifetime) + app adăugat în RevenueCat.
- **Google Play:** App + Store listing + 3 produse (Subscriptions/One-time) + Service account JSON + API access + app adăugat în RevenueCat.
- **RevenueCat:** Entitlement `pro`, Products (iOS + Android), Offering `default` cu packages, (opțional) Paywall.
- **Proiect:** `.env` + EAS Secrets cu API keys (test + production pentru release).
- **Build:** Development build pentru test; AAB + IPA pentru upload în Store; testare cumpărare pe ambele platforme.

După ce toate punctele sunt bifate, integrarea din cod (purchases.service.ts, subscription.tsx) folosește RevenueCat pentru oferte și cumpărături pe ambele store-uri.
