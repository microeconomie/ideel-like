-- Ideel-like: recreate the app in a dedicated "ideel" schema, in the shared "aimeri-unique" project.
-- Hardened compared to the original public schema:
--  * policies restricted to the authenticated role, auth.uid() = user_id for reads and writes
--  * a subscription can only reference a payment method owned by the same user (composite FK)
--  * functions have a fixed search_path


create schema if not exists ideel;

-- payment_methods --------------------------------------------------------

create table ideel.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(label) > 0 and char_length(label) <= 40),
  icon_path text,
  created_at timestamptz not null default now(),
  color text not null default '#6366F1',
  constraint payment_methods_user_id_label_key unique (user_id, label),
  constraint payment_methods_id_user_id_key unique (id, user_id),
  constraint payment_methods_color_format check (color ~ '^#[0-9A-Fa-f]{6}$')
);

alter table ideel.payment_methods enable row level security;

create policy "payment_methods_select_own" on ideel.payment_methods
  for select to authenticated using (auth.uid() = user_id);
create policy "payment_methods_insert_own" on ideel.payment_methods
  for insert to authenticated with check (auth.uid() = user_id);
create policy "payment_methods_update_own" on ideel.payment_methods
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "payment_methods_delete_own" on ideel.payment_methods
  for delete to authenticated using (auth.uid() = user_id);

-- subscriptions ----------------------------------------------------------

create table ideel.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) > 0 and char_length(name) <= 60),
  monthly_price numeric(10,2) not null check (monthly_price > 0),
  logo_path text,
  payment_method_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  logo_bg_color text check (logo_bg_color is null or logo_bg_color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0,
  -- same-owner payment method only; deleting it clears just payment_method_id
  constraint subscriptions_payment_method_fkey
    foreign key (payment_method_id, user_id)
    references ideel.payment_methods (id, user_id)
    on delete set null (payment_method_id)
);

create index subscriptions_user_id_idx on ideel.subscriptions (user_id);
create index subscriptions_payment_method_idx on ideel.subscriptions (payment_method_id, user_id);

alter table ideel.subscriptions enable row level security;

create policy "subscriptions_select_own" on ideel.subscriptions
  for select to authenticated using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on ideel.subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on ideel.subscriptions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_delete_own" on ideel.subscriptions
  for delete to authenticated using (auth.uid() = user_id);

-- functions & triggers ---------------------------------------------------

create or replace function ideel.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on ideel.subscriptions
  for each row execute function ideel.set_updated_at();

create or replace function ideel.reorder_subscriptions(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update ideel.subscriptions as s
  set position = t.pos
  from (
    select id, ord - 1 as pos
    from unnest(ordered_ids) with ordinality as u(id, ord)
  ) as t
  where s.id = t.id
    and s.user_id = auth.uid();
end;
$$;

-- grants -----------------------------------------------------------------

grant usage on schema ideel to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema ideel to authenticated;
grant all on all tables in schema ideel to service_role;

revoke execute on all functions in schema ideel from public, anon;
grant execute on function ideel.reorder_subscriptions(uuid[]) to authenticated, service_role;

alter default privileges in schema ideel grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema ideel grant all on tables to service_role;
alter default privileges in schema ideel revoke execute on functions from public, anon;

-- keepalive: project-wide ping target for the GitHub Actions workflow (no user data) --

create table if not exists public.keepalive (
  id smallint primary key default 1,
  pinged_at timestamptz not null default now(),
  constraint keepalive_single_row check (id = 1)
);

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

alter table public.keepalive enable row level security;

drop policy if exists "keepalive_public_read" on public.keepalive;
create policy "keepalive_public_read" on public.keepalive
  for select to anon using (true);

revoke all on public.keepalive from anon, authenticated;
grant select on public.keepalive to anon;

