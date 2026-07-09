alter table public.customers
add column if not exists governorate text,
add column if not exists wilayat text,
add column if not exists area text,
add column if not exists detailed_address text;

create index if not exists idx_customers_auth_user_id
on public.customers (auth_user_id);

create index if not exists idx_customers_email
on public.customers (email);
