begin;

-- =========================================================
-- 1. Customer refund confirmation
-- =========================================================

alter table public.order_returns
add column if not exists customer_refund_confirmed_at timestamptz null;

create index if not exists idx_order_returns_customer_refund_confirmation
on public.order_returns (customer_id, customer_refund_confirmed_at)
where status = 'refunded';

-- =========================================================
-- 2. Customer notifications
-- =========================================================

alter table public.notifications
add column if not exists customer_id uuid null;

alter table public.notifications
drop constraint if exists notifications_customer_id_fkey;

alter table public.notifications
add constraint notifications_customer_id_fkey
foreign key (customer_id)
references public.customers(id)
on delete set null;

alter table public.notifications
add column if not exists link text null;

create index if not exists idx_notifications_customer_unread_created_at
on public.notifications (customer_id, is_read, created_at desc)
where customer_id is not null;

-- =========================================================
-- 3. RLS: customer read access only
-- =========================================================

alter table public.notifications enable row level security;

drop policy if exists "Customers can read own notifications"
on public.notifications;

create policy "Customers can read own notifications"
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.customers as c
    where c.id = notifications.customer_id
      and c.auth_user_id = auth.uid()
  )
);

-- Do not allow customers to update complete notification rows directly.
drop policy if exists "Customers can update own notifications"
on public.notifications;

commit;