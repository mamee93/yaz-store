create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  area text not null,
  delivery_fee_omr numeric(10,2) not null default 0 check (delivery_fee_omr >= 0),
  free_shipping_minimum_omr numeric(10,2) check (
    free_shipping_minimum_omr is null
    or free_shipping_minimum_omr >= 0
  ),
  estimated_delivery_time text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_zones_city_area_unique unique (city, area)
);

alter table public.orders
add column if not exists shipping_zone_id uuid references public.shipping_zones(id) on delete set null,
add column if not exists shipping_area text,
add column if not exists shipping_fee_omr numeric(10,2) not null default 0 check (shipping_fee_omr >= 0);

create index if not exists idx_shipping_zones_active_sort
on public.shipping_zones (is_active, sort_order, city, area);

create index if not exists idx_shipping_zones_city_area
on public.shipping_zones (city, area);

create index if not exists idx_orders_shipping_zone_id
on public.orders (shipping_zone_id);

drop trigger if exists update_shipping_zones_updated_at on public.shipping_zones;
create trigger update_shipping_zones_updated_at
before update on public.shipping_zones
for each row execute function public.update_updated_at_column();

alter table public.shipping_zones enable row level security;

drop policy if exists "Public can read active shipping zones" on public.shipping_zones;
create policy "Public can read active shipping zones"
on public.shipping_zones
for select
using (is_active = true);

drop policy if exists "Admins can manage shipping zones" on public.shipping_zones;
create policy "Admins can manage shipping zones"
on public.shipping_zones
for all
using (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
);
