-- Ideel-like: manual ordering of subscription cards

alter table public.subscriptions add column position integer default 0;

with numbered as (
  select id, row_number() over (partition by user_id order by created_at) - 1 as rn
  from public.subscriptions
)
update public.subscriptions s
set position = n.rn
from numbered n
where n.id = s.id;

alter table public.subscriptions alter column position set not null;
