-- Généré par scripts/generate-seed.ts depuis src/data — ne pas modifier à la main.

insert into public.settings (id, deposit_percent, logo_discount, delivery_days) values
  (1, 30, 15000, '7 à 14')
on conflict (id) do update set deposit_percent = excluded.deposit_percent, logo_discount = excluded.logo_discount, delivery_days = excluded.delivery_days;
insert into public.finance_settings (id, urssaf_rate, cfp_rate, vl_enabled, vl_rate, stripe_percent, stripe_fixed) values
  (1, 25.6, 0.2, false, 2.2, 1.5, 25)
on conflict (id) do update set urssaf_rate = excluded.urssaf_rate, cfp_rate = excluded.cfp_rate, vl_enabled = excluded.vl_enabled, vl_rate = excluded.vl_rate, stripe_percent = excluded.stripe_percent, stripe_fixed = excluded.stripe_fixed;
insert into public.packs (id, position, name, tagline, price, price_from, checkout, deliverables, extras, note, highlight) values
  ('premier-look', 0, 'Premier look', 'L''essentiel pour lancer ta chaîne avec une identité cohérente.', 49000, false, true, array['Logo', '2 overlays fixes au choix', 'Bannière et avatar', '2 séries de corrections regroupées']::text[], array['Option : 5 emotes personnalisées pour 150 € HT']::text[], null, false),
  ('identite-signature', 1, 'Identité signature', 'Une identité complète pour affirmer ton style sur tes streams.', 99000, false, true, array['Logo et ses déclinaisons', '5 overlays fixes au choix', 'Bannière et avatar', '2 séries de corrections regroupées']::text[], array['10 emotes personnalisées : 280 € HT', 'Animation légère des 5 overlays : 450 € HT']::text[], null, true),
  ('univers-complet', 2, 'Univers complet', 'Un univers visuel complet et animé pour ta chaîne.', 199000, true, false, array['Logo et ses déclinaisons', '5 overlays animés', 'Bannière et avatar', '15 emotes personnalisées', '2 séries de corrections regroupées']::text[], array[]::text[], 'Le tarif de base comprend des animations légères : apparition des éléments, transitions simples et boucles d''ambiance. Les animations complexes sont chiffrées sur devis.', false)
on conflict (id) do update set position = excluded.position, name = excluded.name, tagline = excluded.tagline, price = excluded.price, price_from = excluded.price_from, checkout = excluded.checkout, deliverables = excluded.deliverables, extras = excluded.extras, note = excluded.note, highlight = excluded.highlight;
insert into public.formulas (pack_id, id, position, label, price, stripe_price_id) values
  ('premier-look', 'base', 0, 'Premier look', 49000, null),
  ('premier-look', 'emotes', 1, 'Pack avec emotes', 64000, null),
  ('identite-signature', 'base', 0, 'Identité signature', 99000, null),
  ('identite-signature', 'emotes', 1, 'Pack avec emotes', 127000, null),
  ('identite-signature', 'emotes-animations', 2, 'Pack avec emotes et animations', 172000, null)
on conflict (pack_id, id) do update set position = excluded.position, label = excluded.label, price = excluded.price, stripe_price_id = excluded.stripe_price_id;
insert into public.options (id, position, name, price, price_from, unit) values
  ('overlay-fixe', 0, 'Overlay fixe supplémentaire', 9000, false, null),
  ('animation-overlay', 1, 'Animation légère d''un overlay existant', 10000, true, null),
  ('emote-statique', 2, 'Emote statique supplémentaire', 3500, false, null),
  ('emotes-5', 3, 'Pack de 5 emotes statiques', 15000, false, null),
  ('emotes-10', 4, 'Pack de 10 emotes statiques', 28000, false, null),
  ('emotes-15', 5, 'Pack de 15 emotes statiques', 39000, false, null),
  ('emote-animee', 6, 'Emote animée', 7000, true, 'unité'),
  ('banniere', 7, 'Bannière pour une plateforme supplémentaire', 6000, false, null),
  ('panneaux-twitch', 8, 'Pack de 6 panneaux Twitch', 9000, false, null),
  ('animation-logo', 9, 'Animation du logo', 18000, true, null)
on conflict (id) do update set position = excluded.position, name = excluded.name, price = excluded.price, price_from = excluded.price_from, unit = excluded.unit;
insert into public.streamers (id, position, name, description, url) values
  ('tomavega', 0, 'TomaVega', 'Identité électrique sur fond minéral : écran de lancement, tchat et alertes.', null),
  ('zer0oes', 1, 'zer0oes', 'Ma propre chaîne : univers néon violet, du cadre de stream aux emotes.', 'https://www.twitch.tv/zer0oes')
