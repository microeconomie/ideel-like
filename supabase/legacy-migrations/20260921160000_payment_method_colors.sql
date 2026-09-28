-- Ideel-like: add a color per payment method, backfilled for existing rows

alter table public.payment_methods
  add column color text default '#6366F1';

with numbered as (
  select id, row_number() over (partition by user_id order by created_at) as rn
  from public.payment_methods
)
update public.payment_methods pm
set color = (array[
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#EF4444', '#8B5CF6', '#14B8A6', '#F97316', '#84CC16'
])[((n.rn - 1) % 10) + 1]
from numbered n
where n.id = pm.id;

alter table public.payment_methods
  alter column color set not null,
  add constraint payment_methods_color_format check (color ~ '^#[0-9A-Fa-f]{6}$');
