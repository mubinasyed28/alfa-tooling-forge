import { createFileRoute } from "@tanstack/react-router";
import { getBucket } from "@/lib/db.server";
import { ObjectId } from "mongodb";

export const Route = createFileRoute("/api/files/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { id } = params;
          const bucket = await getBucket();
          
          // Find the file metadata to get the content type
          const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
          const fileMetadata = files[0];

          if (!fileMetadata) {
            return new Response("File not found", { status: 404 });
          }

          // Open download stream from GridFS
          const downloadStream = bucket.openDownloadStream(new ObjectId(id));

          // Convert stream to standard Web Response
          // In Nitro/TanStack Start, we can return the body as a stream
          return new Response(downloadStream as any, {
            headers: {
              "Content-Type": fileMetadata.metadata?.contentType || "application/octet-stream",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Disposition": `inline; filename="${fileMetadata.filename}"`
            }
          });
        } catch (error: any) {
          console.error("Download error:", error);
          return new Response("Error retrieving file", { status: 500 });
        }
      },
    },
  },
});
