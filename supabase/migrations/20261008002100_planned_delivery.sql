alter table public.orders add column delivery_template jsonb;
alter table public.deliverables add column planned_key text, add column final_assets jsonb not null default '[]'::jsonb;
alter table public.deliverables drop constraint deliverables_contenu;
alter table public.deliverables add constraint deliverables_contenu check (
  planned_key is not null or (kind = 'fichier' and storage_path is not null) or (kind = 'lien' and url ~ '^https://')
);
create unique index deliverables_planned_unique on public.deliverables(order_id, planned_key) where planned_key is not null;
-- Le bucket contenant les originaux et aperçus reste privé.
update storage.buckets set public = false where id = 'livrables';
-- Les liens d’import et chemins finaux ne doivent pas être lisibles via l’API client.
drop policy if exists "client : ses livrables" on public.deliverables;
