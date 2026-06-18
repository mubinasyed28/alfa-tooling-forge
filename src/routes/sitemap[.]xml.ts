import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = ""; // TODO: replace with project URL once domain is set.

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { getCollection } = await import("@/lib/db.server");
        const catsCol = await getCollection("categories");
        const prodsCol = await getCollection("products");
        const postsCol = await getCollection("posts");

        const [cats, prods, posts] = (await Promise.all([
          catsCol.find({}, { projection: { slug: 1, parent_id: 1 } }).toArray(),
          prodsCol.find({ is_published: true }, { projection: { slug: 1, category_id: 1 } }).toArray(),
          postsCol.find({ published_at: { $ne: null } }, { projection: { slug: 1 } }).toArray(),
        ])) as any[][];

        const catSlugMap = new Map(cats.map((c) => [c.slug, c]));
        const entries: { path: string }[] = [
          { path: "/" }, { path: "/about" }, { path: "/catalog" }, { path: "/brands" },
          { path: "/industries" }, { path: "/resources" }, { path: "/contact" }, { path: "/quote" },
        ];
        for (const c of cats) {
          if (c.slug) entries.push({ path: `/catalog/${c.slug}` });
        }
        for (const p of prods) {
          if (p.category_id && p.slug) {
            const catRow = cats.find((c: any) => c._id?.toString() === p.category_id.toString()) as any;
            const slug = catRow?.slug;
            if (slug) entries.push({ path: `/catalog/${slug}/${p.slug}` });
          }
        }
        for (const post of posts) {
          if (post.slug) entries.push({ path: `/resources/${post.slug}` });
        }

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
