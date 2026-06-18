import { MongoClient, Db } from "mongodb";

// Server-only MongoDB singleton. Never imported from the browser.

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is not set");
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB_NAME ?? "alfatooling");
  return db;
}

export async function getCollection<T extends Document = Document>(name: string) {
  const database = await getDb();
  return database.collection<T>(name);
}
