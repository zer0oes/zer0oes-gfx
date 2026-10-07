-- Avis privé lié à la commande ; publication manuelle dans le portfolio.
-- La table orders conserve sa protection RLS et son accès serveur uniquement.
alter table public.orders add column client_testimonial jsonb;
