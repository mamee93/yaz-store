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
  v_return_id uuid;
  v_order_id uuid;
  v_status text;
  v_stock_restored_at timestamptz;
  v_item record;
  v_stock_before integer;
  v_stock_after integer;
  v_restored_at timestamptz;
begin
  select
    r.id,
    r.order_id,
    r.status,
    r.stock_restored_at
  into
    v_return_id,
    v_order_id,
    v_status,
    v_stock_restored_at
  from public.order_returns as r
  where r.id = p_return_id
  for update;

  if not found then
    return query select
      'not_found'::text,
      null::uuid,
      null::timestamptz,
      'return_not_found'::text;
    return;
  end if;

  if v_status = 'received' and v_stock_restored_at is not null then
    return query select
      'already_processed'::text,
      v_order_id,
      v_stock_restored_at,
      'return_already_received'::text;
    return;
  end if;

  if v_status <> 'approved' or v_stock_restored_at is not null then
    return query select
      'invalid_status'::text,
      v_order_id,
      v_stock_restored_at,
      'return_not_approved_or_already_processed'::text;
    return;
  end if;

  for v_item in
    select
      oi.product_id,
      sum(ori.quantity)::integer as quantity
    from public.order_return_items as ori
    join public.order_items as oi on oi.id = ori.order_item_id
    join public.products as p on p.id = oi.product_id
    where ori.return_id = p_return_id
      and ori.return_to_stock = true
      and oi.product_id is not null
      and p.track_stock = true
    group by oi.product_id
    order by oi.product_id
  loop
    select p.stock_quantity
    into v_stock_before
    from public.products as p
    where p.id = v_item.product_id
    for update;

    update public.products as p
    set stock_quantity = p.stock_quantity + v_item.quantity
    where p.id = v_item.product_id
    returning p.stock_quantity into v_stock_after;

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
      v_order_id,
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

  update public.order_returns as r
  set
    status = 'received',
    received_at = coalesce(r.received_at, now()),
    received_by_admin_id = p_admin_id,
    stock_restored_at = now()
  where r.id = p_return_id
    and r.status = 'approved'
    and r.stock_restored_at is null
  returning r.stock_restored_at into v_restored_at;

  if v_restored_at is null then
    return query select
      'already_processed'::text,
      v_order_id,
      v_stock_restored_at,
      'return_already_processed'::text;
    return;
  end if;

  return query select
    'received'::text,
    v_order_id,
    v_restored_at,
    'return_received'::text;
end;
$$;

revoke execute on function public.receive_order_return(uuid, uuid) from public, anon, authenticated;
grant execute on function public.receive_order_return(uuid, uuid) to service_role;
