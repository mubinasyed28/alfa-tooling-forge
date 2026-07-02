import { createServerFn } from "@tanstack/react-start";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";

// Simple file upload handler — saves to public/uploads/
// TODO: Replace with Cloudflare R2 / S3 for production

export const uploadFile = createServerFn({ method: "POST" }).handler(async () => {
  const { getCookie, getRequest } = await import("@tanstack/react-start/server");
  const token = getCookie("alfa_token");
  // Auth check
  const { verifyToken } = await import("../auth.server");
  const user = token ? verifyToken(decodeURIComponent(token)) : null;
  if (!user || (user.role !== "editor" && user.role !== "super_admin")) {
    throw new Error("Unauthorized");
  }

  const request = getRequest();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) throw new Error("File too large (max 50MB)");

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/avi",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) throw new Error(`File type not allowed: ${file.type}`);

  const ext = extname(file.name) || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadsDir, filename), buffer);

  return { url: `/uploads/${filename}` };
});
