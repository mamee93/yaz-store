create index if not exists idx_products_track_stock_quantity
on public.products (track_stock, stock_quantity)
where deleted_at is null;
