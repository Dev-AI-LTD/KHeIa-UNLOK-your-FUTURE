# Fluxuri utilizator și emailuri – KHEYA

Detalii despre ce se întâmplă la login, înregistrare, resetare parolă și abonament: de la cine primesc utilizatorii emailuri și unde ajung în app după fiecare acțiune.

**Autentificare actuală:** doar **email + parolă** prin **Kinde** (hosted UI). **Nu** există login social (Google / Apple / Facebook) în app sau în Kinde.

---

## 1. Log in (conectare) – email + parolă (Kinde)

| Ce face userul | Ce primește | Unde ajunge în app |
|----------------|-------------|---------------------|
| Apasă **Autentificare** → se deschide pagina Kinde → completează email + parolă | **Niciun email** la login reușit. | După succes → bridge Kinde→Supabase → **Acasă** (`/(tabs)/home`). |

**Implementare:** `app/(auth)/login.tsx` → `kinde.login()` → `bridgeKindeToSupabase()` → sesiune Supabase.

**De la cine ar veni eventual un email:** Nu se trimite email la log in reușit.

---

## 2. Înregistrare (sign up) – email + parolă (Kinde)

| Ce face userul | Ce primește | Unde ajunge în app |
|----------------|-------------|---------------------|
| Apasă **Creează cont gratuit** → pagina Kinde → email + parolă | Depinde de setările **Kinde** (confirmare email activă/inactivă). | După succes → bridge → **Acasă** (`/(tabs)/home`). |

**De la cine vine emailul (dacă e activ):** **Kinde** (nu Supabase Auth direct). Șabloanele se configurează în **Kinde Dashboard** → Authentication / Email.

**Notă:** Dacă confirmarea email e dezactivată în Kinde, contul e utilizabil imediat, fără email de verificare.

---

## 3. Login social (Google / Apple / Facebook)

**Nu este oferit.** Nu există butoane „Continuă cu Google” în app; conexiunile sociale trebuie să rămână **dezactivate** în Kinde Dashboard.

Pentru **App Store**: **Sign in with Apple nu e obligatoriu** (Guideline 4.8) cât timp rămâne doar email + parolă.

---

## 4. Reset parolă

| Ce face userul | Ce primește | Unde ajunge în app |
|----------------|-------------|---------------------|
| Din pagina Kinde (link „Forgot password?” / echivalent), dacă e activ în dashboard | **Email de resetare** de la **Kinde** | Setează parola nouă în browser/Kinde, apoi se loghează din nou în app |

**Notă:** App-ul nativ **nu** are încă ecran dedicat „Ai uitat parola?” — resetarea se face pe UI-ul Kinde la autentificare.

---

## 5. Abonament (cumpărare Premium)

| Ce face userul | Ce primește | Unde ajunge în app |
|----------------|-------------|---------------------|
| **Profil → Setări → Deblochează KHEYA Pro** (sau paywall din capitol/quiz) → finalizează plata în magazin | **Chitanță de la magazin:** Google Play sau App Store (după setările contului). KHEYA nu trimite email de confirmare abonament. | Entitlement RevenueCat activ → conținut Pro deblocat în app. |

**Restaurare / gestionare:** **Profil → Setări → Restaurare / Gestionează abonamentul** (`presentCustomerCenter()`).

**Plata:** flux nativ **RevenueCat + Google Play / App Store** (fără site extern de plată).

---

## Rezumat rapid

| Acțiune | Email trimis? | De la cine? | Destinație în app |
|---------|----------------|-------------|-------------------|
| **Log in** (email, Kinde) | Nu | – | Acasă |
| **Înregistrare** (email, Kinde) | Opțional – confirmare | Kinde | Acasă |
| **Login social** | N/A | – | **Nu există** |
| **Reset parolă** | Da – link resetare | Kinde | Re-login în app |
| **Abonament** | Nu din app; eventual chitanță magazin | Google Play / Apple | Pro activ în app |

---

## Configurare (Kinde + review)

- **Kinde Dashboard** → Authentication: doar **Email** activ; **dezactivează** Google/Apple/Facebook.
- **Callback URL** (build nativ): `kheia://kinde_callback` (vezi `src/lib/kindeConfig.ts`).
- **App Review Notes (iOS):** „Authentication is email-only via Kinde. No third-party social login.”
