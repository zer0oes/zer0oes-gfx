-- Les deux diapos du carrousel (offre de lancement, audit) deviennent des bandeaux ordinaires,
-- éditables dans Admin → Offres et réglages → Promotions → Bandeaux. Rien n'est écrasé si
-- le bandeau existe déjà. Pour l'offre, le texte avant le premier deux-points devient la pastille.
-- L'audit suit l'offre de lancement sauf s'il avait ses propres dates.
insert into public.marketing_banners (id, content)
select s.uuid, jsonb_build_object(
  'id', s.uuid::text, 'enabled', s.enabled, 'carousel', true, 'position', s.position,
  'linkedTo', case when s.id = 'launch' or coalesce((s.content->'schedule'->>'followLaunch')::boolean, true) then 'launch' else '' end,
  'startsAt', coalesce(s.content->'schedule'->>'startsAt', ''), 'endsAt', coalesce(s.content->'schedule'->>'endsAt', ''),
  'pages', '["*"]'::jsonb, 'tone', 'violet', 'code', '', 'linkLabel', '', 'linkLabelEn', '',
  'link', coalesce(s.content->'fr'->>'buttonHref', '/'),
  'badge', fr.badge, 'text', fr.title, 'conditions', coalesce(s.content->'fr'->>'conditions', ''), 'remainingText', coalesce(s.content->'fr'->>'remainingText', ''),
  'badgeEn', en.badge, 'textEn', en.title, 'conditionsEn', coalesce(s.content->'en'->>'conditions', ''), 'remainingTextEn', coalesce(s.content->'en'->>'remainingText', ''))
from (
  select c.*, case c.id when 'launch' then 'b5d3a6e0-0000-4000-8000-000000000001'::uuid else 'b5d3a6e0-0000-4000-8000-000000000002'::uuid end as uuid
  from public.marketing_carousel_slides c
) s
cross join lateral (
  select coalesce(s.content->'fr'->>'badge', case when cut > 0 then btrim(left(t, cut - 1)) else '' end) as badge,
    case when cut > 0 then btrim(substr(t, cut + 1)) else t end as title
  from (select s.content->'fr'->>'title' as t, case when s.id = 'launch' then position(':' in s.content->'fr'->>'title') else 0 end as cut) x
) fr
cross join lateral (
  select coalesce(s.content->'en'->>'badge', case when cut > 0 then btrim(left(t, cut - 1)) else '' end) as badge,
    case when cut > 0 then btrim(substr(t, cut + 1)) else t end as title
  from (select s.content->'en'->>'title' as t, case when s.id = 'launch' then position(':' in s.content->'en'->>'title') else 0 end as cut) x
) en
on conflict (id) do nothing;
