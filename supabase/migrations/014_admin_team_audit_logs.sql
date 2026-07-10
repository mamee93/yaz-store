begin;

-- =========================================================
-- 1. Upgrade admins table
-- =========================================================

alter table public.admins
add column if not exists phone text,
add column if not exists must_change_password boolean not null default true,
add column if not exists last_sign_in_at timestamptz,
add column if not exists created_by uuid;

-- Add the self-reference separately so the migration remains easier to inspect.
alter table public.admins
drop constraint if exists admins_created_by_fkey;

alter table public.admins
add constraint admins_created_by_fkey
foreign key (created_by)
references public.admins(id)
on delete set null;

-- Ensure existing admins have valid names before applying NOT NULL.
update public.admins
set full_name = coalesce(
  nullif(trim(full_name), ''),
  nullif(trim(display_name), ''),
  nullif(trim(email), ''),
  'Admin'
)
where full_name is null
   or trim(full_name) = '';

-- Drop the old role constraint BEFORE converting old role values.
alter table public.admins
drop constraint if exists admins_role_check;

-- Convert legacy roles and safely normalize unknown values.
update public.admins
set role = case
  when role = 'order_staff' then 'cashier'
  when role = 'viewer' then 'staff'
  when role in ('owner', 'manager', 'cashier', 'staff') then role
  else 'staff'
end;

-- Copy invited_by only if the legacy column actually exists.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admins'
      and column_name = 'invited_by'
  ) then
    execute '
      update public.admins
      set created_by = invited_by
      where created_by is null
        and invited_by is not null
    ';
  end if;
end
$$;

alter table public.admins
alter column full_name set not null,
alter column role set default 'staff',
alter column must_change_password set default true;

alter table public.admins
add constraint admins_role_check
check (role in ('owner', 'manager', 'cashier', 'staff'));

-- Existing owners should not be forced to change their current password.
update public.admins
set must_change_password = false
where role = 'owner';

create index if not exists idx_admins_created_by
on public.admins (created_by);

create index if not exists idx_admins_role_active
on public.admins (role, is_active);

-- =========================================================
-- 2. Admin audit logs
-- =========================================================

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),

  admin_id uuid
    references public.admins(id)
    on delete set null,

  auth_user_id uuid,
  admin_name text,
  admin_role text,

  action text not null,
  entity_type text not null,
  entity_id text,

  description text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_admin_id
on public.admin_audit_logs (admin_id);

create index if not exists idx_admin_audit_logs_auth_user_id
on public.admin_audit_logs (auth_user_id);

create index if not exists idx_admin_audit_logs_action
on public.admin_audit_logs (action);

create index if not exists idx_admin_audit_logs_entity_type
on public.admin_audit_logs (entity_type);

create index if not exists idx_admin_audit_logs_created_at
on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists
  "Owners and managers can read admin audit logs"
on public.admin_audit_logs;

create policy
  "Owners and managers can read admin audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.is_active = true
      and a.role in ('owner', 'manager')
  )
);

-- There is intentionally no INSERT/UPDATE/DELETE policy.
-- Audit log writes must occur through the server-side service-role client.

-- =========================================================
-- 3. Order attribution
-- =========================================================

alter table public.orders
add column if not exists created_by_admin_id uuid
  references public.admins(id)
  on delete set null,

add column if not exists updated_by_admin_id uuid
  references public.admins(id)
  on delete set null,

add column if not exists confirmed_by_admin_id uuid
  references public.admins(id)
  on delete set null,

add column if not exists completed_by_admin_id uuid
  references public.admins(id)
  on delete set null,

add column if not exists cancelled_by_admin_id uuid
  references public.admins(id)
  on delete set null;

create index if not exists idx_orders_created_by_admin_id
on public.orders (created_by_admin_id);

create index if not exists idx_orders_updated_by_admin_id
on public.orders (updated_by_admin_id);

create index if not exists idx_orders_confirmed_by_admin_id
on public.orders (confirmed_by_admin_id);

create index if not exists idx_orders_completed_by_admin_id
on public.orders (completed_by_admin_id);

create index if not exists idx_orders_cancelled_by_admin_id
on public.orders (cancelled_by_admin_id);

commit;