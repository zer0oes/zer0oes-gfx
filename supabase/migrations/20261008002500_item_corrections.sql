update public.packs
set deliverables = array_replace(deliverables, '2 séries de corrections regroupées',
  case when id = 'univers-complet' then '3 corrections incluses par élément du pack'
       else '2 corrections incluses par élément du pack' end)
where id in ('premier-look', 'identite-signature', 'univers-complet');
