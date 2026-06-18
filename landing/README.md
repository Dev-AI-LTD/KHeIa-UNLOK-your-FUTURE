# KHEYA - Pagină de prezentare

Pagina web de prezentare pentru aplicația KHEYA.

## Deploy

Paginile legale trebuie publice pentru App Store:
- `privacy.html` → `https://www.kheya.ro/politicadeconfidentialitate` (sau host echivalent)
- `terms.html` → `https://kheya.ro/terms` (**obligatoriu** — Apple 3.1.2)

### GitHub Pages
1. În repository, mergi la **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/landing`
4. Salvează – pagina va fi disponibilă la `https://username.github.io/repo-name/`

### Netlify / Vercel
1. Conectează repository-ul
2. Setează **Root directory** la `landing`
3. Deploy

### Manual (servire locală)
```bash
cd landing
npx serve .
# sau: python -m http.server 8080
```

## Personalizare

- **Link download:** Editează `index.html` și schimbă `href` din `.cta` cu link-ul către App Store / Google Play când aplicația va fi publicată.
- **Culori:** Modifică variabilele CSS din `:root` în `<style>`.
