-- Retours du client sur sa page de livraison : remarques par fichier et validation.
-- client_notes : [{ "at": "<date ISO>", "body": "…" }] (ajoutées depuis /livraison/<jeton>)
alter table public.deliverables
  add column if not exists client_notes jsonb not null default '[]'::jsonb,
  add column if not exists approved_at timestamptz;