on conflict (id) do update set position = excluded.position, name = excluded.name, description = excluded.description, url = excluded.url;
insert into public.works (id, streamer_id, category, position, title, description, image, video, colors, featured) values
  ('zer0oes-logo', 'zer0oes', 'logo', 0, 'Logo zer0oes', 'Logo manuscrit tracé d''un seul trait, décliné en blanc et en violet pour le stream et les réseaux.', '/portfolio/zer0oes-logo.webp', null, array['#5b21b6', '#2e1065']::text[], false),
  ('zer0oes-starting-screen', 'zer0oes', 'overlays', 1, 'Écran « Stream Starting »', 'Écran d''attente avant le live : portrait animé, cadre et logo néon, chat, alertes, musique et objectif.', '/portfolio/zer0oes-starting-obs.webp', '/portfolio/zer0oes-starting-obs.mp4', array['#7c3aed', '#06b6d4']::text[], true),
  ('zer0oes-paused', 'zer0oes', 'overlays', 2, 'Écran « Stream Paused »', 'Écran de pause dans le même univers : le cadre animé, le chat et l''objectif restent visibles.', '/portfolio/zer0oes-paused-anime.webp', '/portfolio/zer0oes-paused-anime.mp4', array['#7c3aed', '#ec4899']::text[], false),
  ('zer0oes-ending', 'zer0oes', 'overlays', 3, 'Écran « Stream Ending »', 'Écran de fin de live, dans la continuité des écrans de lancement et de pause.', '/portfolio/zer0oes-ending-anime.webp', '/portfolio/zer0oes-ending-anime.mp4', array['#ec4899', '#7c3aed']::text[], false),
  ('zer0oes-offline', 'zer0oes', 'overlays', 4, 'Écran « Stream Offline »', 'Écran hors ligne avec le planning de la semaine et les réseaux sociaux.', '/portfolio/zer0oes-offline-26.webp', null, array['#a855f7', '#ec4899']::text[], false),
  ('zer0oes-gaming', 'zer0oes', 'overlays', 5, 'Scène « Gaming »', 'Scène de jeu : bandeau d''infos animé en haut (date, derniers événements, réseaux) et objectif discret, pour laisser toute la place au jeu.', '/portfolio/zer0oes-gaming-anime.webp', '/portfolio/zer0oes-gaming-anime.mp4', array['#0ea5e9', '#7c3aed']::text[], false),
  ('zer0oes-chat', 'zer0oes', 'widgets', 6, 'Chat néon', 'Chat personnalisé aux couleurs de la chaîne, avec badges et réactions.', '/portfolio/zer0oes-chat-169.webp', '/portfolio/zer0oes-chat-169.mp4', array['#0ea5e9', '#a855f7']::text[], false),
  ('zer0oes-objectif', 'zer0oes', 'widgets', 7, 'Barre d''objectif', 'Barre d''objectif multi-événements qui se remplit en direct.', '/portfolio/zer0oes-objectif-169.webp', '/portfolio/zer0oes-objectif-169.mp4', array['#0ea5e9', '#7c3aed']::text[], false),
  ('zer0oes-musique', 'zer0oes', 'widgets', 8, 'Lecteur musique', 'Morceau en cours sur Spotify, avec pochette, artiste et progression.', '/portfolio/zer0oes-musique-169.webp', '/portfolio/zer0oes-musique-169.mp4', array['#571bc3', '#ff4d8d']::text[], false),
  ('zer0oes-alertes', 'zer0oes', 'alertes', 9, 'Alertes néon', 'Follow, sub, raid, cheer, don et sub offert : une carte néon par type d''événement.', '/portfolio/zer0oes-alertes-169.webp', '/portfolio/zer0oes-alertes-169.mp4', array['#ec4899', '#7c3aed']::text[], true),
  ('tomavega-logo', 'tomavega', 'logo', 10, 'Logo TomaVega', 'Logo électrique aux éclats néon bleu, violet et vert, avec un V en forme d''éclair.', '/portfolio/tomavega-logo.webp', null, array['#22c55e', '#7c3aed']::text[], false),
  ('tomavega-starting-screen', 'tomavega', 'overlays', 11, 'Starting screen', 'Logo néon qui se dessine, titre de scène, tchat et alertes en direct, réseaux sociaux.', '/portfolio/tomavega-starting-obs.webp', '/portfolio/tomavega-starting-obs.mp4', array['#22c55e', '#6366f1']::text[], true),
  ('tomavega-tchat', 'tomavega', 'widgets', 12, 'Tchat communautaire', 'Tchat au design de la chaîne, branché sur les vrais messages, avec badges VIP, abonnés et rôles.', '/portfolio/tomavega-tchat-169.webp', '/portfolio/tomavega-tchat-169.mp4', array['#14b8a6', '#6366f1']::text[], false),
  ('tomavega-musique', 'tomavega', 'widgets', 13, 'Panneau « Le son »', 'Morceau en cours via Last.fm ou Spotify (morceau fictif pour l''aperçu).', '/portfolio/tomavega-musique.webp', null, array['#7c3aed', '#22d3ee']::text[], false),
  ('tomavega-alertes', 'tomavega', 'alertes', 14, 'Alertes électriques', 'Follow, sub, raid, bits, don et sub offert, pour StreamElements et Streamlabs.', '/portfolio/tomavega-alertes-169.webp', '/portfolio/tomavega-alertes-169.mp4', array['#6366f1', '#0ea5e9']::text[], false),
  ('tomavega-banniere-youtube', 'tomavega', 'reseaux', 15, 'Bannière YouTube', 'Bannière sur fond minéral avec éclats verts et violets, logo néon, thèmes de la chaîne et réseaux sociaux.', '/portfolio/tomavega-banniere-youtube.webp', null, array['#22c55e', '#111827']::text[], false),
  ('zer0oes-emotes', 'zer0oes', 'emotes', 16, 'Emotes zer0oes', '19 emotes de follower et d''abonné, et 6 emotes animées, dans le style de la chaîne.', '/portfolio/zer0oes-emotes.webp', '/portfolio/zer0oes-emotes-animees.mp4', array['#ef4444', '#7c3aed']::text[], false),
  ('zer0oes-bannieres', 'zer0oes', 'reseaux', 17, 'Bannières Twitch et YouTube', 'Bannières assorties pour Twitch et YouTube : logo, réseaux sociaux et portrait dans l''univers néon de la chaîne.', '/portfolio/zer0oes-bannieres.webp', null, array['#ec4899', '#7c3aed']::text[], false),
  ('zer0oes-avatar', 'zer0oes', 'reseaux', 18, 'Avatar', 'Photo de profil aux lumières néon de la chaîne, la même sur Twitch, YouTube et les réseaux, pour être reconnue partout.', '/portfolio/zer0oes-avatar-v2.webp', null, array['#be185d', '#4c1d95']::text[], false),
  ('zer0oes-panneaux', 'zer0oes', 'reseaux', 19, 'Panneaux Twitch', 'Titres de panneaux pour la page Bio de Twitch : à propos, soutien, planning, abonnement, sponsors et config.', '/portfolio/zer0oes-panneaux.webp', null, array['#7c3aed', '#0e0e10']::text[], false)
