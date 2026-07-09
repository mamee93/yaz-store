alter table public.admins
add column if not exists invited_by uuid references public.admins(id) on delete set null,
add column if not exists display_name text;

update public.admins
set role = 'order_staff'
where role = 'staff';

alter table public.admins
alter column role set default 'order_staff';

alter table public.admins
drop constraint if exists admins_role_check;

alter table public.admins
add constraint admins_role_check
check (role in ('owner', 'manager', 'order_staff', 'viewer'));

create index if not exists idx_admins_role_active
on public.admins (role, is_active);

create index if not exists idx_admins_invited_by
on public.admins (invited_by);
