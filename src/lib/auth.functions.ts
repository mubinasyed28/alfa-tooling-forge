import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ── helpers ──────────────────────────────────────────────────────────────────
async function getAuthHelpers() {
  const { hashPassword, verifyPassword, signToken, buildSetCookie, buildClearCookie, verifyToken } =
    await import("./auth.server");
  return { hashPassword, verifyPassword, signToken, buildSetCookie, buildClearCookie, verifyToken };
}

async function getDb() {
  const { getCollection } = await import("./db.server");
  return getCollection;
}

// ── Seed super admin ──────────────────────────────────────────────────────────
export const seedSuperAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return { ok: false, message: "No super admin env vars set" };
  const { hashPassword } = await getAuthHelpers();
  const getCollection = await getDb();
  const users = await getCollection("users");
  const existing = await users.findOne({ email } as any);
  if (existing) return { ok: true, message: "Already exists" };
  await users.insertOne({
    email,
    name: "Super Admin",
    password_hash: await hashPassword(password),
    role: "super_admin",
    created_at: new Date(),
  } as any);
  return { ok: true, message: "Super admin created" };
});

// ── Sign Up ───────────────────────────────────────────────────────────────────
export const signUp = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { hashPassword } = await getAuthHelpers();
    const getCollection = await getDb();
    const users = await getCollection("users");
    const existing = await users.findOne({ email: data.email } as any);
    if (existing) throw new Error("Email already registered");
    await users.insertOne({
      email: data.email,
      name: data.name,
      password_hash: await hashPassword(data.password),
      role: "pending",
      created_at: new Date(),
    } as any);
    return { ok: true };
  });

// ── Sign In ───────────────────────────────────────────────────────────────────
export const signIn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { verifyPassword, signToken, buildSetCookie } = await getAuthHelpers();
    const getCollection = await getDb();
    const users = await getCollection("users");
    const user = (await users.findOne({ email: data.email } as any)) as any;
    if (!user) throw new Error("Invalid email or password");
    const valid = await verifyPassword(data.password, user.password_hash);
    if (!valid) throw new Error("Invalid email or password");
    if (user.role === "pending")
      throw new Error("Your account is pending approval by the super admin.");
    const publicUser = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const token = signToken(publicUser as any);
    const cookie = buildSetCookie(token);
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Set-Cookie", cookie);
    return { ok: true, user: publicUser };
  });

// ── Sign Out ──────────────────────────────────────────────────────────────────
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { buildClearCookie } = await getAuthHelpers();
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Set-Cookie", buildClearCookie());
  return { ok: true };
});

// ── Get Session ───────────────────────────────────────────────────────────────
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { verifyToken } = await getAuthHelpers();
    const { getCookie } = await import("@tanstack/react-start/server");
    const token = getCookie("alfa_token");
    if (!token) return null;
    return verifyToken(decodeURIComponent(token));
  } catch {
    return null;
  }
});
