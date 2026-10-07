-- Un ancien accès identifie le fichier lorsqu'il n'y a qu'un seul fichier final.
-- Les livrables multi-fichiers restent inchangés : une date seule ne permet pas
-- de savoir lesquels ont été récupérés.
with candidates as (
  select id, array(
    select distinct key from (
      select storage_path as key union all select url
      union all
      select coalesce(asset->>'path', asset->>'url')
      from jsonb_array_elements(final_assets) asset
    ) files where key is not null and key <> ''
  ) keys
  from public.deliverables
  where final_accessed_at is not null and cardinality(accessed_final_assets) = 0
)
update public.deliverables d set accessed_final_assets = c.keys
from candidates c where d.id = c.id and cardinality(c.keys) = 1;
