import { createFileRoute } from "@tanstack/react-router";
import { verifyToken } from "@/lib/auth.server";
import { getBucket } from "@/lib/db.server";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Authentication check
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

          const bucket = await getBucket();
          const buffer = await file.arrayBuffer();
          
          // Create upload stream to GridFS
          const uploadStream = bucket.openUploadStream(file.name, {
            metadata: {
              contentType: file.type,
              originalName: file.name,
              uploadedBy: user.id
            }
          });

          // Write buffer to stream
          await new Promise((resolve, reject) => {
            uploadStream.on('error', reject);
            uploadStream.on('finish', resolve);
            uploadStream.write(Buffer.from(buffer));
            uploadStream.end();
          });

          // The file ID is now available after the stream finishes
          const fileId = uploadStream.id.toString();

          return new Response(JSON.stringify({ url: `/api/files/${fileId}` }), {
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
