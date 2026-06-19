# App Store Connect — App Description (copy-paste)

**App:** KHEYA – Unlock Your Future (`com.kheia.edumat`)

Paste the **English** block into **App Store Connect → App Information → Description** (or localized description).  
The legal lines at the bottom satisfy Guideline **3.1.2(c)** (Terms of Use / EULA link in metadata).

---

## English (recommended for ASC)

```
KHEYA helps Romanian students prepare for Evaluarea Națională (EN) and Bacalaureat (BAC) with structured theory, quizzes, tests, and an AI study tutor.

• Theory and quizzes per chapter (EN & BAC subjects)
• Simulated tests and progress tracking
• Gamification: XP, streaks, school leaderboard
• KHEYA Pro: unlimited chapters, 10-question quizzes, ad-free experience

Subscriptions (auto-renewing):
• KHEYA Pro Monthly — billed monthly
• KHEYA Pro Yearly — billed annually (best value)
Manage or cancel anytime in your Apple ID → Subscriptions.

Privacy Policy: https://www.kheya.ro/politicadeconfidentialitate
Terms of Use (EULA): https://kheya.ro/terms

Support: contact@kheya.ro
```

---

## Română (opțional — descriere localizată RO)

```
KHEYA te ajută să te pregătești pentru Evaluarea Națională și Bacalaureat cu teorie structurată, quiz-uri, teste și tutor AI.

• Teorie și quiz-uri pe capitole (materii EN și BAC)
• Simulări și urmărirea progresului
• Gamificare: XP, streak, clasament pe școală
• KHEYA Pro: toate capitolele, quiz-uri cu 10 întrebări, fără reclame

Abonamente (reînnoire automată):
• KHEYA Pro Lunar — facturare lunară
• KHEYA Pro Anual — facturare anuală (cel mai avantajos)
Poți anula oricând din Apple ID → Abonamente.

Politica de confidențialitate: https://www.kheya.ro/politicadeconfidentialitate
Termeni și condiții (EULA): https://kheya.ro/terms

Suport: contact@kheya.ro
```

---

## App Information fields

| Field | URL |
|-------|-----|
| **Privacy Policy URL** | `https://www.kheya.ro/politicadeconfidentialitate` |
| **Support URL** | `https://kheya.ro` or `mailto:contact@kheya.ro` |
| **Terms (EULA)** | Link in Description above **or** upload custom EULA in ASC |

---

## Deploy terms page (required — currently 404)

`https://kheya.ro/terms` must return **200** before resubmit.

1. Upload `landing/terms.html` to your `kheya.ro` host at path `/terms` or `/terms.html`.
2. Verify: open URL in browser (no 404).
3. If your host serves the `landing/` folder at root, `terms.html` becomes `https://kheya.ro/terms.html` — then update `EXPO_PUBLIC_TERMS_URL` and Description links to match.
