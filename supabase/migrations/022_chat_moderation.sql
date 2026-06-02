-- Chat moderation: user blocks + message reports (App Store UGC compliance)

create table if not exists public.chat_user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_user_id),
  constraint chat_user_blocks_not_self check (blocker_id <> blocked_user_id)
);

create index if not exists chat_user_blocks_blocker_idx
  on public.chat_user_blocks (blocker_id);

create table if not exists public.chat_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chat_message_reports_reason_check check (
    reason in ('spam', 'harassment', 'inappropriate', 'other')
  ),
  constraint chat_message_reports_unique_per_user unique (message_id, reporter_id)
);

create index if not exists chat_message_reports_message_idx
  on public.chat_message_reports (message_id);

create index if not exists chat_message_reports_created_at_idx
  on public.chat_message_reports (created_at desc);

alter table public.chat_user_blocks enable row level security;
alter table public.chat_message_reports enable row level security;

-- Blocks: only the blocker manages their block list
drop policy if exists "chat_blocks_select_own" on public.chat_user_blocks;
create policy "chat_blocks_select_own"
on public.chat_user_blocks for select to authenticated
using (blocker_id = auth.uid());

drop policy if exists "chat_blocks_insert_own" on public.chat_user_blocks;
create policy "chat_blocks_insert_own"
on public.chat_user_blocks for insert to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "chat_blocks_delete_own" on public.chat_user_blocks;
create policy "chat_blocks_delete_own"
on public.chat_user_blocks for delete to authenticated
using (blocker_id = auth.uid());

-- Reports: users can submit; read only their own submissions (optional audit)
drop policy if exists "chat_reports_select_own" on public.chat_message_reports;
create policy "chat_reports_select_own"
on public.chat_message_reports for select to authenticated
using (reporter_id = auth.uid());

drop policy if exists "chat_reports_insert_own" on public.chat_message_reports;
create policy "chat_reports_insert_own"
on public.chat_message_reports for insert to authenticated
with check (reporter_id = auth.uid());
