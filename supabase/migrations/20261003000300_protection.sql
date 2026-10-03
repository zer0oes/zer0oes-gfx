-- Protection des médias du portfolio : flou hors focus et filigrane (réglables dans l'admin).
alter table public.settings
  add column protect_blur boolean not null default true,
  add column watermark text not null default 'discret'
    check (watermark in ('off', 'discret', 'visible', 'mosaique'));
