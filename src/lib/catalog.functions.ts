import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCategoriesTree = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id,slug,name,parent_id,description,sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cat, error } = await supabaseAdmin
      .from("categories").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!cat) return null;
    const { data: children } = await supabaseAdmin
      .from("categories").select("id,slug,name,description").eq("parent_id", cat.id).order("sort_order");
    const ids = [cat.id, ...(children ?? []).map((c) => c.id)];
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id,slug,name,sku,short_description,image_urls,brand_id")
      .in("category_id", ids)
      .eq("is_published", true)
      .order("name")
      .limit(100);
    return { category: cat, children: children ?? [], products: products ?? [] };
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error } = await supabaseAdmin
      .from("products").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const [{ data: brand }, { data: category }, { data: related }] = await Promise.all([
      product.brand_id ? supabaseAdmin.from("brands").select("slug,name,description").eq("id", product.brand_id).maybeSingle() : Promise.resolve({ data: null }),
      product.category_id ? supabaseAdmin.from("categories").select("slug,name,parent_id").eq("id", product.category_id).maybeSingle() : Promise.resolve({ data: null }),
      product.category_id ? supabaseAdmin.from("products").select("slug,name,short_description,image_urls").eq("category_id", product.category_id).neq("id", product.id).limit(4) : Promise.resolve({ data: [] }),
    ]);
    let parentCategory = null;
    if (category?.parent_id) {
      const { data: p } = await supabaseAdmin.from("categories").select("slug,name").eq("id", category.parent_id).maybeSingle();
      parentCategory = p;
    }
    return { product, brand, category, parentCategory, related: related ?? [] };
  });

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.q.replace(/[%_]/g, "");
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("slug,name,sku,short_description,image_urls")
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%,short_description.ilike.%${q}%`)
      .eq("is_published", true)
      .limit(30);
    return products ?? [];
  });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("brands").select("*").order("sort_order");
  return data ?? [];
});

export const listIndustries = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("industries").select("*").order("sort_order");
  return data ?? [];
});

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("posts").select("slug,title,excerpt,tags,published_at").not("published_at", "is", null).order("published_at", { ascending: false });
  return data ?? [];
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin.from("posts").select("*").eq("slug", data.slug).maybeSingle();
    return post;
  });
