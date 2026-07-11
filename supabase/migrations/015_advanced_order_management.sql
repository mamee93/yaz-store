begin;

-- =========================================================
-- 1. Assigned administrator
-- =========================================================

alter table public.orders
add column if not exists assigned_admin_id uuid
references public.admins(id)
on delete set null;

create index if not exists idx_orders_assigned_admin_id
on public.orders (assigned_admin_id);

-- =========================================================
-- 2. Order events
-- =========================================================

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  admin_id uuid
    references public.admins(id)
    on delete set null,

  auth_user_id uuid,

  event_type text not null,
  old_status text,
  new_status text,

  title text not null,
  description text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order_id
on public.order_events (order_id);

create index if not exists idx_order_events_admin_id
on public.order_events (admin_id);

create index if not exists idx_order_events_event_type
on public.order_events (event_type);

create index if not exists idx_order_events_created_at
on public.order_events (created_at desc);

create index if not exists idx_order_events_order_created_at
on public.order_events (order_id, created_at desc);

alter table public.order_events enable row level security;

drop policy if exists
  "Admins can read order events"
on public.order_events;

create policy
  "Admins can read order events"
on public.order_events
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.is_active = true
      and a.role in ('owner', 'manager', 'cashier', 'staff')
  )
);

-- لا توجد سياسات INSERT أو UPDATE أو DELETE.
-- الكتابة تتم من Server Actions عبر service-role فقط.

-- =========================================================
-- 3. Internal order notes
-- =========================================================

create table if not exists public.order_internal_notes (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  admin_id uuid
    references public.admins(id)
    on delete set null,

  note text not null,

  is_pinned boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint order_internal_notes_note_length
  check (
    char_length(btrim(note)) between 1 and 2000
  )
);

create index if not exists idx_order_internal_notes_order_id
on public.order_internal_notes (order_id);

create index if not exists idx_order_internal_notes_admin_id
on public.order_internal_notes (admin_id);

create index if not exists idx_order_internal_notes_created_at
on public.order_internal_notes (created_at desc);

create index if not exists idx_order_internal_notes_pinned
on public.order_internal_notes (
  order_id,
  is_pinned desc,
  created_at desc
);

-- دالة مستقلة لتحديث updated_at، حتى لا نعتمد على دالة سابقة.
create or replace function public.set_order_internal_note_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  order_internal_notes_set_updated_at
on public.order_internal_notes;

create trigger order_internal_notes_set_updated_at
before update
on public.order_internal_notes
for each row
execute function public.set_order_internal_note_updated_at();

alter table public.order_internal_notes enable row level security;

drop policy if exists
  "Admins can read order internal notes"
on public.order_internal_notes;

create policy
  "Admins can read order internal notes"
on public.order_internal_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.is_active = true
      and a.role in ('owner', 'manager', 'cashier', 'staff')
  )
);

-- لا توجد سياسات INSERT أو UPDATE أو DELETE.
-- الكتابة تتم من Server Actions عبر service-role فقط.

commit;