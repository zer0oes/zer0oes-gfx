-- Liens préparés dans l’admin uniquement : aucune publication automatique.
create table public.marketing_affiliate_links (
  id uuid primary key,
  content jsonb not null
);
alter table public.marketing_affiliate_links enable row level security;
