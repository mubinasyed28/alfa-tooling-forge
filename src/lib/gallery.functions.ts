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

const GallerySchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100), // e.g. awards, inauguration, events
  description: z.string().max(2000).optional(),
  media_urls: z.array(z.string()).min(1),
  external_url: z.string().optional(),
  date: z.string().optional(), // Date of event
});

export const listGalleryItems = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollection } = await import("./db.server");
  const col = await getCollection("gallery");
  const data = await col.find({}).sort({ created_at: -1 }).toArray();
  return data.map(toId);
});

export const createGalleryItem = createServerFn({ method: "POST" })
  .validator((d: unknown) => GallerySchema.parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const col = await getCollection("gallery");
    const doc = {
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await col.insertOne(doc as any);
    return { id: result.insertedId.toString(), ...data };
  });

export const updateGalleryItem = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string(), data: GallerySchema }).parse(d))
  .handler(async ({ data: input }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const col = await getCollection("gallery");
    await col.updateOne(
      { _id: new ObjectId(input.id) },
      { $set: { ...input.data, updated_at: new Date() } },
    );
    return { ok: true };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const col = await getCollection("gallery");
    await col.deleteOne({ _id: new ObjectId(data.id) });
    return { ok: true };
  });
