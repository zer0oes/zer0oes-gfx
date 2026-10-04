-- Textes des pages projet modifiés dans l'admin (null : textes d'origine du code).
-- Format : { "blocks": [types des blocs], "texts": { "chemin": "texte" } }
alter table public.streamers add column if not exists case_study jsonb;
