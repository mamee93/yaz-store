alter table public.banners
drop constraint if exists banners_placement_check;

alter table public.banners
add constraint banners_placement_check check (
  placement in ('home_hero', 'home_secondary', 'offers', 'category', 'categories', 'seasonal')
);
