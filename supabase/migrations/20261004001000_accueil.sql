-- Textes et visuels de la page d'accueil modifiés dans l'admin (null : contenu d'origine du code).
-- Format : { "hero.title1": "…", "universe.work": "<id de réalisation>", … }
alter table public.settings add column if not exists home jsonb;
