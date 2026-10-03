-- Nouvelle catégorie de réalisation : « logo » (affichée en premier dans chaque projet).
alter table public.works drop constraint if exists works_category_check;
alter table public.works
  add constraint works_category_check
  check (category in ('logo', 'overlays', 'widgets', 'alertes', 'emotes'));
