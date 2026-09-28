-- Ideel-like: minimal table for the GitHub Actions keep-alive ping (no user data)

create table if not exists public.keepalive (
  id smallint primary key default 1,
  pinged_at timestamptz not null default now(),
  constraint keepalive_single_row check (id = 1)
);

insert into public.keepalive (id) values (1)
on conflict (id) do nothing;

alter table public.keepalive enable row level security;

create policy "keepalive_public_read"
  on public.keepalive for select
  to anon
  using (true);
