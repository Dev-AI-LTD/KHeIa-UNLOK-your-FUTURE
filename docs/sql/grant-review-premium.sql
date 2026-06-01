-- Acordă Premium complet contului de review (rulează după primul login în app).
-- Înlocuiește emailul cu cel din Kinde / App Store Connect.

do $$
declare
  uid uuid;
  until_ts timestamptz := '2099-12-31 23:59:59+00';
begin
  select id into uid from auth.users where lower(email) = lower('apple.review@kheia.ro');
  if uid is null then
    raise exception 'User not found. Log in once in the app with this email, then re-run.';
  end if;

  update public.subscriptions
  set status = 'expired', updated_at = now()
  where user_id = uid and status = 'active';

  insert into public.subscriptions (user_id, plan_type, status, current_period_end, updated_at)
  values (uid, 'full_edumat', 'active', until_ts, now());

  update public.profiles
  set
    subscription_type = 'full_edumat',
    referral_premium_until = until_ts,
    updated_at = now()
  where id = uid;

  raise notice 'Review premium granted for user %', uid;
end $$;
