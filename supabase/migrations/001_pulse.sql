-- Pulse cloud sync schema
-- Apply in the Supabase SQL editor (or via supabase db push).
-- Prerequisites:
--   1. Enable Project Settings → Data API (expose public schema)
--   2. Enable Authentication → Providers → Anonymous sign-ins

create table if not exists public.check_ins (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  timestamp timestamptz not null,
  notes text not null default '',
  entries jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists check_ins_user_timestamp_idx
  on public.check_ins (user_id, timestamp desc);

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  categories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.check_ins enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users manage own check_ins" on public.check_ins;
create policy "Users manage own check_ins"
  on public.check_ins
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own settings" on public.app_settings;
create policy "Users manage own settings"
  on public.app_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
