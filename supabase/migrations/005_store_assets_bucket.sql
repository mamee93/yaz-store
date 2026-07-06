insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read store assets" on storage.objects;
create policy "Public can read store assets"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'store-assets');

drop policy if exists "Admins can manage store assets" on storage.objects;
create policy "Admins can manage store assets"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'store-assets'
  and exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
)
with check (
  bucket_id = 'store-assets'
  and exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
);
