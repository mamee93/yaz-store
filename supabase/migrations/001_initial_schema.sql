-- Oud Yaz initial Supabase PostgreSQL schema.

create extension if not exists pgcrypto;

create type public.order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'completed',
  'cancelled'
);

create type public.payment_method as enum (
  'cash_on_delivery',
  'bank_transfer',
  'manual_confirmation',
  'tap_payments'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text not null unique,
  role text not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admins_role_check check (role in ('owner', 'manager', 'staff'))
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text not null unique,
  description_ar text,
  description_en text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_sort_order_check check (sort_order >= 0),
  constraint categories_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name_ar text not null,
  name_en text,
  slug text not null unique,
  short_description_ar text,
  short_description_en text,
  description_ar text,
  description_en text,
  price_omr numeric(10, 3) not null,
  compare_at_price_omr numeric(10, 3),
  sku text unique,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  track_stock boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new_arrival boolean not null default false,
  scent_family text,
  intensity text,
  size_label text,
  origin_label text,
  usage_ar text,
  usage_en text,
  occasion_ar text,
  occasion_en text,
  meta_title_ar text,
  meta_title_en text,
  meta_description_ar text,
  meta_description_en text,
  search_keywords_ar text,
  search_keywords_en text,
  weight_grams integer,
  volume_ml numeric(10, 2),
  burn_time text,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_price_check check (price_omr >= 0),
  constraint products_compare_price_check check (
    compare_at_price_omr is null or compare_at_price_omr >= price_omr
  ),
  constraint products_stock_check check (stock_quantity >= 0),
  constraint products_low_stock_check check (low_stock_threshold >= 0),
  constraint products_weight_check check (weight_grams is null or weight_grams > 0),
  constraint products_volume_check check (volume_ml is null or volume_ml > 0),
  constraint products_sort_order_check check (sort_order >= 0)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt_text_ar text,
  alt_text_en text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_sort_order_check check (sort_order >= 0)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  whatsapp_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  full_name text,
  phone text,
  country text not null default 'Oman',
  governorate text not null,
  wilayat text not null,
  city text,
  area text,
  address_line_1 text not null,
  address_line_2 text,
  postal_code text,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  session_id text,
  status text not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (customer_id is not null or session_id is not null),
  constraint carts_status_check check (status in ('active', 'converted', 'abandoned'))
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  unit_price_omr numeric(10, 3) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_check check (quantity > 0),
  constraint cart_items_unit_price_check check (unit_price_omr >= 0),
  constraint cart_items_unique_product unique (cart_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  address_id uuid not null references public.addresses(id) on delete restrict,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  subtotal_omr numeric(10, 3) not null default 0,
  delivery_fee_omr numeric(10, 3) not null default 0,
  discount_omr numeric(10, 3) not null default 0,
  total_omr numeric(10, 3) not null default 0,
  customer_name_snapshot text not null,
  customer_phone_snapshot text not null,
  delivery_address_snapshot jsonb not null,
  customer_notes text,
  admin_notes text,
  stock_deducted_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amounts_check check (
    subtotal_omr >= 0 and delivery_fee_omr >= 0 and discount_omr >= 0 and total_omr >= 0
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_ar_snapshot text not null,
  product_name_en_snapshot text,
  sku_snapshot text,
  unit_price_omr numeric(10, 3) not null,
  quantity integer not null,
  line_total_omr numeric(10, 3) not null,
  product_image_url_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_amounts_check check (unit_price_omr >= 0 and line_total_omr >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount_omr numeric(10, 3) not null,
  provider text,
  provider_payment_id text,
  provider_reference text,
  provider_response jsonb,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_check check (amount_omr >= 0)
);

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name_ar text not null default 'عود ياز',
  store_name_en text,
  contact_phone text,
  whatsapp_number text,
  support_email text,
  instagram_url text,
  tiktok_url text,
  snapchat_url text,
  x_url text,
  facebook_url text,
  business_address_ar text,
  business_address_en text,
  delivery_fee_omr numeric(10, 3) not null default 0,
  free_delivery_threshold_omr numeric(10, 3),
  default_currency text not null default 'OMR',
  is_store_open boolean not null default true,
  maintenance_message_ar text,
  maintenance_message_en text,
  brand_story_ar text,
  brand_story_en text,
  delivery_policy_ar text,
  delivery_policy_en text,
  returns_policy_ar text,
  returns_policy_en text,
  privacy_policy_ar text,
  privacy_policy_en text,
  terms_ar text,
  terms_en text,
  default_meta_title_ar text,
  default_meta_title_en text,
  default_meta_description_ar text,
  default_meta_description_en text,
  singleton_key boolean not null default true unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton_key_check check (singleton_key = true),
  constraint store_settings_currency_check check (default_currency = 'OMR'),
  constraint store_settings_delivery_fee_check check (delivery_fee_omr >= 0),
  constraint store_settings_free_delivery_check check (
    free_delivery_threshold_omr is null or free_delivery_threshold_omr >= 0
  )
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text,
  subtitle_ar text,
  subtitle_en text,
  image_url text not null,
  mobile_image_url text,
  link_url text,
  button_label_ar text,
  button_label_en text,
  placement text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_placement_check check (
    placement in ('home_hero', 'home_secondary', 'offers', 'category')
  ),
  constraint banners_sort_order_check check (sort_order >= 0),
  constraint banners_date_window_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  customer_name text not null,
  rating integer not null,
  title_ar text,
  body_ar text,
  title_en text,
  body_en text,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_check check (rating between 1 and 5)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  admin_id uuid references public.admins(id) on delete set null,
  movement_type text not null,
  quantity_change integer not null,
  stock_before integer not null,
  stock_after integer not null,
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_movements_type_check check (
    movement_type in ('sale', 'restock', 'adjustment', 'return', 'damage', 'cancelled_order')
  ),
  constraint inventory_movements_quantity_change_check check (quantity_change <> 0),
  constraint inventory_movements_stock_check check (stock_before >= 0 and stock_after >= 0)
);

create index admins_auth_user_id_idx on public.admins(auth_user_id);
create index admins_email_idx on public.admins(email);
create index admins_is_active_idx on public.admins(is_active);

create index categories_slug_idx on public.categories(slug);
create index categories_active_idx on public.categories(is_active) where deleted_at is null;
create index categories_featured_idx on public.categories(is_featured) where deleted_at is null;
create index categories_sort_order_idx on public.categories(sort_order);
create index categories_deleted_at_idx on public.categories(deleted_at);

create index products_category_id_idx on public.products(category_id);
create index products_slug_idx on public.products(slug);
create index products_sku_idx on public.products(sku);
create index products_active_idx on public.products(is_active) where deleted_at is null;
create index products_featured_idx on public.products(is_featured) where deleted_at is null;
create index products_best_seller_idx on public.products(is_best_seller) where deleted_at is null;
create index products_new_arrival_idx on public.products(is_new_arrival) where deleted_at is null;
create index products_price_idx on public.products(price_omr);
create index products_sort_order_idx on public.products(sort_order);
create index products_deleted_at_idx on public.products(deleted_at);
create index products_search_ar_idx on public.products using gin (
  to_tsvector(
    'simple',
    coalesce(name_ar, '') || ' ' ||
    coalesce(short_description_ar, '') || ' ' ||
    coalesce(description_ar, '') || ' ' ||
    coalesce(search_keywords_ar, '')
  )
);

create index product_images_product_id_idx on public.product_images(product_id);
create index product_images_sort_order_idx on public.product_images(sort_order);
create unique index product_images_one_primary_idx
  on public.product_images(product_id)
  where is_primary = true;

create index customers_phone_idx on public.customers(phone);
create index customers_email_idx on public.customers(email);
create index customers_created_at_idx on public.customers(created_at);

create index addresses_customer_id_idx on public.addresses(customer_id);
create index addresses_governorate_idx on public.addresses(governorate);
create index addresses_wilayat_idx on public.addresses(wilayat);
create index addresses_area_idx on public.addresses(area);

create index carts_customer_id_idx on public.carts(customer_id);
create index carts_session_id_idx on public.carts(session_id);
create index carts_status_idx on public.carts(status);
create index carts_expires_at_idx on public.carts(expires_at);

create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index cart_items_product_id_idx on public.cart_items(product_id);

create index orders_order_number_idx on public.orders(order_number);
create index orders_customer_id_idx on public.orders(customer_id);
create index orders_address_id_idx on public.orders(address_id);
create index orders_status_idx on public.orders(status);
create index orders_payment_status_idx on public.orders(payment_status);
create index orders_payment_method_idx on public.orders(payment_method);
create index orders_created_at_idx on public.orders(created_at);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
create index order_items_sku_snapshot_idx on public.order_items(sku_snapshot);

create index payments_order_id_idx on public.payments(order_id);
create index payments_method_idx on public.payments(method);
create index payments_status_idx on public.payments(status);
create index payments_provider_payment_id_idx on public.payments(provider_payment_id);
create index payments_provider_reference_idx on public.payments(provider_reference);
create unique index payments_provider_payment_id_unique_idx
  on public.payments(provider_payment_id)
  where provider_payment_id is not null;

create index store_settings_is_store_open_idx on public.store_settings(is_store_open);

create index banners_placement_idx on public.banners(placement);
create index banners_active_idx on public.banners(is_active);
create index banners_sort_order_idx on public.banners(sort_order);
create index banners_starts_at_idx on public.banners(starts_at);
create index banners_ends_at_idx on public.banners(ends_at);

create index reviews_product_id_idx on public.reviews(product_id);
create index reviews_customer_id_idx on public.reviews(customer_id);
create index reviews_order_id_idx on public.reviews(order_id);
create index reviews_rating_idx on public.reviews(rating);
create index reviews_approved_idx on public.reviews(is_approved);
create index reviews_featured_idx on public.reviews(is_featured);
create index reviews_created_at_idx on public.reviews(created_at);

create index inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index inventory_movements_order_id_idx on public.inventory_movements(order_id);
create index inventory_movements_admin_id_idx on public.inventory_movements(admin_id);
create index inventory_movements_type_idx on public.inventory_movements(movement_type);
create index inventory_movements_created_at_idx on public.inventory_movements(created_at);

create trigger admins_set_updated_at
before update on public.admins
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_images_set_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger order_items_set_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

create trigger banners_set_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create trigger inventory_movements_set_updated_at
before update on public.inventory_movements
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where auth_user_id = auth.uid()
      and is_active = true
  );
$$;

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.store_settings enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Admins can read own admin profile"
on public.admins
for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

create policy "Admins can manage admins"
on public.admins
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true and deleted_at is null);

