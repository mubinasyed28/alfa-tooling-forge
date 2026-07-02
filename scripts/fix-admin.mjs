/**
 * One-time fix: ensures the super admin user exists with the correct role.
 * Run: node scripts/fix-admin.mjs
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, "../.env"), "utf8");
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] ??= val;
}

const MONGO_URI   = process.env.MONGODB_URI     || "mongodb://localhost:27017";
const DB_NAME     = process.env.MONGODB_DB_NAME || "alfatooling";
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const ADMIN_PASS  = process.env.SUPER_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error("❌  SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set in .env");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });

try {
  await client.connect();
  console.log(`✅  Connected → ${DB_NAME}`);
  const users = client.db(DB_NAME).collection("users");

  const existing = await users.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    // User exists — force-set correct role regardless of what it was
    await users.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { role: "super_admin", password_hash: await bcrypt.hash(ADMIN_PASS, 12) } }
    );
    console.log(`✅  Updated existing user "${ADMIN_EMAIL}" → role: super_admin`);
  } else {
    // User missing entirely — create fresh
    await users.insertOne({
      email:         ADMIN_EMAIL,
      name:          "Super Admin",
      password_hash: await bcrypt.hash(ADMIN_PASS, 12),
      role:          "super_admin",
      created_at:    new Date(),
    });
    console.log(`✅  Created super admin: ${ADMIN_EMAIL}`);
  }

  const confirmed = await users.findOne({ email: ADMIN_EMAIL }, { projection: { email: 1, role: 1, _id: 0 } });
  console.log("   Current DB state:", confirmed);
  console.log(`\n🎉  Done. Log in at /auth with:\n    Email:    ${ADMIN_EMAIL}\n    Password: ${ADMIN_PASS}`);

} catch (err) {
  console.error("❌ ", err.message);
  process.exit(1);
} finally {
  await client.close();
}
