-- Fix profiles_update_own: valid PostgreSQL RLS (017 used invalid OLD/NEW-style identifiers).
-- Users may update own profile but not subscription_type, referral_premium_until, or referral_code.
-- Service role / webhooks bypass RLS and can still update those columns.

create or replace function public.profiles_restricted_columns_unchanged(
  _profile_id uuid,
  _subscription_type text,
  _referral_premium_until timestamptz,
  _referral_code text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _profile_id
      and p.subscription_type is not distinct from _subscription_type
      and p.referral_premium_until is not distinct from _referral_premium_until
      and p.referral_code is not distinct from _referral_code
  );
$$;

comment on function public.profiles_restricted_columns_unchanged(uuid, text, timestamptz, text) is
  'RLS helper: proposed subscription/referral fields must match the stored row (no self-upgrade via client).';

revoke all on function public.profiles_restricted_columns_unchanged(uuid, text, timestamptz, text) from public;
grant execute on function public.profiles_restricted_columns_unchanged(uuid, text, timestamptz, text) to authenticated;

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and public.profiles_restricted_columns_unchanged(
      id,
      subscription_type,
      referral_premium_until,
      referral_code
    )
  );
