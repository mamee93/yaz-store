create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_order_amount numeric(10,2) not null default 0 check (minimum_order_amount >= 0),
  maximum_discount_amount numeric(10,2) check (maximum_discount_amount is null or maximum_discount_amount > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_uppercase check (code = upper(code)),
  constraint coupons_percentage_value check (
    discount_type <> 'percentage'
    or (discount_value >= 1 and discount_value <= 100)
  ),
  constraint coupons_valid_window check (
    starts_at is null
    or expires_at is null
    or starts_at < expires_at
  )
);

alter table public.orders
add column if not exists coupon_code text;

create index if not exists idx_coupons_code on public.coupons (code);
create index if not exists idx_coupons_is_active on public.coupons (is_active);
create index if not exists idx_coupons_expires_at on public.coupons (expires_at);
create index if not exists idx_orders_coupon_code on public.orders (coupon_code);

drop trigger if exists update_coupons_updated_at on public.coupons;
create trigger update_coupons_updated_at
before update on public.coupons
for each row execute function public.update_updated_at_column();

alter table public.coupons enable row level security;

drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
on public.coupons
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
