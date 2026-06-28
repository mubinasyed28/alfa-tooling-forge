import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ObjectId } from "mongodb";

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

const IndustrySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  logo_url: z.string().optional(),
  sort_order: z.number().int().default(0),
});

export const createIndustry = createServerFn({ method: "POST" })
  .validator((d: unknown) => IndustrySchema.parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const col = await getCollection("industries");
    const doc = {
      ...data,
      created_at: new Date(),
    };
    const result = await col.insertOne(doc as any);
    return { id: result.insertedId.toString(), ...data };
  });

export const updateIndustry = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string(), data: IndustrySchema }).parse(d))
  .handler(async ({ data: input }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const col = await getCollection("industries");
    await col.updateOne(
      { _id: new ObjectId(input.id) },
      { $set: input.data }
    );
    return { ok: true };
  });

export const deleteIndustry = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const col = await getCollection("industries");
    await col.deleteOne({ _id: new ObjectId(data.id) });
    return { ok: true };
  });
