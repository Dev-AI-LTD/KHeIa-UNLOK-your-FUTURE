# Cont de review (email + parolă) – Premium în Supabase

**Autentificarea** este prin **Kinde** (email + parolă), nu direct în Supabase Auth UI.

Ghid complet (Kinde + Premium + App Store Connect): **`docs/APPLE_REVIEW_ACCOUNT.md`**.

Mai jos: cum acorzi Premium manual în Supabase dacă ai nevoie (după ce userul s-a logat cel puțin o dată).

---

## Pas cu pas în Supabase

### 1. Deschide Supabase

1. Intră pe [supabase.com](https://supabase.com) și loghează-te.
2. Deschide **proiectul** tău (cel folosit de app KHEYA).

### 2. Mergi la Authentication → Users

1. În **meniul din stânga** apasă pe **Authentication** (icon cu cheie/persoană).
2. Apasă pe **Users** (sub Authentication).

### 3. Adaugă utilizatorul de review

1. Apasă butonul **„Add user”** (sau **„Invite user”** / **„Create new user”**, în funcție de versiunea UI).
2. Alege **„Create new user”** (nu Invite, ca să setezi tu parola).

### 4. Completează emailul și parola

1. **Email:** tastează adresa pentru reviewers, de ex.  
   `google.play.review@kheia.ro`
2. **Password:** tastează parola pe care o vei da reviewerilor și o vei pune în Play Console, de ex.  
   `ReviewKheya2026!`  
   (minim 6 caractere; păstreaz-o notată în siguranță.)
3. Opțional: la **„User metadata”** poți lăsa gol sau puteți adăuga `display_name`: `Google Play Reviewer`.
4. Apasă **„Create user”** (sau **„Add user”**).

### 5. Ce se întâmplă în spate

- Supabase creează rândul în **auth.users**.
- Trigger-ul tău (**handle_new_user**) creează automat un rând în **profiles** pentru acest user.
- Utilizatorul poate folosi imediat acest email + parolă în app la **Autentificare**.

### 6. Unde „pun” emailul și parola pentru review?

- **În Supabase:** sunt setate la **pasul 4** – același email și parolă cu care ai creat userul.
- **Pentru Google:** le copiezi în **Play Console** la secțiunea **App access** (instrucțiunile pentru reviewers), la câmpurile de tip „Email” și „Password”, exact valorile de la pasul 4.

Nu există altă pagină în Supabase unde să „introduci” separat email/parolă de probă; totul este acest user pe care tocmai l-ai creat.

---

## Rezumat

| Unde              | Ce faci |
|-------------------|--------|
| **Supabase**      | Authentication → Users → Add user → pui **email** + **parolă** → Create user. |
| **Play Console**  | App access → Instrucțiuni pentru reviewers → scrii același **email** și **parolă**. |

---

## Da acces Premium contului de review

Implicit, userul nou are **subscription_type = free** (fără Premium). Ca reviewerul să vadă tot conținutul fără paywall, îi dai Premium în Supabase în unul din modurile de mai jos.

### Varianta A: Din Table Editor

1. **Supabase Dashboard** → **Table Editor** → tabela **`profiles`**.
2. Găsești rândul unde **id** = id-ul userului de review (îl vezi în **Authentication** → **Users** → apasă pe user → copiază **User UID**).
3. La acel rând, în coloana **`subscription_type`** schimbi din `free` în **`monthly`** (sau `yearly`).
4. Salvezi (Save).

### Varianta B: Din SQL Editor (rapid)

1. **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Lipești query-ul de mai jos și **înlocuiești** `google.play.review@kheia.ro` cu emailul real al contului de review.
3. Apasă **Run**.

```sql
-- Dă acces Premium contului de review (înlocuiește emailul cu cel al userului)
update public.profiles
set subscription_type = 'monthly'
where id = (select id from auth.users where email = 'google.play.review@kheia.ro');
```

După ce rulezi una dintre variante, contul respectiv este considerat **Premium** în app (toate capitolele și testele deblocate). Poți verifica logând în app cu acel email și parolă.

---

Detalii despre instrucțiunile pentru Google Play sunt în **`docs/GOOGLE_PLAY_APP_ACCESS_INSTRUCTIONS.md`**.
