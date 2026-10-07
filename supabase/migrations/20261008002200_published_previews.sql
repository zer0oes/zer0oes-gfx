alter table public.deliverables add column published_at timestamptz;
-- Les aperçus déjà envoyés restent visibles après la migration.
update public.deliverables d set published_at = o.delivered_at
from public.orders o where o.id = d.order_id and o.delivered_at is not null and d.preview_path is not null;
