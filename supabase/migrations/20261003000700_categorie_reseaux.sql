-- Nouvelle catégorie de réalisation : « reseaux » (bannières, avatar, panneaux Twitch).
alter table public.works drop constraint if exists works_category_check;
alter table public.works
  add constraint works_category_check
  check (category in ('logo', 'overlays', 'widgets', 'alertes', 'emotes', 'reseaux'));
