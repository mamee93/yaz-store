# Oud Yaz Supabase Schema

This folder contains the initial Supabase PostgreSQL database setup for Oud Yaz.

## Files

- `migrations/001_initial_schema.sql`: Creates enums, tables, triggers, indexes, constraints, RLS, and policies.
- `seed.sql`: Inserts default categories, one store settings row, sample products, and a sample banner.

## Apply Locally

Use the Supabase CLI from the project root:

```bash
supabase db reset
```

Or apply manually in the Supabase SQL editor:

1. Run `migrations/001_initial_schema.sql`.
2. Run `seed.sql`.

## Notes

- Public reads are allowed only for active categories, products, product images, active banners, approved reviews, and store settings.
- Public guest checkout can insert customers, addresses, pending orders, order items, and pending manual payment records only.
- Other writes are admin-only placeholders gated by the `admins` table and `auth.uid()`.
- Products and categories use soft delete via `deleted_at`.
- Orders and order items store snapshots so historical orders remain stable after catalog edits.
- Payments are ready for manual MVP methods and future Tap Payments provider references.

## Storage Buckets

Create these Supabase Storage buckets separately from the SQL migration:

- `product-images`: product gallery and card images.
- `banner-images`: homepage, offers, and category banner images.

Recommended storage rules:

- Public read is acceptable for optimized storefront images.
- Writes, updates, and deletes should be admin-only.
- Store database references as storage paths in `product_images.storage_path` or banner image URL fields.
- Prefer compressed `.webp` images and predictable paths such as `products/{product_id}/{image_id}.webp` and `banners/{banner_id}/{image_id}.webp`.
