import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ObjectId } from "mongodb";
function toId(doc: any): any {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id?.toString() };
}

async function getCurrentUser() {
  const { verifyToken } = await import("./auth.server");
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie("alfa_token");
  return token ? verifyToken(decodeURIComponent(token)) : null;
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "editor" && user.role !== "super_admin")) {
    throw new Error("Unauthorized: editor access required");
  }
  return user;
}

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized: super admin access required");
  }
  return user;
}

const ProductSchema = z.object({
  name: z.string().max(300).optional(),
  slug: z.string().max(300).optional(),
  sku: z.string().max(100).optional(),
  short_description: z.string().max(2000).optional(),
  long_description: z.string().max(20000).optional(),
  price: z.number().optional(),
  currency: z.string().max(10).optional(),
  image_urls: z.array(z.string()).optional(),
  video_urls: z.array(z.string()).optional(),
  datasheet_url: z.string().optional(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
  specs: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
  applications: z.array(z.string()).optional(),
  compatible_machines: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  is_placeholder: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export const listAllProducts = createServerFn({ method: "GET" })
  .validator((d: { q?: string }) => z.object({ q: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const products = await getCollection("products");
    const filter = data.q ? { name: new RegExp(data.q, "i") } : {};
    const prods = await products.find(filter as any).sort({ created_at: -1 }).limit(200).toArray();
    return prods.map(toId);
  });

export const createProduct = createServerFn({ method: "POST" })
  .validator((d: unknown) => ProductSchema.parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const products = await getCollection("products");
    let slug = data.slug ?? (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : `product-${Date.now()}`);
    const existing = await products.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;
    const doc = { ...data, slug, created_at: new Date(), updated_at: new Date() };
    const result = await products.insertOne(doc as any);
    return { id: result.insertedId.toString(), slug };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string(), data: ProductSchema }).parse(d))
  .handler(async ({ data: input }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const products = await getCollection("products");
    await products.updateOne(
      { _id: new ObjectId(input.id) },
      { $set: { ...input.data, updated_at: new Date() } }
    );
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { getCollection } = await import("./db.server");
    const products = await getCollection("products");
    await products.deleteOne({ _id: new ObjectId(data.id) });
    return { ok: true };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  await requireEditor();
  const { getCollection } = await import("./db.server");
  const col = await getCollection("categories");
  const data = await col.find({}).sort({ sort_order: 1 }).toArray();
  return data.map(toId);
});

export const listBrandsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await requireEditor();
  const { getCollection } = await import("./db.server");
  const col = await getCollection("brands");
  const data = await col.find({}).sort({ sort_order: 1 }).toArray();
  return data.map(toId);
});
