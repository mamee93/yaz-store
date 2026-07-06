alter table public.store_settings
add column if not exists store_name text,
add column if not exists store_description text,
add column if not exists store_email text,
add column if not exists store_phone text,
add column if not exists logo_url text,
add column if not exists favicon_url text,
add column if not exists currency_code text not null default 'OMR',
add column if not exists currency_symbol text not null default 'ر.ع',
add column if not exists tax_rate numeric(5, 2) not null default 0 check (tax_rate >= 0),
add column if not exists is_tax_enabled boolean not null default false,
add column if not exists maintenance_message text,
add column if not exists order_prefix text not null default 'ORD',
add column if not exists minimum_order_amount numeric(10, 2) not null default 0 check (minimum_order_amount >= 0);

alter table public.orders
add column if not exists tax_omr numeric(10, 2) not null default 0 check (tax_omr >= 0);

update public.store_settings
set
  store_name = coalesce(store_name, store_name_ar),
  store_description = coalesce(store_description, brand_story_ar),
  store_email = coalesce(store_email, support_email),
  store_phone = coalesce(store_phone, contact_phone),
  currency_code = coalesce(currency_code, default_currency, 'OMR'),
  maintenance_message = coalesce(maintenance_message, maintenance_message_ar),
  order_prefix = coalesce(nullif(order_prefix, ''), 'ORD')
where singleton_key = true;

create index if not exists store_settings_store_open_idx
on public.store_settings (is_store_open);

create index if not exists orders_tax_omr_idx
on public.orders (tax_omr);
