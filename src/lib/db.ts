import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("缺少 Turso 連線環境變數 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN");
}

export const db = createClient({
  url,
  authToken,
});

export default db;

