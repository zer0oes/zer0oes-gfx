-- Restaure uniquement les options absentes, sans écraser les options présentes.
begin;
alter table public.options add column if not exists category text
  check (category in ('overlays', 'emotes', 'branding', 'motion'));

insert into public.options (id, position, name, price, price_from, unit) values
  ('overlay-fixe-unite', 0, 'Overlay fixe (unité)', 5000, false, null),
  ('overlay-anime-unite', 1, 'Overlay animé (unité)', 9000, false, null),
  ('alertes-fixes', 2, 'Pack d’alertes fixes', 8000, false, null),
  ('alertes-animees', 3, 'Pack d’alertes animées', 14000, false, null),
  ('widget-personnalise', 4, 'Widget personnalisé (barre d’objectifs, tchat, sponsor, partenariats)', 10000, true, null),
  ('widget-avance', 5, 'Widget interactif avancé (sur devis)', 20000, true, null),
  ('animation-overlay', 6, 'Animation légère d''un overlay existant', 4000, true, null),
  ('emote-statique', 7, 'Emote statique (unité)', 1500, false, null),
  ('emotes-3', 8, 'Pack de 3 emotes statiques', 4000, false, null),
  ('emotes-5', 9, 'Pack de 5 emotes statiques', 6500, false, null),
  ('emotes-10', 10, 'Pack de 10 emotes statiques', 12000, false, null),
  ('emote-animee', 11, 'Emote animée (unité)', 3000, false, null),
  ('emotes-animees-3', 12, 'Pack de 3 emotes animées', 8000, false, null),
  ('emotes-animees-5', 13, 'Pack de 5 emotes animées', 12500, false, null),
  ('logo', 14, 'Logo', 15000, true, null),
  ('banniere', 15, 'Bannière pour YouTube / Twitch', 7000, false, null),
  ('avatar', 16, 'Avatar', 2500, false, null),
  ('panneaux-twitch', 17, 'Pack de 6 panneaux Twitch', 9000, false, null),
  ('animation-logo', 18, 'Animation du logo', 18000, true, null)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
commit;
select count(*) as options_restaurées from public.options;
