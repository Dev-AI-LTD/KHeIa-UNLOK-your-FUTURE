# Cont de test „free” pentru Open Testing (Google) și TestFlight (Apple)

Pentru **Open Testing** (Google Play) și **TestFlight** (Apple) poți folosi un cont de test care **nu este abonat** (rămâne ca un user gratuit), ca testerii să verifice:

- limitele free (vezi tabelul de mai jos);
- apariția paywall-ului RevenueCat și mesajele de blocare;
- fluxul către abonament KHEYA Pro (Profil → Deblochează KHEYA Pro).

**Login obligatoriu:** app-ul necesită cont (email + parolă prin Kinde). Nu există „Continuă fără cont”.

## Limite plan FREE (implementate în app)

| Funcție | Limită free | Când apare plata |
|--------|-------------|------------------|
| Capitole (teorie + quiz) | Primele **2** per materie | Capitol 3+ → paywall |
| Quiz pe capitol | Max **5** întrebări (Pro: 10) | După quiz → CTA upgrade |
| Teste EN/BAC | **1** test total | Al doilea test → paywall |
| Ascultare teorie (TTS) | **5 min / zi** | Limită atinsă → paywall |
| Chat | Necesită cont logat | – |

---

## 1. Cum obții un cont „free” pentru testare

### Variantă recomandată: cont dedicat în app

1. **Creează un cont** în aplicație (**Creează cont gratuit** → pagina Kinde, email + parolă), folosind un email dedicat testării, de exemplu:
   - `test.kheia@domeniul-tau.ro`, sau  
   - un Gmail/Apple ID folosit doar pentru testing.

2. **Nu achita** abonament cu acest cont (nici în sandbox, nici în producție). Contul rămâne „free” și va vedea:
   - primele 2 capitole per materie (teorie + quiz);
   - 1 test gratuit;
   - paywall la capitol 3+, al doilea test, TTS după 5 min/zi;
   - Profil → **Deblochează KHEYA Pro** pentru paywall manual.

3. **Trimite testerilor** (pentru Open Testing / TestFlight) aceste credențiale, de exemplu:

   | Câmp    | Valoare (exemplu)     |
   |---------|------------------------|
   | Email   | `test.kheia@domeniul-tau.ro` |
   | Parolă  | `ParolaTaDeTest123!`   |

   (Înlocuiești cu emailul și parola reale pe care le folosești pentru acest cont.)

Testerii se loghează în app cu acest user și verifică comportamentul pentru utilizator **neabonat**.

---

## 2. Google Play – Open Testing

- **Cont free pentru paywall:** folosești contul de mai sus (email + parolă Kinde) care **nu** are abonament. Testerii instalează build-ul din Open Testing și se loghează cu acest cont.
- **Testare cumpărături (sandbox):** vezi secțiunea **2.1** mai jos – License testers.

Rezumat: un singur cont (user + parolă) pe care îl dai testerilor și care **nu este abonat** = experiență free și paywall pentru Open Testing.

### 2.1 Cum deblochează testerii (Premium) pe Google Play

Ca un tester să poată **„plăti” în app** și să fie deblocat (Premium) **fără bani reali**, îi adaugi Gmail-ul în **License testing** în Play Console. Apoi el face o cumpărătură de test din app și primește acces Premium.

**Pași în Google Play Console:**

1. Deschide [Play Console](https://play.google.com/console) și alege aplicația **KHEYA**.
2. În meniul din stânga: **Setup** → **License testing** (sau **Settings** → **License testing**, în funcție de versiunea UI).
3. La **License testers**:
   - Adaugă adresele **Gmail** ale testerilor (câte una per linie sau separate prin virgulă, conform câmpului din consolă).
   - Exemplu: `tester1@gmail.com`, `tester2@gmail.com`
4. Salvează. Modificările sunt active în câteva minute.

**Ce face testerul:**

1. Pe telefon: contul **Google (Gmail)** trebuie să fie același cu cel adăugat la License testers (contul cu care e înscris în track-ul de testing).
2. Instalează app-ul din **Open testing** (linkul din Play Console sau din emailul de invitație).
3. Deschide app-ul, se loghează (email + parolă Kinde).
4. Mergi la **Profil → Deblochează KHEYA Pro** și alege un plan (ex. **Anual**).
5. Se deschide fereastra **Google Play** – va apărea o tranzacție de **test** (nu se debitează card real). Testerul finalizează flow-ul (Confirm / Accept).
6. După finalizare, app-ul îl tratează ca **Premium** (RevenueCat + backend) și este deblocat.

**Important:**  
- Doar conturile Gmail din lista **License testers** pot face acest tip de „cumpărătură” de test.  
- Abonamentul de test expiră după câteva minute/zile (comportament Google); pentru un nou test, testerul poate „cumpăra” din nou sau poți șterge datele app-ului și repeta.

---

## 3. Apple – TestFlight

- **Cont free pentru paywall:** același cont din app (email + parolă Kinde) care **nu** are abonament. Testerii instalează build-ul din TestFlight și se loghează cu acest user.
- **Testare cumpărături (Sandbox):** în **App Store Connect → Users and Access → Sandbox → Testers** creezi Sandbox testers (Apple ID de test). Când un tester vrea să testeze cumpărarea, folosește acel Sandbox Apple ID la promptul de plată; când vrea să vadă din nou paywall-ul și limitele free, folosește contul din app care nu a cumpărat (sau un alt cont app neabonat).

Rezumat: același cont (user + parolă) neabonat = experiență free și paywall pentru TestFlight.

---

## 4. Exemplu de text pentru testeri

Poți pune în descrierea din Open Testing / TestFlight ceva de genul:

```text
Cont de test pentru experiența FREE (fără abonament):
- Email: test.kheia@domeniul-tau.ro
- Parolă: [parola ta de test]

Cu acest cont vei vedea primele 2 capitole per materie, 1 test gratuit, apoi paywall.
Pentru testare cumpărăturilor: folosește License testing (Google) / Sandbox tester (Apple) cu instrucțiunile din email.
```

---

## 5. Nu pune parole în cod

Nu hardcoda în aplicație user/parolă de test. Păstrează credențialele doar în documente interne sau în descrierea pentru testeri (Open Testing / TestFlight). Contul se creează o dată în app (înregistrare normală), nu se plătește, și se distribuie doar emailul + parola către echipa de testare.
