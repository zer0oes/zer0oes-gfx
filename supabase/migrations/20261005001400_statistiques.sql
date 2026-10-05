-- Statistiques de visite (page Admin > Statistiques), sans cookie ni adresse IP :
-- pages vues, clics et formulaires envoyés. « visitor » est une empreinte anonyme qui
-- change chaque jour (impossible de suivre quelqu'un d'un jour à l'autre).
-- Conservation : 13 mois, purge automatique par l'application.
create table public.stats_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('vue', 'clic', 'formulaire')),
  path text not null check (length(path) between 1 and 300),
  label text check (length(label) <= 120),
  source text check (length(source) <= 60),
  device text check (device in ('mobile', 'tablette', 'ordinateur')),
  visitor text check (length(visitor) <= 32)
);
create index stats_events_created_idx on public.stats_events (created_at);

-- Aucun accès public : seul le serveur (clé secrète) lit et écrit.
alter table public.stats_events enable row level security;
