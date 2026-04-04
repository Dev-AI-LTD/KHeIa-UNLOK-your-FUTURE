# R8 / ProGuard – cod obfuscat pentru Android

## Nu uita: fișierul de deobfuscare (mapping.txt)

După **fiecare** build release încărcat pe Play:

1. În **expo.dev** → Builds → deschide build-ul Android (AAB) pentru acea versiune (ex. **0.3.0** / versionCode **3**).
2. La **Artifacts** descarcă **`mapping.txt`** (EAS îl atașează pentru că în **`eas.json`** există `buildArtifactPaths`: `android/app/build/outputs/mapping/release/mapping.txt` pentru profilele **preview** și **production**).
3. În **Play Console** → versiunea / app bundle-ul aceluiași build → încarcă **Deobfuscation file** / **mapping file** (același `mapping.txt`).

Fără acest pas, crash-urile Java/Kotlin rămân obfuscate în Play. **Nu** reutiliza `mapping.txt` de la alt versionCode.

---

Fișierul **`android-proguard-rules.pro`** din rădăcina proiectului conține regulile ProGuard. Îl poți încărca unde ai nevoie sau copia conținutul.

---

## 1. Instalare plugin (o dată)

În rădăcina proiectului:

```bash
npx expo install expo-build-properties
```

---

## 2. Activare R8/ProGuard în `app.json`

Adaugă în `app.json` la `expo.plugins`:

```json
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true
    }
  }
]
```

Dacă vrei și reguli custom, poți folosi conținutul din `android-proguard-rules.pro` ca string în `extraProguardRules` (vezi mai jos).

---

## 3. Reguli ProGuard (fișier separat)

Conținutul din **`android-proguard-rules.pro`** îl poți:

- **Varianta A:** Copia în clipboard și în config (ex. `extraProguardRules` ca string, linii separate cu `\n`).
- **Varianta B:** Păstra ca fișier în proiect; cu un config plugin care citește fișierul, aceste reguli se aplică la build.

---

## 4. mapping.txt (ReTrace) – unde îl obții și cum îl încarci

**mapping.txt nu se poate crea manual.** Îl generează R8 la build-ul Android (release). Fără el, Play Console nu poate „de-obfusca” stack trace-urile pentru versiunea curentă (ex. **0.3.0**).

### Cum obții mapping.txt

1. **După un build EAS** (preview sau production):
   - Mergi la [expo.dev](https://expo.dev) → proiectul **kheia** → **Builds**.
   - Deschide build-ul Android (AAB) pentru versiunea pe care ai publicat-o (ex. **0.3.0**).
   - La **Artifacts** (sau **Build artifacts**) ar trebui să apară **mapping.txt** (dacă R8 a rulat și calea din `buildArtifactPaths` există).
   - Descarcă **mapping.txt** și păstrează-l pentru versiunea respectivă.

2. **Dacă nu apare mapping.txt** la artifacte:
   - Asigură-te că ai rulat `npx expo install expo-build-properties` și că în `app.json` este activat `enableProguardInReleaseBuilds: true`.
   - Fă un **nou** build Android (production sau preview); la release R8 generează `android/app/build/outputs/mapping/release/mapping.txt`, iar EAS îl pune la artifacte dacă în `eas.json` ai `buildArtifactPaths` cu această cale.

### Unde încarci mapping.txt în Play Console (ReTrace)

1. **Play Console** → aplicația KHEYA.
2. **Release** → **App bundle explorer** (sau **Production** / **Testing** → versiunea publicată).
3. Selectează **același app bundle** pentru care ai descărcat `mapping.txt` de la EAS (aceeași versiune / același versionCode).
4. Caută **„Upload mapping file”** / **„ReTrace mapping file”** / **„Deobfuscation file”**.
5. Încarcă fișierul **mapping.txt** descărcat de la EAS.

Fiecare versiune (ex. 0.3.0, 0.3.1) și **fiecare versionCode** trebuie să aibă mapping-ul generat la **acel** build; nu poți folosi mapping de la altă versiune.

### Simboluri native (separat, opțional)

Pentru crash-uri în **cod nativ** (.so), Play poate cere un arhive de debug symbols NDK — altul decât `mapping.txt`. Dacă apare avertisment în consolă, urmează link-ul „Upload native debug symbols” din același ecran de release (documentația Google descrie formatul ZIP).

---

## Rezumat

| Ce | Unde |
|----|------|
| Reguli ProGuard | Fișier **`android-proguard-rules.pro`** (rădăcină proiect) |
| Config Expo | `app.json` → `plugins` + `expo-build-properties` |
| Mapping R8 (upload Play) | `eas.json` → `buildArtifactPaths`; după build: artifact `mapping.txt` → Play Console (**Deobfuscation file**) |
