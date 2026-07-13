begin;

-- =========================================================
-- 1. Invoice reference on orders
-- =========================================================

alter table public.orders
add column if not exists invoice_number text;

create unique index if not exists idx_orders_invoice_number_unique
on public.orders (invoice_number)
where invoice_number is not null;

-- =========================================================
-- 2. Invoice number sequence
-- =========================================================

create sequence if not exists public.invoice_number_seq
  as bigint
  start with 1
  increment by 1
  minvalue 1
  no maxvalue
  cache 1;

-- Synchronize the sequence with any existing invoice numbers.
-- Example: YAZ-INV-000125 → next generated number will be 126.
do $$
declare
  highest_existing_number bigint;
begin
  select coalesce(
    max(
      case
        when invoice_number ~ '^YAZ-INV-[0-9]+$'
        then substring(invoice_number from '[0-9]+$')::bigint
        else null
      end
    ),
    0
  )
  into highest_existing_number
  from (
    select invoice_number
    from public.orders
    where invoice_number is not null

    union all

    select invoice_number
    from public.invoices
    where to_regclass('public.invoices') is not null
  ) existing_numbers;

  if highest_existing_number > 0 then
    perform setval(
      'public.invoice_number_seq',
      highest_existing_number,
      true
    );
  end if;
exception
  when undefined_table then
    -- The invoices table may not exist yet during the first migration.
    select coalesce(
      max(
        case
          when invoice_number ~ '^YAZ-INV-[0-9]+$'
          then substring(invoice_number from '[0-9]+$')::bigint
          else null
        end
      ),
      0
    )
    into highest_existing_number
    from public.orders
    where invoice_number is not null;

    if highest_existing_number > 0 then
      perform setval(
        'public.invoice_number_seq',
        highest_existing_number,
        true
      );
    end if;
end
$$;

create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.invoice_number_seq');

  return 'YAZ-INV-' || lpad(next_number::text, 6, '0');
end;
$$;

-- Do not allow browser users to generate invoice numbers directly.
revoke all on function public.generate_invoice_number() from public;
revoke all on function public.generate_invoice_number() from anon;
revoke all on function public.generate_invoice_number() from authenticated;

grant execute on function public.generate_invoice_number() to service_role;

-- Protect direct access to the sequence as well.
revoke all on sequence public.invoice_number_seq from public;
revoke all on sequence public.invoice_number_seq from anon;
revoke all on sequence public.invoice_number_seq from authenticated;

grant usage, select, update
on sequence public.invoice_number_seq
to service_role;

-- =========================================================
-- 3. Invoices
-- =========================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null unique
    references public.orders(id)
    on delete restrict,

  invoice_number text not null unique,

  issued_at timestamptz not null default now(),

  created_by_admin_id uuid
    references public.admins(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invoices_invoice_number_format_check
  check (invoice_number ~ '^YAZ-INV-[0-9]{6,}$')
);

-- Unique constraints already create indexes for:
-- order_id
-- invoice_number

create index if not exists idx_invoices_issued_at
on public.invoices (issued_at desc);

create index if not exists idx_invoices_created_by_admin_id
on public.invoices (created_by_admin_id);

-- =========================================================
-- 4. updated_at trigger
-- =========================================================

-- Assumes public.set_updated_at() already exists in earlier migrations.
drop trigger if exists invoices_set_updated_at
on public.invoices;

create trigger invoices_set_updated_at
before update
on public.invoices
for each row
execute function public.set_updated_at();

-- =========================================================
-- 5. RLS
-- =========================================================

alter table public.invoices enable row level security;

drop policy if exists "Admins can manage invoices"
on public.invoices;

drop policy if exists "Active admins can read invoices"
on public.invoices;

create policy "Active admins can read invoices"
on public.invoices
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

-- No INSERT, UPDATE, or DELETE policies.
-- Financial records are created and updated only by trusted server code
-- through the service-role client.

commit;