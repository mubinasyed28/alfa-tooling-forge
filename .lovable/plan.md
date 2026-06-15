
# Alfa Tooling Systems — Build Plan

A full B2B industrial supplier site with public catalog, RFQ system, resources/blog, and an authenticated admin dashboard. Built on TanStack Start + Lovable Cloud (Postgres + auth + storage). Given the scope, this is staged across multiple turns; **Turn 1 ships the entire public site + RFQ + auth + admin shell with read/list**, then later turns add full admin CRUD polish.

## Design System

- Pure white background, dark navy (#0B2545-ish via tokens), orange accent (#F26A1F-ish via tokens), neutral grays.
- Inter for body, a tight industrial display face (e.g. Space Grotesk) for headings — loaded via `<link>` in `__root.tsx`, declared in `@theme`.
- All colors as HSL semantic tokens in `src/styles.css` (`--background`, `--primary` = navy, `--accent` = orange, `--muted`, etc.) mapped via `@theme inline`.
- Minimal motion: hover lifts, color transitions only. Clean rules, generous whitespace, dense data tables on spec pages.

## Routes (TanStack file-based)

Public (SSR, each with own `head()` — title, description, og:title, og:description; canonical + og:url self-referencing):

```
/                        Home
/about                   About
/catalog                 All categories grid
/catalog/$category       Category listing + filters
/catalog/$category/$slug Product detail
/brands                  Brand grid
/brands/$slug            Brand detail
/industries              Industries overview
/industries/$slug        Industry detail
/resources               Blog/articles index
/resources/$slug         Article detail
/quote                   RFQ basket + submit form
/contact                 Contact + map + form
/auth                    Sign-in (email/password + Google)
/sitemap.xml             Dynamic sitemap server route
```

Authenticated admin (under `_authenticated/`, gated by role check):

```
/_authenticated/admin                   Dashboard (counts: products, RFQs, leads, posts)
/_authenticated/admin/products          List + search
/_authenticated/admin/products/new      Create
/_authenticated/admin/products/$id      Edit
/_authenticated/admin/rfqs              RFQ inbox + status
/_authenticated/admin/leads             Contact form leads
/_authenticated/admin/posts             Blog CRUD
```

## Database (Lovable Cloud / Postgres)

Tables (all with GRANTs + RLS):

- `app_role` enum: `admin`, `editor`, `user`
- `user_roles(user_id, role)` + `has_role()` security-definer fn
- `brands(id, slug, name, logo_url, description)`
- `categories(id, slug, name, parent_id, description, image_url, sort_order)` — supports nested (CNC Tooling → Mitsubishi/Finetech)
- `industries(id, slug, name, description, image_url)`
- `products(id, slug, name, sku, brand_id, category_id, short_description, long_description, specs jsonb, applications text[], features text[], compatible_machines text[], image_urls text[], datasheet_url, is_placeholder bool, created_at)`
- `posts(id, slug, title, excerpt, body_md, cover_url, tags text[], published_at)`
- `rfqs(id, contact_name, company, email, phone, machine_model, notes, file_url, status, created_at)`
- `rfq_items(id, rfq_id, product_id, quantity)`
- `leads(id, name, email, phone, company, message, source, created_at)`

Public reads use server functions with `supabaseAdmin` (safe column projection); writes (RFQ submit, contact) via server functions with Zod validation; admin writes gated by `has_role(auth.uid(),'admin')`.

Storage buckets:
- `product-images` (public)
- `datasheets` (public)
- `rfq-uploads` (private, signed URLs for admin)
- `brand-logos`, `post-covers` (public)

## Server Functions (`src/lib/*.functions.ts`)

- `catalog.functions.ts` — `listCategories`, `getCategory`, `listProducts({category, q, brand, page})`, `getProduct(slug)`
- `rfq.functions.ts` — `submitRfq` (Zod-validated, inserts rfq + items, optional file via signed upload URL)
- `contact.functions.ts` — `submitContact`
- `brands.functions.ts`, `industries.functions.ts`, `posts.functions.ts`
- `admin.functions.ts` — CRUD wrappers, all gated with `requireSupabaseAuth` + admin role check
- `sitemap.functions.ts` — feeds `/sitemap.xml` server route

## Key Features

- **Global search** in header → `/catalog?q=` with instant client filtering over loaded page + server query on submit.
- **Filters** on `/catalog/$category`: brand multi-select, application multi-select, search input — via `validateSearch` (Zod + `fallback`).
- **Quote basket**: Zustand store persisted in `localStorage`; "Add to Quote" on product page; basket page → RFQ form.
- **Floating WhatsApp button** sitewide → opens `wa.me/919811089003` with prefilled message (uses product name on product pages).
- **Click-to-call + email** buttons in header/footer + contact page.
- **Seeded placeholder data**: a migration inserts brands (Mitsubishi, Finetech, Pall, etc.), all categories/subcategories, ~3–6 products per leaf category with realistic specs marked `is_placeholder=true`, 6 industries, 4 sample blog posts.
- **WhatsApp/Call/Email** components reused everywhere.

## SEO

- Per-route `head()` with title, description, og:*, canonical (leaf only), og:url (self-ref relative).
- JSON-LD: `Organization` in `__root.tsx`; `Product` on product pages; `Article` on posts; `BreadcrumbList` on deep routes.
- Dynamic `/sitemap.xml` server route enumerating static routes + all products/categories/brands/posts.
- `public/robots.txt` with `Allow: /`.
- Targeted keywords woven into copy and headings on home, catalog, category pages.

## Admin Dashboard (Phase 1 scope)

- Auth via Lovable Cloud: email/password + Google (broker). First sign-up does NOT auto-promote; the seed migration grants `admin` to a configurable seed email if present, otherwise the user is told to promote via SQL.
- `_authenticated/route.tsx` is the integration-managed gate; admin subtree adds a `has_role` check.
- Pages: dashboard counts, products list/create/edit (with image + datasheet upload), RFQ inbox with status toggle, leads list, posts CRUD with markdown body.

## Out of Scope for Turn 1 (follow-up turns)

- Rich-text editor for posts (start with textarea + markdown)
- Multi-image gallery reordering UI (start with comma-separated URLs + simple uploader)
- CSV import for products
- Email notifications on RFQ submit (add later via server function + Resend if desired)

## Deliverables this turn

1. Enable Lovable Cloud.
2. Migrations: enums, all tables with GRANTs + RLS, `has_role` fn, storage buckets, seed data.
3. Design tokens in `src/styles.css`; fonts in `__root.tsx`.
4. Layout: header (nav + search + call/email), footer (sitemap + contact), floating WhatsApp.
5. All public routes listed above with real content + SEO `head()`.
6. RFQ basket store + submit flow + Contact form.
7. Auth page + admin shell with dashboard, products list/create/edit, RFQs, leads, posts.
8. Dynamic sitemap + robots.txt + Organization JSON-LD.

Ready to switch to build mode and execute.
