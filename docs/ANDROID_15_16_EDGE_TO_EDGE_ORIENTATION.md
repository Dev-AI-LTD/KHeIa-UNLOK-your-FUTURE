# Android 15 / 16 – Edge-to-edge și orientare (Google Play)

Google Play poate afișa avertismente legate de:
1. **API-uri depreciate pentru edge-to-edge** (Android 15)
2. **Restricții de orientare / resizability** (Android 16, tablete și foldable)

---

## 1. Ce am făcut în proiect

### Orientare (MainActivity)

- În **`app.json`**: **`"orientation": "default"`** (nu portrait fix).
- În **`AndroidManifest.xml`**: pe `MainActivity` **nu** mai există `android:screenOrientation` — Play Console nu mai raportează blocare `PORTRAIT` pentru versiunea **0.3.0**+.
- **Recomandare:** Testează layout în landscape și pe tabletă / foldable; UX-ul în portrait rămâne principal pe telefoane, dar aplicația poate fi redimensionată conform politicii Android 16.

### Edge-to-edge (Android 15)

- În **`app.json`** la `expo.android` s-a adăugat **`"edgeToEdgeEnabled": true`**.
- Expo SDK 54 folosește deja mecanisme moderne pentru edge-to-edge; această setare explică că aplicația este pregătită pentru modul edge-to-edge.

### API-uri depreciate (setStatusBarColor, setNavigationBarColor, LAYOUT_IN_DISPLAY_CUTOUT_MODE_*)

- Aceste apeluri provin din **React Native**, **react-native-screens** și **Material components** (BottomSheet etc.) din `node_modules`.
- **Nu se pot elimina direct** din proiectul tău; fix-urile vin cu actualizări Expo / React Native / react-native-screens.
- **Ce poți face:**
  - Păstrează **Expo** și **react-native-screens** la ultimele versiuni compatibile (ex. `npx expo install --fix`).
  - La fiecare upgrade major Expo (ex. 55, 56), verifică changelog-ul pentru „Android 15”, „edge-to-edge”, „WindowInsetsController”.
- Google afișează avertismentul, dar aplicația continuă să funcționeze; pe Android 16 unele API-uri vor fi pur și simplu ignorate de sistem. **Nu există încă un patch aplicabil doar în proiectul KHEIA** fără upgrade de Expo / React Native / `react-native-screens`; după fiecare `expo upgrade`, rulează `npx expo install --fix` și reverifică în Play pre-launch report.

---

## 2. Rezumat pentru Google Play

| Problemă | Măsură în proiect |
|----------|--------------------|
| `android:screenOrientation="PORTRAIT"` / restricții pe ecran mare | `orientation: "default"` în `app.json`; fără atribut `screenOrientation` pe `MainActivity` în manifest. |
| Edge-to-edge / API-uri depreciate | `app.json` → `android.edgeToEdgeEnabled: true`; actualizări viitoare Expo/RN vor reduce avertismentele. |

---

## 3. Resurse

- [Expo – Edge-to-Edge display (Android)](https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android)
- [Expo – System bars](https://docs.expo.dev/develop/user-interface/system-bars/)
- [Android – Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
