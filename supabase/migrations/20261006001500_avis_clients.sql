-- Avis clients : une citation facultative par projet du portfolio, publiée seulement avec
-- l'accord du client. Affichée sur la page du projet et, si cochée, sur l'accueil.
create table public.testimonials (
  streamer_id text primary key references public.streamers (id) on delete cascade,
  author text not null check (length(author) between 1 and 80),
  role text check (length(role) <= 80),
  quote text not null check (length(quote) between 1 and 600),
  quote_en text check (length(quote_en) <= 600),
  consent boolean not null default false,
  on_home boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Aucun accès public direct : le site lit et écrit avec la clé serveur.
alter table public.testimonials enable row level security;