on conflict (id) do update set streamer_id = excluded.streamer_id, category = excluded.category, position = excluded.position, title = excluded.title, description = excluded.description, image = excluded.image, video = excluded.video, colors = excluded.colors, featured = excluded.featured;
insert into public.emotes (work_id, position, name, grp, src, animated) values
  ('zer0oes-emotes', 0, 'GG', 'follower', '/portfolio/emotes/gg.webp', false),
  ('zer0oes-emotes', 1, 'HYPE', 'follower', '/portfolio/emotes/hype.webp', false),
  ('zer0oes-emotes', 2, 'RAID', 'follower', '/portfolio/emotes/raid.webp', false),
  ('zer0oes-emotes', 3, 'LURK', 'follower', '/portfolio/emotes/lurk.webp', false),
  ('zer0oes-emotes', 4, 'CRY', 'abonne', '/portfolio/emotes/cry.webp', false),
  ('zer0oes-emotes', 5, 'LUL', 'abonne', '/portfolio/emotes/lul.webp', false),
  ('zer0oes-emotes', 6, 'WINK', 'abonne', '/portfolio/emotes/wink.webp', false),
  ('zer0oes-emotes', 7, 'THINK', 'abonne', '/portfolio/emotes/think.webp', false),
  ('zer0oes-emotes', 8, 'MMH', 'abonne', '/portfolio/emotes/mmh.webp', false),
  ('zer0oes-emotes', 9, 'FEAR', 'abonne', '/portfolio/emotes/fear.webp', false),
  ('zer0oes-emotes', 10, 'RAGE', 'abonne', '/portfolio/emotes/rage.webp', false),
  ('zer0oes-emotes', 11, 'EVIL', 'abonne', '/portfolio/emotes/evil.webp', false),
  ('zer0oes-emotes', 12, 'LOVE', 'abonne', '/portfolio/emotes/love.webp', false),
  ('zer0oes-emotes', 13, 'BAVE', 'abonne', '/portfolio/emotes/bave.webp', false),
  ('zer0oes-emotes', 14, 'HOT', 'abonne', '/portfolio/emotes/hot.webp', false),
  ('zer0oes-emotes', 15, 'PLEASE', 'abonne', '/portfolio/emotes/please.webp', false),
  ('zer0oes-emotes', 16, 'FACEPALM', 'abonne', '/portfolio/emotes/facepalm.webp', false),
  ('zer0oes-emotes', 17, 'BLUSH', 'abonne', '/portfolio/emotes/blush.webp', false),
  ('zer0oes-emotes', 18, 'COOL', 'abonne', '/portfolio/emotes/cool.webp', false),
  ('zer0oes-emotes', 19, 'ACHOC', 'animee', '/portfolio/emotes/achoc.webp', true),
  ('zer0oes-emotes', 20, 'ACOOL', 'animee', '/portfolio/emotes/acool.webp', true),
  ('zer0oes-emotes', 21, 'ACRY', 'animee', '/portfolio/emotes/acry.webp', true),
  ('zer0oes-emotes', 22, 'AFACEPALM', 'animee', '/portfolio/emotes/afacepalm.webp', true),
  ('zer0oes-emotes', 23, 'AMMH', 'animee', '/portfolio/emotes/ammh.webp', true),
  ('zer0oes-emotes', 24, 'OOPS', 'animee', '/portfolio/emotes/oops.webp', true)
on conflict (work_id, name) do update set position = excluded.position, grp = excluded.grp, src = excluded.src, animated = excluded.animated;
