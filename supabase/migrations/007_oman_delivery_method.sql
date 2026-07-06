alter table public.orders
add column if not exists delivery_method text
check (delivery_method in ('pickup_office', 'home_delivery'));

create index if not exists idx_orders_delivery_method
on public.orders (delivery_method);
