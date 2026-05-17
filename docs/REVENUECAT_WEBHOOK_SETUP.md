# RevenueCat webhook → Supabase

După ce ai deploy-at funcția, configurează în **RevenueCat → Project → Integrations → Webhooks**:

| Câmp | Valoare |
|------|---------|
| **URL** | `https://lbvltfvdrsdrmpuglboh.supabase.co/functions/v1/webhook-revenuecat` |
| **Authorization** | același secret ca `REVENUECAT_WEBHOOK_AUTH` din Supabase |
| **Events** | Initial purchase, Renewal, Cancellation, Expiration (sau toate) |

## Secrets Supabase

```bash
npx supabase secrets set REVENUECAT_WEBHOOK_AUTH="alege-un-secret-lung"
npx supabase secrets set REVENUECAT_ENTITLEMENT_ID="KheIA Pro"
npx supabase functions deploy webhook-revenuecat
```

În app, `Purchases.logIn` trebuie să folosească **UUID-ul Supabase** (`auth.users.id`) — același ID ca `event.app_user_id` în webhook.
