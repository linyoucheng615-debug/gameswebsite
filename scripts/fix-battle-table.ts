import * as fs from "fs";
import * as path from "path";
import { createClient } from "@libsql/client";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1).trim();
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url: url!, authToken });

async function fix() {
  console.log("== 開始重構 battle_matches 表格 ==");
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS battle_matches_v2 (
        id TEXT PRIMARY KEY,
        weekId TEXT NOT NULL,
        player1Id TEXT NOT NULL,
        player2Id TEXT NOT NULL,
        winnerId TEXT,
        isDraw BOOLEAN DEFAULT FALSE,
        battleLog TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ 已建立 battle_matches_v2");

    await client.execute(`
      INSERT OR IGNORE INTO battle_matches_v2 (id, weekId, player1Id, player2Id, winnerId, isDraw, battleLog, createdAt)
      SELECT id, weekId, COALESCE(player1Id, playerAId), COALESCE(player2Id, playerBId, playerAId), winnerId, isDraw, battleLog, createdAt
      FROM battle_matches;
    `);
    console.log("✔ 已遷移既有對局");

    await client.execute(`DROP TABLE battle_matches;`);
    await client.execute(`ALTER TABLE battle_matches_v2 RENAME TO battle_matches;`);
    console.log("✔ battle_matches 表已成功重構為無舊欄位限制！");
  } catch (err: any) {
    console.error("遷移錯誤:", err.message);
  }
}

fix();

