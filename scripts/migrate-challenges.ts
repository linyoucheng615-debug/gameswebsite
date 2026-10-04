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
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// 載入 .env 與 .env.local
loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("連線目標:", { url: url ? `${url.substring(0, 15)}...` : undefined, hasToken: !!authToken });

async function migrate() {
  if (!url) {
    console.error("缺少資料庫連線 URL");
    return;
  }

  const client = createClient({
    url,
    authToken,
  });

  console.log("開始執行資料庫結構遷移...");

  // 1. 為 exam_scores 增加 3 科成績與平均欄位
  const alterColumns = [
    "ALTER TABLE exam_scores ADD COLUMN chineseScore REAL DEFAULT 0;",
    "ALTER TABLE exam_scores ADD COLUMN englishScore REAL DEFAULT 0;",
    "ALTER TABLE exam_scores ADD COLUMN mathScore REAL DEFAULT 0;",
    "ALTER TABLE exam_scores ADD COLUMN averageScore REAL DEFAULT 0;",
    "ALTER TABLE exam_scores ADD COLUMN previousAverage REAL DEFAULT 0;",
  ];

  for (const sql of alterColumns) {
    try {
      await client.execute(sql);
      console.log("✔ 執行成功:", sql);
    } catch (e: any) {
      if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
        console.log("ℹ 欄位已存在，略過:", sql);
      } else {
        console.warn("⚠ 執行異常:", sql, e.message);
      }
    }
  }

  // 2. 建立 weekly_challenges 表
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS weekly_challenges (
        id TEXT PRIMARY KEY,
        weekId TEXT NOT NULL,
        subject TEXT NOT NULL,
        questionText TEXT NOT NULL,
        options TEXT NOT NULL,
        correctAnswer TEXT NOT NULL,
        explanation TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (weekId) REFERENCES academic_weeks(id) ON DELETE CASCADE
      );
    `);
    console.log("✔ 表格 weekly_challenges 建立/確認完畢");
  } catch (e: any) {
    console.error("建立 weekly_challenges 失敗:", e.message);
  }

  // 3. 建立 student_challenge_answers 表
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS student_challenge_answers (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        challengeId TEXT NOT NULL,
        isCorrect BOOLEAN NOT NULL,
        answeredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (challengeId) REFERENCES weekly_challenges(id) ON DELETE CASCADE,
        UNIQUE (studentId, challengeId)
      );
    `);
    console.log("✔ 表格 student_challenge_answers 建立/確認完畢");
  } catch (e: any) {
    console.error("建立 student_challenge_answers 失敗:", e.message);
  }

  console.log("== 遷移完成 ==");
}

migrate();
