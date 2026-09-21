-- Ideel-like: initial schema (payment_cards, subscriptions, RLS, storage bucket)

-- payment_cards -------------------------------------------------------------

create table if not exists public.payment_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(label) > 0 and char_length(label) <= 40),
  icon_path text,
  created_at timestamptz not null default now(),
  unique (user_id, label)
);

alter table public.payment_cards enable row level security;

create policy "payment_cards_select_own"
  on public.payment_cards for select
  using (user_id = auth.uid());

create policy "payment_cards_insert_own"
  on public.payment_cards for insert
  with check (user_id = auth.uid());

create policy "payment_cards_update_own"
  on public.payment_cards for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "payment_cards_delete_own"
  on public.payment_cards for delete
  using (user_id = auth.uid());

-- subscriptions ---------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) > 0 and char_length(name) <= 60),
  monthly_price numeric(10,2) not null check (monthly_price > 0),
  logo_path text,
  payment_card_id uuid references public.payment_cards (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (user_id = auth.uid());

create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (user_id = auth.uid());

create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "subscriptions_delete_own"
  on public.subscriptions for delete
  using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- storage: images bucket -------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 1048576, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "images_public_read"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "images_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "images_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "images_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
