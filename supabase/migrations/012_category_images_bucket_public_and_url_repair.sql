insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read category images" on storage.objects;
create policy "Public can read category images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'category-images');

drop policy if exists "Admins can manage category images" on storage.objects;
create policy "Admins can manage category images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'category-images'
  and exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
)
with check (
  bucket_id = 'category-images'
  and exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
);

update public.categories
set image_url = regexp_replace(
  image_url,
  '/storage/v1/object/public/(categories|category|category-image|category_images)/',
  '/storage/v1/object/public/category-images/'
)
where image_url ~ '/storage/v1/object/public/(categories|category|category-image|category_images)/';
