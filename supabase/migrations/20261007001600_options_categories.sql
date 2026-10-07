alter table public.options add column if not exists category text
  check (category in ('overlays', 'emotes', 'branding', 'motion'));
