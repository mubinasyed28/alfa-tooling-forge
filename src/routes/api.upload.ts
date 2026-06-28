import { createFileRoute } from "@tanstack/react-router";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { verifyToken } from "@/lib/auth.server";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Authentication check using cookies
          const cookieHeader = request.headers.get("cookie");
          const match = cookieHeader?.match(/(?:^|;\s*)alfa_token=([^;]+)/);
          const token = match ? decodeURIComponent(match[1]) : null;
          const user = token ? verifyToken(token) : null;

          if (!user || (user.role !== "editor" && user.role !== "super_admin")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const maxSize = 50 * 1024 * 1024;
          if (file.size > maxSize) {
            return new Response(JSON.stringify({ error: "File too large (max 50MB)" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const allowedTypes = [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/webm", "video/ogg", "video/quicktime",
            "application/pdf",
          ];
          
          if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: `File type not allowed: ${file.type}` }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const ext = extname(file.name) || ".bin";
          const filename = `${randomUUID()}${ext}`;
          const uploadsDir = join(process.cwd(), "public", "uploads");
          await mkdir(uploadsDir, { recursive: true });

          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(join(uploadsDir, filename), buffer);

          return new Response(JSON.stringify({ url: `/uploads/${filename}` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Upload error:", error);
          return new Response(JSON.stringify({ error: error.message || "Upload failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
