-- Livraison des commandes : liens d'import (overlays StreamElements partagés) en plus
-- des fichiers, et lien privé de livraison envoyé au client.

alter table public.deliverables
  add column kind text not null default 'fichier' check (kind in ('fichier', 'lien')),
  add column url text,
  add column size_bytes bigint check (size_bytes >= 0),
  alter column storage_path drop not null;

alter table public.deliverables
  add constraint deliverables_contenu check (
    (kind = 'fichier' and storage_path is not null)
    or (kind = 'lien' and url ~ '^https://')
  );

-- Jeton du lien privé /livraison/<jeton> (accès sans compte), date d'envoi au client
alter table public.orders
  add column delivery_token text unique,
  add column delivered_at timestamptz;
