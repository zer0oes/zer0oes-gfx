-- Espace commande du client : date de clôture du projet (statut « Terminée »),
-- point de départ des 90 jours de conservation des fichiers définitifs.
alter table public.orders add column if not exists completed_at timestamptz;
