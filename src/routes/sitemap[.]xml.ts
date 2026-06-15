import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = ""; // TODO: replace with project URL once domain is set.

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [cats, prods, posts] = await Promise.all([
          supabaseAdmin.from("categories").select("slug,parent_id"),
          supabaseAdmin.from("products").select("slug,category_id").eq("is_published", true),
          supabaseAdmin.from("posts").select("slug").not("published_at", "is", null),
        ]);
        const catSlugMap = new Map((cats.data ?? []).map((c) => [c.slug, c]));
        const entries: { path: string }[] = [
          { path: "/" }, { path: "/about" }, { path: "/catalog" }, { path: "/brands" },
          { path: "/industries" }, { path: "/resources" }, { path: "/contact" }, { path: "/quote" },
        ];
        for (const c of cats.data ?? []) entries.push({ path: `/catalog/${c.slug}` });
        for (const p of prods.data ?? []) {
          const cat = (cats.data ?? []).find((c) => c.slug && catSlugMap.has(c.slug));
          // find parent for nice URL
          const productCat = (cats.data ?? []).find((c) => c);
          if (p.category_id) {
            const catRow = (cats.data ?? []).find((c: any) => c.id === p.category_id) as any;
            const slug = catRow?.slug;
            if (slug) entries.push({ path: `/catalog/${slug}/${p.slug}` });
          }
        }
        for (const post of posts.data ?? []) entries.push({ path: `/resources/${post.slug}` });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) => `  <url><loc>${BASE_URL}${e.path}</loc></url>`),
          `</urlset>`,
        ].join("\n");
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
