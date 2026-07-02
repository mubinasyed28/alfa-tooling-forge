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
            db_name: process.env.MONGODB_DB_NAME || "alfatooling",
          }
        };

        try {
          const db = await getDb();
          const isMock = !!(db as any)[Symbol.for('isProxy')];
          
          results.connection = isMock ? "MOCK (Failed to connect to Atlas)" : "REAL (Atlas Connected)";
          
          if (!isMock) {
            const user = await db.collection("users").findOne({ role: "super_admin" });
            results.auth_check = {
              found_super_admin: !!user,
              email_match: user?.email === process.env.SUPER_ADMIN_EMAIL
            };
          } else {
             results.warning = "The app is falling back to the MOCK database because the Atlas connection failed.";
          }
        } catch (err: any) {
          results.connection_error = err.message;
          results.stack = err.stack;
        }

        return new Response(JSON.stringify(results, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      },
    },
  },
});
