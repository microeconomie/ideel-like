-- Ideel-like "Mes budgets": monthly incomes, investments and expenses, grouped in categories.
-- Same hardening as the other ideel tables:
--  * policies restricted to the authenticated role, auth.uid() = user_id for reads and writes
--  * an entry can only belong to a category owned by the same user (composite FK)
--  * functions are SECURITY INVOKER with a fixed search_path, so RLS still applies
-- Incomes live in a single implicit "income" category per user, and the expenses get one special
-- "Abonnements" category mirroring ideel.subscriptions (it holds no entries of its own); both are
-- created on first use by ideel.ensure_budget_defaults().


-- budget_categories ------------------------------------------------------

create table ideel.budget_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('income', 'investment', 'expense')),
  name text not null check (char_length(name) > 0 and char_length(name) <= 60),
  position integer not null default 0,
  is_auto_subscriptions boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_categories_id_user_id_key unique (id, user_id),
  constraint budget_categories_auto_is_expense check (not is_auto_subscriptions or kind = 'expense')
);

create index budget_categories_user_id_idx on ideel.budget_categories (user_id);
-- at most one implicit income category and one "Abonnements" category per user
create unique index budget_categories_one_income_idx
  on ideel.budget_categories (user_id) where kind = 'income';
create unique index budget_categories_one_auto_subscriptions_idx
  on ideel.budget_categories (user_id) where is_auto_subscriptions;

alter table ideel.budget_categories enable row level security;

create policy "budget_categories_select_own" on ideel.budget_categories
  for select to authenticated using (auth.uid() = user_id);
create policy "budget_categories_insert_own" on ideel.budget_categories
  for insert to authenticated with check (auth.uid() = user_id);
create policy "budget_categories_update_own" on ideel.budget_categories
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budget_categories_delete_own" on ideel.budget_categories
  for delete to authenticated using (auth.uid() = user_id);

-- budget_entries ---------------------------------------------------------

create table ideel.budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  -- may be empty while a freshly added line is being typed
  label text not null default '' check (char_length(label) <= 80),
  monthly_amount numeric(10,2) not null default 0 check (monthly_amount >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-owner category only; deleting a category deletes its entries
  constraint budget_entries_category_fkey
    foreign key (category_id, user_id)
    references ideel.budget_categories (id, user_id)
    on delete cascade
);

create index budget_entries_user_id_idx on ideel.budget_entries (user_id);
create index budget_entries_category_idx on ideel.budget_entries (category_id, user_id);

alter table ideel.budget_entries enable row level security;

create policy "budget_entries_select_own" on ideel.budget_entries
  for select to authenticated using (auth.uid() = user_id);
create policy "budget_entries_insert_own" on ideel.budget_entries
  for insert to authenticated with check (auth.uid() = user_id);
create policy "budget_entries_update_own" on ideel.budget_entries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budget_entries_delete_own" on ideel.budget_entries
  for delete to authenticated using (auth.uid() = user_id);

-- integrity triggers -----------------------------------------------------

create trigger budget_categories_set_updated_at
  before update on ideel.budget_categories
  for each row execute function ideel.set_updated_at();

create trigger budget_entries_set_updated_at
  before update on ideel.budget_entries
  for each row execute function ideel.set_updated_at();

-- A category's kind and special role are fixed, and the "Abonnements" category keeps its name.
create or replace function ideel.budget_categories_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind <> old.kind or new.is_auto_subscriptions <> old.is_auto_subscriptions then
    raise exception 'A budget category cannot change kind' using errcode = 'check_violation';
  end if;
  if old.is_auto_subscriptions and new.name <> old.name then
    raise exception 'The subscriptions category cannot be renamed' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger budget_categories_guard
  before update on ideel.budget_categories
  for each row execute function ideel.budget_categories_guard();

-- Entries can't go into the "Abonnements" category (it mirrors ideel.subscriptions),
-- and can only move between categories of the same kind.
create or replace function ideel.budget_entries_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  new_kind text;
  new_is_auto boolean;
  old_kind text;
begin
  if tg_op = 'UPDATE' and new.category_id = old.category_id then
    return new;
  end if;

  select kind, is_auto_subscriptions into new_kind, new_is_auto
  from ideel.budget_categories where id = new.category_id;

  if new_is_auto then
    raise exception 'The subscriptions category has no manual entries' using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE' then
    select kind into old_kind from ideel.budget_categories where id = old.category_id;
    if new_kind is distinct from old_kind then
      raise exception 'An entry can only move to a category of the same kind' using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger budget_entries_guard
  before insert or update of category_id on ideel.budget_entries
  for each row execute function ideel.budget_entries_guard();

-- RPCs -------------------------------------------------------------------

-- Creates the implicit income category and the "Abonnements" expense category if missing.
-- Idempotent and safe to call concurrently (two tabs opening the page at once).
create or replace function ideel.ensure_budget_defaults()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into ideel.budget_categories (user_id, kind, name, position)
  values (auth.uid(), 'income', 'Revenus', 0)
  on conflict (user_id) where kind = 'income' do nothing;

  insert into ideel.budget_categories (user_id, kind, name, position, is_auto_subscriptions)
  select auth.uid(), 'expense', 'Abonnements',
         coalesce(max(position) + 1, 0), true
  from ideel.budget_categories
  where user_id = auth.uid() and kind = 'expense'
  on conflict (user_id) where is_auto_subscriptions do nothing;
end;
$$;

-- Same model as reorder_subscriptions: only touches position.
create or replace function ideel.reorder_budget_categories(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update ideel.budget_categories as c
  set position = t.pos
  from (
    select id, ord - 1 as pos
    from unnest(ordered_ids) with ordinality as u(id, ord)
  ) as t
  where c.id = t.id
    and c.user_id = auth.uid();
end;
$$;

-- Sets the full order of target_category_id's entries. An entry of ordered_ids coming from
-- another category is moved there in the same statement (category_id + position, one transaction);
-- the guard trigger rejects a move across kinds and rolls the whole call back.
create or replace function ideel.reorder_budget_entries(target_category_id uuid, ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update ideel.budget_entries as e
  set category_id = target_category_id,
      position = t.pos
  from (
    select id, ord - 1 as pos
    from unnest(ordered_ids) with ordinality as u(id, ord)
  ) as t
  where e.id = t.id
    and e.user_id = auth.uid();
end;
$$;

-- grants -----------------------------------------------------------------

grant select, insert, update, delete on ideel.budget_categories, ideel.budget_entries to authenticated;
grant all on ideel.budget_categories, ideel.budget_entries to service_role;

revoke execute on function
  ideel.budget_categories_guard(),
  ideel.budget_entries_guard(),
  ideel.ensure_budget_defaults(),
  ideel.reorder_budget_categories(uuid[]),
  ideel.reorder_budget_entries(uuid, uuid[])
from public, anon, authenticated;

grant execute on function
  ideel.ensure_budget_defaults(),
  ideel.reorder_budget_categories(uuid[]),
  ideel.reorder_budget_entries(uuid, uuid[])
to authenticated, service_role;
