-- Ideel-like: rename payment_cards -> payment_methods, add logo background color

alter table public.payment_cards rename to payment_methods;
alter table public.subscriptions rename column payment_card_id to payment_method_id;

alter table public.subscriptions
  add column logo_bg_color text check (logo_bg_color is null or logo_bg_color ~ '^#[0-9A-Fa-f]{6}$');
