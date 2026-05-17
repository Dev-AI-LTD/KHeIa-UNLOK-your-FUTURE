# Chat comunitate — setup MVP

## 1. Supabase

1. Deschide [Supabase Dashboard](https://supabase.com/dashboard) → proiectul KHEYA.
2. **SQL Editor** → New query → lipește conținutul din `supabase/migrations/020_global_chat.sql` → Run.
3. **Database → Replication** → verifică că tabela `messages` e în publicația `supabase_realtime`.

## 2. Variabile de mediu

În `.env` (vezi `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Repornește Metro: `npx expo start --clear`.

## 3. Autentificare

Chat-ul folosește sesiunea Supabase existentă (login Kinde + `kinde-bridge`). Nu e nevoie de ecran separat de sign-in — tab-ul **Chat** redirecționează la login dacă nu ești autentificat.

## 4. Pornire app

```bash
npm run android
# sau
npx expo start
```

Tab **Chat** → camera **Global Chat** (`slug: global-chat`).

## 5. Test cu 2 utilizatori

1. **Device A**: login cu contul 1 → tab Chat → trimite „Salut de la A”.
2. **Device B** (sau emulator + telefon): login cu contul 2 → tab Chat → mesajul apare live.
3. Verifică bara **Online** — ambele conturi ar trebui să apară când sunt în tab.
4. În Supabase **Table Editor → messages** — rândurile noi cu `room_id` al camerei globale.

## Fișiere principale

| Cale | Rol |
|------|-----|
| `app/(tabs)/chat.tsx` | Ecran tab chat |
| `src/features/chat/*` | API, realtime, Zustand, hooks |
| `src/features/auth/*` | Sesiune + profil |
| `src/components/chat/*` | UI bubbles, input, header |
| `supabase/migrations/020_global_chat.sql` | Schema + RLS + seed |

## Extinderi viitoare

- DM-uri (`room_members` + camere private)
- Grupuri (`rooms.created_by`, roluri)
- Fișiere (Storage + `messages.attachment_url`)
- Reacții / read receipts
