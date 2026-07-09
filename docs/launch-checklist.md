# Oud Yaz Production Launch Checklist

## Required environment

- `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` point to the production Vercel URL or custom domain.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` is set only as a server-side Vercel environment variable.
- `RESEND_API_KEY` and `EMAIL_FROM` are set before enabling customer/admin emails.

## Supabase

- All migrations through `007_oman_delivery_method.sql` are applied.
- Storage buckets exist: `product-images`, `banner-images`, and `store-assets`.
- At least one active admin exists in both Supabase Auth and `public.admins`.
- RLS policies are enabled and public writes remain limited to checkout inserts only.

## Checkout QA

- Cart displays only real localStorage items.
- Checkout requires Oman governorate, wilayat, area, detailed address, and delivery method.
- Delivery fees are fixed server-side:
  - `pickup_office`: 1 OMR.
  - `home_delivery`: 2 OMR.
- Total formula is `subtotal - coupon + shipping + tax = total`.
- Order records save address snapshot, delivery method, shipping fee, coupon, tax, and total.

## Admin QA

- `/admin` routes redirect unauthenticated users to `/login`.
- Inactive admins cannot access the dashboard.
- Order detail shows customer info, governorate, wilayat, area, detailed address, delivery method, shipping fee, coupon, tax, and total.
- Product/category soft deletes do not remove historical order data.

## Final smoke test

- Run `npm run lint`.
- Run `npm run build`.
- Create a test order with each delivery method.
- Confirm admin order status transitions deduct and restore stock correctly.
- Confirm emails are skipped safely when email env vars are absent, and sent when Resend is configured.
