alter table public.product_images
add column if not exists image_url text;

update public.product_images
set image_url = public_url
where image_url is null
  and public_url is not null;
