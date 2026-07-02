/**
 * Seed script — run once after setting up a fresh MongoDB instance.
 * Usage: node scripts/seed.mjs
 *
 * Reads credentials from .env in the project root.
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] ??= val;
}

const MONGO_URI    = process.env.MONGODB_URI      || "mongodb://localhost:27017";
const DB_NAME      = process.env.MONGODB_DB_NAME  || "alfatooling";
const ADMIN_EMAIL  = process.env.SUPER_ADMIN_EMAIL;
const ADMIN_PASS   = process.env.SUPER_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error("❌  SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set in .env");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });

try {
  await client.connect();
  console.log(`✅  Connected to MongoDB: ${MONGO_URI} / ${DB_NAME}`);
  const db = client.db(DB_NAME);

  // ── Super admin ─────────────────────────────────────────────────────────────
  const users = db.collection("users");
  const existing = await users.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`ℹ️   Super admin already exists (${ADMIN_EMAIL}) — skipping.`);
  } else {
    const hash = await bcrypt.hash(ADMIN_PASS, 12);
    await users.insertOne({
      email:         ADMIN_EMAIL,
      name:          "Super Admin",
      password_hash: hash,
      role:          "super_admin",
      created_at:    new Date(),
    });
    console.log(`✅  Super admin created: ${ADMIN_EMAIL}`);
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  const cats = db.collection("categories");
  const catCount = await cats.countDocuments();
  if (catCount > 0) {
    console.log(`ℹ️   Categories already seeded (${catCount}) — skipping.`);
  } else {
    const topLevel = [
      { name: "CNC Tooling",          slug: "cnc-tooling",          description: "High-precision tools for CNC machines.",              sort_order: 1 },
      { name: "Filtration Systems",   slug: "filtration-systems",   description: "Advanced industrial filtration solutions.",            sort_order: 2 },
      { name: "ATC Spare Parts",      slug: "atc-spare-parts",      description: "Replacement parts for Automatic Tool Changers.",      sort_order: 3 },
      { name: "Hydraulic Components", slug: "hydraulic-components", description: "Reliable hydraulic pumps and valves.",                 sort_order: 4 },
    ].map(c => ({ ...c, created_at: new Date() }));

    const result = await cats.insertMany(topLevel);
    const cncId = result.insertedIds[0];

    // Sub-categories under CNC Tooling
    await cats.insertMany([
      { name: "End Mills", slug: "end-mills", parent_id: cncId.toString(), sort_order: 1, created_at: new Date() },
      { name: "Collets",   slug: "collets",   parent_id: cncId.toString(), sort_order: 2, created_at: new Date() },
      { name: "Inserts",   slug: "inserts",   parent_id: cncId.toString(), sort_order: 3, created_at: new Date() },
      { name: "Drill Bits",slug: "drill-bits",parent_id: cncId.toString(), sort_order: 4, created_at: new Date() },
    ]);
    console.log("✅  Categories seeded.");
  }

  // ── Brands ──────────────────────────────────────────────────────────────────
  const brands = db.collection("brands");
  const brandCount = await brands.countDocuments();
  if (brandCount > 0) {
    console.log(`ℹ️   Brands already seeded (${brandCount}) — skipping.`);
  } else {
    await brands.insertMany([
      { name: "Mitsubishi", slug: "mitsubishi", sort_order: 1, created_at: new Date() },
      { name: "Finetech",   slug: "finetech",   sort_order: 2, created_at: new Date() },
      { name: "Pall",       slug: "pall",       sort_order: 3, created_at: new Date() },
      { name: "Haas",       slug: "haas",       sort_order: 4, created_at: new Date() },
      { name: "Sandvik",    slug: "sandvik",    sort_order: 5, created_at: new Date() },
      { name: "Iscar",      slug: "iscar",      sort_order: 6, created_at: new Date() },
    ]);
    console.log("✅  Brands seeded.");
  }

  // ── Industries ──────────────────────────────────────────────────────────────
  const industries = db.collection("industries");
  const indCount = await industries.countDocuments();
  if (indCount > 0) {
    console.log(`ℹ️   Industries already seeded (${indCount}) — skipping.`);
  } else {
    await industries.insertMany([
      { name: "Automotive",   slug: "automotive",   sort_order: 1, created_at: new Date() },
      { name: "Aerospace",    slug: "aerospace",    sort_order: 2, created_at: new Date() },
      { name: "Medical",      slug: "medical",      sort_order: 3, created_at: new Date() },
      { name: "Oil & Gas",    slug: "oil-gas",      sort_order: 4, created_at: new Date() },
      { name: "Defence",      slug: "defence",      sort_order: 5, created_at: new Date() },
      { name: "General Engg", slug: "general-engg", sort_order: 6, created_at: new Date() },
    ]);
    console.log("✅  Industries seeded.");
  }

  console.log("\n🎉  Seed complete. You can now log in at /auth with:");
  console.log(`    Email:    ${ADMIN_EMAIL}`);
  console.log(`    Password: ${ADMIN_PASS}`);

} catch (err) {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
} finally {
  await client.close();
}
