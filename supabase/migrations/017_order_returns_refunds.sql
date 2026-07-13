create table if not exists public.order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  customer_id uuid null references public.customers(id) on delete set null,
  status text not null default 'requested',
  return_type text not null,
  reason text not null,
  customer_note text null,
  admin_note text null,
  requested_at timestamptz not null default now(),
  approved_at timestamptz null,
  rejected_at timestamptz null,
  received_at timestamptz null,
  refunded_at timestamptz null,
  stock_restored_at timestamptz null,
  approved_by_admin_id uuid null references public.admins(id) on delete set null,
  rejected_by_admin_id uuid null references public.admins(id) on delete set null,
  received_by_admin_id uuid null references public.admins(id) on delete set null,
  refunded_by_admin_id uuid null references public.admins(id) on delete set null,
  refund_method text null,
  refund_amount_omr numeric(12, 3) null,
  refund_reference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_returns_status_check check (
    status in ('requested', 'approved', 'rejected', 'received', 'refunded', 'closed')
  ),
  constraint order_returns_type_check check (
    return_type in ('full_return', 'partial_return', 'exchange', 'refund_only')
  ),
  constraint order_returns_refund_method_check check (
    refund_method is null
    or refund_method in ('cash', 'bank_transfer', 'original_payment_method', 'store_credit', 'manual')
  ),
  constraint order_returns_refund_amount_check check (
    refund_amount_omr is null or refund_amount_omr >= 0
  )
);

alter table public.order_returns
add column if not exists stock_restored_at timestamptz null;

create table if not exists public.order_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.order_returns(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  quantity integer not null,
  unit_refund_omr numeric(12, 3) not null,
  line_refund_omr numeric(12, 3) not null,
  return_to_stock boolean not null default true,
  created_at timestamptz not null default now(),
  constraint order_return_items_quantity_check check (quantity > 0),
  constraint order_return_items_unit_refund_check check (unit_refund_omr >= 0),
  constraint order_return_items_line_refund_check check (line_refund_omr >= 0),
  constraint order_return_items_unique_item unique (return_id, order_item_id)
);

alter table public.inventory_movements
add column if not exists return_id uuid null references public.order_returns(id) on delete set null;

alter table public.inventory_movements
drop constraint if exists inventory_movements_type_check;

alter table public.inventory_movements
add constraint inventory_movements_type_check check (
  movement_type in ('sale', 'restock', 'adjustment', 'return', 'return_in', 'damage', 'cancelled_order')
);

create index if not exists idx_order_returns_order_id
on public.order_returns (order_id);

create index if not exists idx_order_returns_customer_id
on public.order_returns (customer_id);

create index if not exists idx_order_returns_customer_status
on public.order_returns (customer_id, status);

create index if not exists idx_order_returns_status
on public.order_returns (status);

create index if not exists idx_order_returns_type
on public.order_returns (return_type);

create index if not exists idx_order_returns_requested_at
on public.order_returns (requested_at desc);

create unique index if not exists idx_order_returns_one_open_per_order
on public.order_returns (order_id)
where status in ('requested', 'approved', 'received');

create index if not exists idx_order_return_items_return_id
on public.order_return_items (return_id);

create index if not exists idx_order_return_items_order_item_id
on public.order_return_items (order_item_id);

create index if not exists idx_inventory_movements_return_id
on public.inventory_movements (return_id);

create unique index if not exists idx_inventory_return_in_once_per_product
on public.inventory_movements (return_id, product_id)
where return_id is not null
  and movement_type = 'return_in';

drop trigger if exists order_returns_set_updated_at on public.order_returns;
create trigger order_returns_set_updated_at
before update on public.order_returns
for each row execute function public.set_updated_at();

