import { MongoClient, Db, Document } from "mongodb";

// Server-only MongoDB singleton. Never imported from the browser.
//
// IMPORTANT: In Vite SSR dev mode, modules are re-evaluated on every request,
// which resets module-level `let` variables to their initial values each time.
// We use globalThis to persist the singleton across module re-evaluations.

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | null | undefined;
  // eslint-disable-next-line no-var
  var __mongoDb: Db | null | undefined;
  // Ongoing connection attempt — prevents multiple parallel races on first load
  // eslint-disable-next-line no-var
  var __mongoConnecting: Promise<Db> | undefined;
}

function buildMockDb(MOCK_DATA: Record<string, any[]>): Db {
  return new Proxy({} as Db, {
    get: (_target, prop) => {
      if (prop === "collection") {
        return (name: string) =>
          new Proxy({} as any, {
            get: (_t, method) => {
              const data = MOCK_DATA[name] || [];
              if (method === "find" || method === "findOne" || method === "countDocuments") {
                return (filter: any = {}) => {
                  const filtered = data.filter((item: any) => {
                    for (const key in filter) {
                      if (filter[key]?.$in && Array.isArray(filter[key].$in)) {
                        if (!filter[key].$in.includes(item[key])) return false;
                      } else if (filter[key]?.$ne) {
                        if (item[key] === filter[key].$ne) return false;
                      } else if (item[key] !== filter[key]) return false;
                    }
                    return true;
                  });

                  if (method === "findOne") return Promise.resolve(filtered[0] || null);
                  if (method === "countDocuments") return Promise.resolve(filtered.length);

                  return {
                    toArray: async () => filtered,
                    sort: function () { return this; },
                    limit: function () { return this; },
                    then: (cb: any) => cb(filtered),
                  };
                };
              }
              if (
                method === "insertOne" ||
                method === "updateOne" ||
                method === "updateMany" ||
                method === "deleteOne"
              ) {
                return async () => ({ insertedId: "mock-id", acknowledged: true });
              }
              return undefined;
            },
          });
      }
      return undefined;
    },
  });
}

export async function getDb(): Promise<Db> {
  // Return cached singleton (survives Vite module re-evaluations via globalThis)
  if (globalThis.__mongoDb) return globalThis.__mongoDb;

  // If a connection attempt is already in flight, wait for it instead of racing
  if (globalThis.__mongoConnecting) return globalThis.__mongoConnecting;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is not set");

  globalThis.__mongoConnecting = (async () => {
    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      });
      await client.connect();
      globalThis.__mongoClient = client;
      globalThis.__mongoDb = client.db(process.env.MONGODB_DB_NAME ?? "alfatooling");
      console.log("MongoDB connected successfully.");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      console.warn("Using mock database — results will be in-memory only.");
      globalThis.__mongoClient = null;
      const { MOCK_DATA } = await import("./db.mock");
      globalThis.__mongoDb = buildMockDb(MOCK_DATA);
    } finally {
      globalThis.__mongoConnecting = undefined;
    }
    return globalThis.__mongoDb!;
  })();

  return globalThis.__mongoConnecting;
}

export async function getCollection<T extends Document = Document>(name: string) {
  const database = await getDb();
  return database.collection<T>(name);
}
