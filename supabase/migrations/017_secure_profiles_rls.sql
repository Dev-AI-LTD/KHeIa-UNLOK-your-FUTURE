-- Intent: restricționa actualizarea câmpurilor subscription/referral pe `profiles` pentru rolul `authenticated`.
-- Versiunea inițială folosea `old`/`new` în RLS — invalid în PostgreSQL (vezi 019).
-- Politica corectă (funcție SECURITY DEFINER + WITH CHECK) este în:
--   019_fix_profiles_update_own_policy.sql
-- Păstrăm acest fișier ca no-op ca numerotarea migrațiilor să rămână stabilă.

select 1;
