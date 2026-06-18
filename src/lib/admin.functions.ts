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

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized: super admin access required");
  }
  return user;
}

export const listPendingUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireSuperAdmin();
  const { getCollection } = await import("./db.server");
  const users = await getCollection("users");
  const data = await users.find({ role: "pending" }).sort({ created_at: 1 }).toArray();
  return data.map((u: any) => ({ id: u._id.toString(), email: u.email, name: u.name, role: u.role, created_at: u.created_at }));
});

export const listAllUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireSuperAdmin();
  const { getCollection } = await import("./db.server");
  const users = await getCollection("users");
  const data = await users.find({}).sort({ created_at: -1 }).toArray();
  return data.map((u: any) => ({
    id: u._id.toString(), email: u.email, name: u.name, role: u.role,
    created_at: u.created_at, approved_at: u.approved_at,
  }));
});

export const approveUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const admin = await requireSuperAdmin();
    const { getCollection } = await import("./db.server");
    const users = await getCollection("users");
    await users.updateOne(
      { _id: new ObjectId(data.id) },
      { $set: { role: "editor", approved_at: new Date(), approved_by: admin.id } }
    );
    return { ok: true };
  });

export const rejectUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { getCollection } = await import("./db.server");
    const users = await getCollection("users");
    await users.deleteOne({ _id: new ObjectId(data.id) });
    return { ok: true };
  });

export const revokeUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { getCollection } = await import("./db.server");
    const users = await getCollection("users");
    await users.updateOne({ _id: new ObjectId(data.id) }, { $set: { role: "pending" } });
    return { ok: true };
  });

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "editor" && user.role !== "super_admin")) {
    throw new Error("Unauthorized: editor access required");
  }
  return user;
}

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireEditor();
  const { getCollection } = await import("./db.server");
  const products = await getCollection("products");
  const rfqs = await getCollection("rfqs");
  const leads = await getCollection("leads");
  const posts = await getCollection("posts");
  const [pCount, rCount, lCount, postsCount] = await Promise.all([
    products.countDocuments({}),
    rfqs.countDocuments({}),
    leads.countDocuments({}),
    posts.countDocuments({}),
  ]);
  return { products: pCount, rfqs: rCount, leads: lCount, posts: postsCount };
});

export const getAdminRfqs = createServerFn({ method: "GET" }).handler(async () => {
  await requireEditor();
  const { getCollection } = await import("./db.server");
  const rfqs = await getCollection("rfqs");
  const data = await rfqs.find({}).sort({ created_at: -1 }).limit(100).toArray();
  return data.map((r: any) => ({
    id: r._id.toString(),
    contact_name: r.contact_name,
    company: r.company,
    email: r.email,
    phone: r.phone,
    city: r.city,
    gst: r.gst,
    machine_model: r.machine_model,
    notes: r.notes,
    status: r.status ?? "new",
    items: r.items ?? [],
    created_at: r.created_at,
  }));
});

export const setRfqStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string(), status: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireEditor();
    const { getCollection } = await import("./db.server");
    const rfqs = await getCollection("rfqs");
    await rfqs.updateOne(
      { _id: new ObjectId(data.id) },
      { $set: { status: data.status } }
    );
    return { ok: true };
  });

export const getAdminLeads = createServerFn({ method: "GET" }).handler(async () => {
  await requireEditor();
  const { getCollection } = await import("./db.server");
  const leads = await getCollection("leads");
  const data = await leads.find({}).sort({ created_at: -1 }).limit(200).toArray();
  return data.map((l: any) => ({
    id: l._id.toString(),
    name: l.name,
    email: l.email,
    phone: l.phone,
    company: l.company,
    message: l.message,
    created_at: l.created_at,
  }));
});
