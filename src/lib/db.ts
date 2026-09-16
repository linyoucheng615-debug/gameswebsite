import { createClient, Client } from "@libsql/client";

let clientInstance: Client | null = null;

export function getDb(): Client {
  if (!clientInstance) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      console.warn("TURSO_DATABASE_URL is not defined in environment variables. Falling back to memory client for build safety.");
      return createClient({ url: "file::memory:" });
    }

    clientInstance = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return clientInstance;
}

export const db: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default db;
