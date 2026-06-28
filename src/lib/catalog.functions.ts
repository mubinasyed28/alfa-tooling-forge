import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ObjectId } from "mongodb";

function toId(doc: any): any {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(toId);
  const { _id, ...rest } = doc;
  return { ...rest, id: _id?.toString() };
}

export const listCategoriesTree = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollection } = await import("./db.server");
  const col = await getCollection("categories");
  const data = await col.find({}).sort({ sort_order: 1 }).toArray();
  return data.map(toId);
});

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { getCollection } = await import("./db.server");
    const categories = await getCollection("categories");
    const cat = await categories.findOne({ slug: data.slug }) as any;
    if (!cat) return null;
    const catId = cat._id.toString();
    const children = await categories.find({ parent_id: catId }).sort({ sort_order: 1 }).toArray();
    const childIds = children.map((c: any) => c._id.toString());
    const ids = [catId, ...childIds];
    const products = await getCollection("products");
    const prods = await products
      .find({ category_id: { $in: ids }, is_published: true })
      .sort({ name: 1 })
      .limit(100)
      .toArray();
    return { category: toId(cat), children: children.map(toId), products: prods.map(toId) };
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { getCollection } = await import("./db.server");
    const products = await getCollection("products");
    const product = await products.findOne({ slug: data.slug }) as any;
    if (!product) return null;
    const brands = await getCollection("brands");
    const categories = await getCollection("categories");
    const brand = product.brand_id ? toId(await brands.findOne({ _id: new ObjectId(product.brand_id) })) : null;
    const category = product.category_id ? toId(await categories.findOne({ _id: new ObjectId(product.category_id) })) : null;
    let parentCategory = null;
    if (category?.parent_id) {
      parentCategory = toId(await categories.findOne({ _id: new ObjectId(category.parent_id) }));
    }
    const related = product.category_id
      ? (await products.find({ category_id: product.category_id, _id: { $ne: product._id } }).limit(4).toArray()).map(toId)
      : [];
    return { product: toId(product), brand, category, parentCategory, related };
  });

export const searchProducts = createServerFn({ method: "GET" })
  .validator((d: { q: string }) => z.object({ q: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { getCollection } = await import("./db.server");
    const products = await getCollection("products");
    const regex = new RegExp(data.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const prods = await products
      .find({ is_published: true, $or: [{ name: regex }, { sku: regex }, { short_description: regex }] })
      .limit(30)
      .toArray();
    return prods.map(toId);
  });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollection } = await import("./db.server");
  const col = await getCollection("brands");
  const data = await col.find({}).sort({ sort_order: 1 }).toArray();
  return data.map(toId);
});

export const listIndustries = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollection } = await import("./db.server");
  const col = await getCollection("industries");
  const data = await col.find({}).sort({ sort_order: 1 }).toArray();
  return data.map(toId);
});

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollection } = await import("./db.server");
  const col = await getCollection("posts");
  const data = await col.find({ published_at: { $ne: null } }).sort({ published_at: -1 }).toArray();
  return data.map(toId);
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { getCollection } = await import("./db.server");
    const col = await getCollection("posts");
    const post = await col.findOne({ slug: data.slug });
    return toId(post);
  });

export const listAllPublishedProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollection } = await import("./db.server");
  const col = await getCollection("products");
  const data = await col.find({ is_published: true }).sort({ name: 1 }).limit(200).toArray();
  return data.map(toId);
});