create or replace function public.receive_order_return(
  p_return_id uuid,
  p_admin_id uuid
)
returns table (
  result_code text,
  order_id uuid,
  stock_restored_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return record;
  v_item record;
  v_stock_before integer;
  v_stock_after integer;
  v_restored_at timestamptz;
begin
  select id, order_id, status, stock_restored_at
  into v_return
  from public.order_returns
  where id = p_return_id
  for update;

  if not found then
    return query select
      'not_found'::text,
      null::uuid,
      null::timestamptz,
      'return_not_found'::text;
    return;
  end if;

  if v_return.status = 'received' and v_return.stock_restored_at is not null then
    return query select
      'already_processed'::text,
      v_return.order_id,
      v_return.stock_restored_at,
      'return_already_received'::text;
    return;
  end if;

  if v_return.status <> 'approved' or v_return.stock_restored_at is not null then
    return query select
      'invalid_status'::text,
      v_return.order_id,
      v_return.stock_restored_at,
      'return_not_approved_or_already_processed'::text;
    return;
  end if;

  for v_item in
    select
      oi.product_id,
      sum(ori.quantity)::integer as quantity
    from public.order_return_items ori
    join public.order_items oi on oi.id = ori.order_item_id
    join public.products p on p.id = oi.product_id
    where ori.return_id = p_return_id
      and ori.return_to_stock = true
      and oi.product_id is not null
      and p.track_stock = true
    group by oi.product_id
    order by oi.product_id
  loop
    select stock_quantity
    into v_stock_before
    from public.products
    where id = v_item.product_id
    for update;

    update public.products
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.product_id
    returning stock_quantity into v_stock_after;

    insert into public.inventory_movements (
      product_id,
      order_id,
      return_id,
      admin_id,
      movement_type,
      quantity_change,
      stock_before,
      stock_after,
      reason,
      notes
    )
    values (
      v_item.product_id,
      v_return.order_id,
      p_return_id,
      p_admin_id,
      'return_in',
      v_item.quantity,
      v_stock_before,
      v_stock_after,
      'استلام مرتجع',
      'استلام مرتجع ' || p_return_id::text
    );
  end loop;

  update public.order_returns
  set
    status = 'received',
    received_at = coalesce(received_at, now()),
    received_by_admin_id = p_admin_id,
    stock_restored_at = now()
  where id = p_return_id
    and status = 'approved'
    and stock_restored_at is null
  returning order_returns.stock_restored_at into v_restored_at;

  if v_restored_at is null then
    return query select
      'already_processed'::text,
      v_return.order_id,
      v_return.stock_restored_at,
      'return_already_processed'::text;
    return;
  end if;

  return query select
    'received'::text,
    v_return.order_id,
    v_restored_at,
    'return_received'::text;
end;
$$;

revoke execute on function public.receive_order_return(uuid, uuid) from public, anon, authenticated;
grant execute on function public.receive_order_return(uuid, uuid) to service_role;

alter table public.order_returns enable row level security;
alter table public.order_return_items enable row level security;

drop policy if exists "Customers can read own order returns" on public.order_returns;
create policy "Customers can read own order returns"
on public.order_returns
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = order_returns.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can create own order returns" on public.order_returns;
create policy "Customers can create own order returns"
on public.order_returns
for insert
to authenticated
with check (
  exists (
    select 1
    from public.customers
    where customers.id = order_returns.customer_id
      and customers.auth_user_id = auth.uid()
  )
  and status = 'requested'
  and approved_at is null
  and rejected_at is null
  and received_at is null
  and refunded_at is null
  and stock_restored_at is null
  and approved_by_admin_id is null
  and rejected_by_admin_id is null
  and received_by_admin_id is null
  and refunded_by_admin_id is null
  and refund_method is null
  and refund_amount_omr is null
  and refund_reference is null
);

drop policy if exists "Customers can read own return items" on public.order_return_items;
create policy "Customers can read own return items"
on public.order_return_items
for select
to authenticated
using (
  exists (
    select 1
    from public.order_returns
    join public.customers on customers.id = order_returns.customer_id
    where order_returns.id = order_return_items.return_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can create own return items" on public.order_return_items;
create policy "Customers can create own return items"
on public.order_return_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.order_returns
    join public.customers on customers.id = order_returns.customer_id
    where order_returns.id = order_return_items.return_id
      and customers.auth_user_id = auth.uid()
      and order_returns.status = 'requested'
  )
);

drop policy if exists "Admins can manage order returns" on public.order_returns;
drop policy if exists "Admins can read order returns" on public.order_returns;
create policy "Admins can read order returns"
on public.order_returns
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
      and admins.role in ('owner', 'manager', 'cashier', 'staff')
  )
);

drop policy if exists "Admins can manage order return items" on public.order_return_items;
drop policy if exists "Admins can read order return items" on public.order_return_items;
create policy "Admins can read order return items"
on public.order_return_items
for select
to authenticated
using (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
      and admins.role in ('owner', 'manager', 'cashier', 'staff')
  )
);
