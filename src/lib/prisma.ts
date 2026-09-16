import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function createPrismaClient(): PrismaClient {
  try {
    const rawUrl = process.env.TURSO_DATABASE_URL;
    const rawToken = process.env.TURSO_AUTH_TOKEN;

    const url = cleanEnv(rawUrl);
    const token = cleanEnv(rawToken);

    if (!url || !token) {
      console.error("[DB AUTH ERROR] 缺少環境變數:", {
        hasUrl: !!url,
        hasToken: !!token,
      });
    }

    if (url && token) {
      console.log("[DB INIT] 連線至 Turso LibSQL:", {
        url,
        tokenPrefix: `${token.substring(0, 6)}...`,
        tokenLength: token.length,
      });

      // 檢查是否誤用了 Turso 平台帳號 Token (Account Token 含有 org_id，直連資料庫會導致 HTTP 401)
      if (token.includes("org_id") || token.startsWith("eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGki")) {
        console.error(
          "[DB AUTH WARNING] ⚠️ 警告：目前帶入的 TURSO_AUTH_TOKEN 格式疑似為「平台帳號 Token」(Account Token) 而非「資料庫讀寫 Token」(Database Token)！這將導致 Turso 回傳 HTTP 401 拒絕連線。請確認 Vercel 環境變數使用的是對應資料庫的 JWT Token。"
        );
      }

      const libsql = createClient({
        url,
        authToken: token,
      });

      const adapter = new PrismaLibSQL(libsql);

      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });
    }

    console.warn("[DB WARNING] 未偵測到完整 Turso 連線憑證，嘗試使用本機 SQLite 降級連線");
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } catch (err) {
    console.error("[Prisma Init Error] 建立 Prisma Client 失敗:", err);
    try {
      return new PrismaClient({ log: ["error"] });
    } catch {
      return {} as PrismaClient;
    }
  }
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma && (globalForPrisma.prisma as any).user) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  if ((client as any).user) {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
