create table public.marketing_carousel_slides (
  id text primary key check (id in ('launch', 'audit')),
  enabled boolean not null default true,
  position integer not null check (position in (0, 1)),
  content jsonb not null check (jsonb_typeof(content->'fr') = 'object' and jsonb_typeof(content->'en') = 'object')
);
alter table public.marketing_carousel_slides enable row level security;
revoke all on public.marketing_carousel_slides from anon, authenticated;
grant all on public.marketing_carousel_slides to service_role;

-- Source unique des textes initiaux ; aucun texte de repli dans React.
insert into public.marketing_carousel_slides (id, enabled, position, content)
select value->>'id', (value->>'enabled')::boolean, (ordinality - 1)::integer, value->'content'
from jsonb_array_elements($slides$[
  { "id": "launch", "enabled": true, "content": {
    "fr": {
      "title": "Offre de lancement : −50 % sur les packs, −25 % à la carte, pour les 10 premières commandes",
      "conditions": "Remise automatique, non cumulable",
      "remainingText": "Plus que {count} places",
      "buttonLabel": "Profiter de l'offre",
      "buttonHref": "/offres"
    },
    "en": {
      "title": "Launch offer: −50 % on packages, −25 % à la carte, for the first 10 orders",
      "conditions": "Automatically applied, cannot be combined with other offers",
      "remainingText": "Only {count} places left",
      "buttonLabel": "Get the launch offer",
      "buttonHref": "/offres"
    }
  }},
  { "id": "audit", "enabled": true, "content": {
    "fr": {
      "title": "Un œil neuf sur ta chaîne ? Audit de ton identité visuelle, gratuit et sans engagement.",
      "conditions": "", "remainingText": "",
      "buttonLabel": "Mon audit gratuit",
      "buttonHref": "/contact?sujet=audit"
    },
    "en": {
      "title": "A fresh look at your channel? A free visual identity audit, with no obligation.",
      "conditions": "", "remainingText": "",
      "buttonLabel": "Get my free audit",
      "buttonHref": "/contact?sujet=audit"
    }
  }}
]$slides$::jsonb) with ordinality;

create function public.save_marketing_carousel(slides jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if jsonb_typeof(slides) <> 'array' or jsonb_array_length(slides) <> 2
    or (select count(distinct value->>'id') from jsonb_array_elements(slides) where value->>'id' in ('launch', 'audit')) <> 2 then
    raise exception 'Deux diapos distinctes sont nécessaires.';
  end if;
  perform pg_advisory_xact_lock(160002);
  insert into public.marketing_carousel_slides (id, enabled, position, content)
  select value->>'id', (value->>'enabled')::boolean, (ordinality - 1)::integer, value->'content'
  from jsonb_array_elements(slides) with ordinality
  on conflict (id) do update set enabled = excluded.enabled, position = excluded.position, content = excluded.content;
end;
$$;
revoke all on function public.save_marketing_carousel(jsonb) from public, anon, authenticated;
grant execute on function public.save_marketing_carousel(jsonb) to service_role;

-- Le compteur public compte les commandes réelles ; les réservations protègent
-- séparément la capacité, sans être présentées comme des commandes.
create or replace function public.launch_offer_state() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('enabled', enabled, 'startsAt', starts_at,
    'remaining', greatest(0, quota - (select count(*) from public.launch_offer_slots where state <> 'released')),
    'ordersRemaining', greatest(0, quota - (
      select count(*) from public.orders
      where demo = false and 'LANCEMENT-2026' = any(string_to_array(promo_code, ', '))
        and (amount_paid > 0 or stripe_session_id like 'devis_%')
    )))
  from public.launch_offer where id = true;
$$;
notify pgrst, 'reload schema';
