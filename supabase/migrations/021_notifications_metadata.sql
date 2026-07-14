alter table public.notifications
add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_notifications_return_requested_unread
on public.notifications ((metadata ->> 'return_id'))
where type = 'return.requested' and is_read = false;
