alter table public.order_returns
add column if not exists resolution_type text null,
add column if not exists product_refund_omr numeric(12, 3) null,
add column if not exists delivery_fee_refund_omr numeric(12, 3) null;

alter table public.order_returns
drop constraint if exists order_returns_resolution_type_check;

alter table public.order_returns
add constraint order_returns_resolution_type_check check (
  resolution_type is null
  or resolution_type in ('refund', 'replacement_same_product', 'wrong_item_correction')
);

alter table public.order_return_items
add column if not exists returned_item_condition text not null default 'sellable',
add column if not exists replacement_product_id uuid null references public.products(id) on delete set null,
add column if not exists replacement_quantity integer not null default 0,
add column if not exists replacement_status text null,
add column if not exists replacement_stock_deducted_at timestamptz null,
add column if not exists replacement_stock_deducted_by_admin_id uuid null references public.admins(id) on delete set null;

alter table public.order_return_items
drop constraint if exists order_return_items_condition_check;

alter table public.order_return_items
add constraint order_return_items_condition_check check (
  returned_item_condition in ('sellable', 'damaged', 'opened', 'not_returned')
);

alter table public.order_return_items
drop constraint if exists order_return_items_replacement_status_check;

alter table public.order_return_items
add constraint order_return_items_replacement_status_check check (
  replacement_status is null
  or replacement_status in ('pending', 'approved', 'shipped', 'delivered')
);

alter table public.order_return_items
drop constraint if exists order_return_items_replacement_quantity_check;

alter table public.order_return_items
add constraint order_return_items_replacement_quantity_check check (replacement_quantity >= 0);

create index if not exists idx_order_returns_resolution_type
on public.order_returns (resolution_type);

create index if not exists idx_order_return_items_replacement_product
on public.order_return_items (replacement_product_id)
where replacement_product_id is not null;
