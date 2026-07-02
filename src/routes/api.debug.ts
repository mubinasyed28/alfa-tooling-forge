import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/debug")({
  server: {
    handlers: {
      GET: async () => {
        const results: any = {
          timestamp: new Date().toISOString(),
          env: {
            has_uri: !!process.env.MONGODB_URI,
            db_name: process.env.MONGODB_DB_NAME || "not set",
            has_jwt: !!process.env.JWT_SECRET,
            node_env: process.env.NODE_ENV,
          }
        };

        try {
          // Test the actual connection
          const db = await getDb();
          
          // Check if it's the Proxy (Mock) or real DB
          const isProxy = (db as any)[Symbol.for('isProxy')] || db.constructor.name === 'Proxy';
          results.database = {
             type: isProxy ? "MOCK (Fallback)" : "REAL (Connected)",
             client_type: db.constructor.name
          };

          if (!isProxy) {
            const collections = await db.listCollections().toArray();
            results.database.collections = collections.map(c => c.name);
            
            const userCount = await db.collection("users").countDocuments();
            results.database.user_count = userCount;
            
            const admin = await db.collection("users").findOne({ role: "super_admin" });
            results.database.has_super_admin = !!admin;
            results.database.admin_email = admin?.email;
          }
        } catch (err: any) {
          results.error = err.message;
        }

        return new Response(JSON.stringify(results, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      },
    },
  },
});
