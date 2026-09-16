import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ 缺少 Turso 連線環境變數 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function initDb() {
  console.log("🚀 連線至 Turso 雲端 LibSQL 資料庫...");
  console.log(`📍 URL: ${url}`);

  // 1. 建立 users 資料表
  console.log("\n[1/4] 建立 users 資料表...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "nickname" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'player',
      "passwordHash" TEXT NOT NULL,
      "avatar" TEXT NOT NULL DEFAULT 'cyber-fox',
      "motto" TEXT DEFAULT '超越極限，榮耀加冕！',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "users_studentId_key" ON "users"("studentId");`);

  // 2. 建立 tournaments 資料表
  console.log("[2/4] 建立 tournaments 資料表...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "tournaments" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "format" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'esports',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "topCut" INTEGER NOT NULL DEFAULT 4,
      "currentRound" INTEGER NOT NULL DEFAULT 0,
      "totalRounds" INTEGER NOT NULL DEFAULT 3,
      "createdBy" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  // 3. 建立 tournament_participants 資料表
  console.log("[3/4] 建立 tournament_participants 資料表...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "tournament_participants" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tournamentId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "seed" INTEGER NOT NULL DEFAULT 0,
      "currentScore" REAL NOT NULL DEFAULT 0.0,
      "tieBreakScore" REAL NOT NULL DEFAULT 0.0,
      "groupName" TEXT,
      "isDisqualified" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tournament_participants_tournamentId_userId_key" 
    ON "tournament_participants"("tournamentId", "userId");
  `);

  // 4. 建立 matches 資料表
  console.log("[4/4] 建立 matches 資料表...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "matches" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tournamentId" TEXT NOT NULL,
      "round" INTEGER NOT NULL,
      "stage" TEXT NOT NULL DEFAULT 'preliminary',
      "groupName" TEXT,
      "bracketPosition" INTEGER,
      "player1Id" TEXT NOT NULL,
      "player2Id" TEXT,
      "player1Result" TEXT,
      "player2Result" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "reportedBy" TEXT,
      "reportedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("player1Id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("player2Id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("reportedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);

  console.log("\n✅ Turso 雲端資料庫資料表結構初始化完成！");

  // 檢查資料表是否就緒
  const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  console.log("📊 現有資料表清單：", res.rows.map(r => r.name));
}

initDb()
  .catch((e) => {
    console.error("❌ 初始化 Turso 失敗:", e);
    process.exit(1);
  });
