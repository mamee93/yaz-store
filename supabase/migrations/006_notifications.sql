create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_not_blank check (length(trim(type)) > 0),
  constraint notifications_title_not_blank check (length(trim(title)) > 0),
  constraint notifications_message_not_blank check (length(trim(message)) > 0)
);

create index if not exists idx_notifications_unread_created_at
on public.notifications (is_read, created_at desc);

create index if not exists idx_notifications_entity
on public.notifications (entity_type, entity_id);

alter table public.notifications enable row level security;

drop policy if exists "Admins can read notifications" on public.notifications;
create policy "Admins can read notifications"
on public.notifications
for select
using (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
);

drop policy if exists "Admins can update notifications" on public.notifications;
create policy "Admins can update notifications"
on public.notifications
for update
using (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admins
    where admins.auth_user_id = auth.uid()
      and admins.is_active = true
  )
);