create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true and deleted_at is null);

create policy "Public can read active product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
      and products.deleted_at is null
  )
);

create policy "Public can read active banners"
on public.banners
for select
to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy "Public can read approved reviews"
on public.reviews
for select
to anon, authenticated
using (is_approved = true);

create policy "Public can read open store settings"
on public.store_settings
for select
to anon, authenticated
using (true);

create policy "Public guest checkout can insert customers"
on public.customers
for insert
to anon, authenticated
with check (true);

create policy "Public guest checkout can insert addresses"
on public.addresses
for insert
to anon, authenticated
with check (true);

create policy "Public guest checkout can insert pending orders"
on public.orders
for insert
to anon, authenticated
with check (
  status = 'pending'
  and payment_status = 'pending'
  and payment_method in ('cash_on_delivery', 'bank_transfer', 'manual_confirmation')
);

create policy "Public guest checkout can insert order items"
on public.order_items
for insert
to anon, authenticated
with check (quantity > 0 and unit_price_omr >= 0 and line_total_omr >= 0);

create policy "Public guest checkout can insert manual payment records"
on public.payments
for insert
to anon, authenticated
with check (
  status = 'pending'
  and method in ('cash_on_delivery', 'bank_transfer', 'manual_confirmation')
);

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage product images"
on public.product_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage customers"
on public.customers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage addresses"
on public.addresses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage carts"
on public.carts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage cart items"
on public.cart_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage orders"
on public.orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage order items"
on public.order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage payments"
on public.payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage store settings"
on public.store_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage banners"
on public.banners
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage reviews"
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage inventory movements"
on public.inventory_movements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
