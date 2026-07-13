begin;

create sequence if not exists public.product_sku_seq
  as bigint
  start with 1
  increment by 1
  minvalue 1
  no maxvalue
  cache 1;

do $$
declare
  highest_existing_sku bigint;
begin
  select coalesce(
    max(
      case
        when sku ~ '^YAZ-[0-9]+$'
        then substring(sku from '[0-9]+$')::bigint
        else null
      end
    ),
    0
  )
  into highest_existing_sku
  from public.products;

  if highest_existing_sku > 0 then
    perform setval(
      'public.product_sku_seq',
      highest_existing_sku,
      true
    );
  end if;
end
$$;

create or replace function public.generate_product_sku()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.product_sku_seq');

  return 'YAZ-' || lpad(next_number::text, 6, '0');
end;
$$;

revoke all on function public.generate_product_sku() from public;
revoke all on function public.generate_product_sku() from anon;
revoke all on function public.generate_product_sku() from authenticated;

grant execute
on function public.generate_product_sku()
to service_role;

revoke all on sequence public.product_sku_seq from public;
revoke all on sequence public.product_sku_seq from anon;
revoke all on sequence public.product_sku_seq from authenticated;

grant usage, select, update
on sequence public.product_sku_seq
to service_role;

commit;