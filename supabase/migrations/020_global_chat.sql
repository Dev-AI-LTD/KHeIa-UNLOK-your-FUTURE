-- Global cloud chat MVP (rooms, messages, presence-ready membership)
create extension if not exists pgcrypto;

-- Optional profile fields for chat display
alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

-- Allow chat to show other users' names
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

-- =========================================================
-- rooms
-- =========================================================
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_public boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint rooms_slug_length check (char_length(slug) between 3 and 50)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

create index if not exists rooms_is_public_idx on public.rooms (is_public);
create index if not exists rooms_slug_idx on public.rooms (slug);

-- =========================================================
-- room_members
-- =========================================================
create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (room_id, user_id),
  constraint room_members_role_check check (role in ('owner', 'admin', 'member'))
);

create index if not exists room_members_user_id_idx on public.room_members (user_id);
create index if not exists room_members_room_id_idx on public.room_members (room_id);

-- =========================================================
-- messages
-- =========================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint messages_body_not_empty check (char_length(trim(body)) > 0),
  constraint messages_body_max_length check (char_length(body) <= 4000)
);

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

create index if not exists messages_room_id_created_at_idx
  on public.messages (room_id, created_at desc);

create index if not exists messages_user_id_created_at_idx
  on public.messages (user_id, created_at desc);

-- Realtime (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- =========================================================
-- helpers
-- =========================================================
create or replace function public.is_room_public(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room_id and r.is_public = true
  );
$$;

create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members rm
    where rm.room_id = p_room_id and rm.user_id = p_user_id
  );
$$;

-- =========================================================
-- RLS
-- =========================================================
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "rooms_select_public_or_member" on public.rooms;
create policy "rooms_select_public_or_member"
on public.rooms for select to authenticated
using (is_public = true or public.is_room_member(id, auth.uid()));

drop policy if exists "rooms_insert_self_creator" on public.rooms;
create policy "rooms_insert_self_creator"
on public.rooms for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "room_members_select_public_or_member" on public.room_members;
create policy "room_members_select_public_or_member"
on public.room_members for select to authenticated
using (
  public.is_room_public(room_id) or public.is_room_member(room_id, auth.uid())
);

drop policy if exists "room_members_insert_self" on public.room_members;
create policy "room_members_insert_self"
on public.room_members for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "room_members_delete_self" on public.room_members;
create policy "room_members_delete_self"
on public.room_members for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "messages_select_public_or_member" on public.messages;
create policy "messages_select_public_or_member"
on public.messages for select to authenticated
using (
  public.is_room_public(room_id) or public.is_room_member(room_id, auth.uid())
);

drop policy if exists "messages_insert_own_in_allowed_room" on public.messages;
create policy "messages_insert_own_in_allowed_room"
on public.messages for insert to authenticated
with check (
  user_id = auth.uid()
  and (public.is_room_public(room_id) or public.is_room_member(room_id, auth.uid()))
);

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
on public.messages for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
on public.messages for delete to authenticated
using (user_id = auth.uid());

-- =========================================================
-- seed
-- =========================================================
insert into public.rooms (slug, name, description, is_public, created_by)
values ('global-chat', 'Global Chat', 'Main public room for all users', true, null)
on conflict (slug) do nothing;
