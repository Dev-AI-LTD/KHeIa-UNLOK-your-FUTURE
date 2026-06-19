# Account deletion — screen recording for App Review (Guideline 5.1.1)

Apple requested a **physical device** recording showing the full account deletion flow. Attach it in **App Store Connect → App Review Information → Notes** (or Resolution Center reply).

## Before recording

1. Deploy edge functions (includes Kinde user deletion):
   ```bash
   npx supabase functions deploy delete-account
   npx supabase functions deploy kinde-bridge
   ```
2. Configure Kinde M2M on Supabase (required so email is removed from Kinde):
   - Kinde dashboard → **Settings → Applications → Add API** (Machine to machine)
   - Scopes: `read:users`, `delete:users`
   - ```bash
     supabase secrets set KINDE_M2M_CLIENT_ID=your_m2m_client_id KINDE_M2M_CLIENT_SECRET=your_m2m_secret
     ```
3. Use a **disposable test account** (not `contact@devaieood.com` — keep the review account intact).
4. Record on **iPhone** (portrait), iOS screen recording enabled.

## Script (60–90 seconds)

| Step | Action | What reviewer should see |
|------|--------|-------------------------|
| 1 | Open app → **Autentificare** → sign in with test account | Login succeeds |
| 2 | Bottom tab **Profil** | Profile loads |
| 3 | Option A: stay on **Evoluție** → scroll to **Cont / Account** → tap **Șterge cont / Delete account** | Delete row visible on first tab |
| 3b | Option B: swipe tabs → **Setări / Settings** → **Șterge cont / Delete account** | Same flow |
| 4 | Confirm first alert → tap **Continuă** | Second confirmation |
| 5 | Tap **Șterge cont** | Processing |
| 6 | App returns to **login** screen | Account signed out |
| 7 | (Optional) Try signing in again with same credentials | New session or registration flow — data from deleted account gone |

## What to say in Resolution Center

```
Account deletion is available in-app without contacting support:
Profile → Evoluție (Cont / Account) OR Profile → Setări / Settings → "Șterge cont / Delete account".
Double confirmation → permanent deletion of profile, progress, and statistics via our delete-account API.
Screen recording attached.
```

## Paths in app (build 16+)

- `app/(tabs)/profile.tsx` — Evoluție tab, Setări tab, Legal → Cont / Account
- `src/services/auth.service.ts` → `deleteAccount()`
- `supabase/functions/delete-account/index.ts`

## Note on subscriptions

Deletion removes app data; **Apple subscriptions** must be cancelled separately in **Apple ID → Abonamente**. The delete confirmation dialog mentions this.
