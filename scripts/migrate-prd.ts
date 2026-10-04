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

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function migrate() {
  const client = createClient({ url: url!, authToken });
  console.log("== 開始執行 PRD 資料庫遷移 ==");

  // 1. 為 students 增加 gender 欄位
  try {
    await client.execute("ALTER TABLE students ADD COLUMN gender TEXT DEFAULT 'BOY';");
    console.log("✔ 已為 students 增加 gender 欄位");
  } catch (e: any) {
    if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
      console.log("ℹ students.gender 欄位已存在");
    } else {
      console.warn("students.gender 欄位檢查:", e.message);
    }
  }

  // 2. 建立 weekly_quiz_questions 表
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS weekly_quiz_questions (
        id TEXT PRIMARY KEY,
        weekId TEXT NOT NULL,
        category TEXT NOT NULL,
        questionText TEXT NOT NULL,
        options TEXT NOT NULL,
        correctAnswer TEXT NOT NULL,
        explanation TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (weekId) REFERENCES academic_weeks(id) ON DELETE CASCADE
      );
    `);
    console.log("✔ 表格 weekly_quiz_questions 建立完成");
  } catch (e: any) {
    console.error("建立 weekly_quiz_questions 失敗:", e.message);
  }

  // 3. 建立 student_weekly_quest_logs 表
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS student_weekly_quest_logs (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        weekId TEXT NOT NULL,
        completedMath BOOLEAN DEFAULT FALSE,
        completedChinese BOOLEAN DEFAULT FALSE,
        completedEnglish BOOLEAN DEFAULT FALSE,
        completedVocab BOOLEAN DEFAULT FALSE,
        hasUnlockedChip BOOLEAN DEFAULT FALSE,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (weekId) REFERENCES academic_weeks(id) ON DELETE CASCADE,
        UNIQUE (studentId, weekId)
      );
    `);
    console.log("✔ 表格 student_weekly_quest_logs 建立完成");
  } catch (e: any) {
    console.error("建立 student_weekly_quest_logs 失敗:", e.message);
  }

  // 4. 建立 weekly_student_loadouts 表
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS weekly_student_loadouts (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        weekId TEXT NOT NULL,
        equippedChip TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (weekId) REFERENCES academic_weeks(id) ON DELETE CASCADE,
        UNIQUE (studentId, weekId)
      );
    `);
    console.log("✔ 表格 weekly_student_loadouts 建立完成");
  } catch (e: any) {
    console.error("建立 weekly_student_loadouts 失敗:", e.message);
  }

  // 5. 為 battle_matches 增加 player1Id 與 player2Id
  for (const col of ["player1Id", "player2Id"]) {
    try {
      await client.execute(`ALTER TABLE battle_matches ADD COLUMN ${col} TEXT;`);
      console.log(`✔ 已為 battle_matches 增加 ${col} 欄位`);
    } catch (e: any) {
      if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
        console.log(`ℹ battle_matches.${col} 欄位已存在`);
      } else {
        console.warn(`battle_matches.${col}:`, e.message);
      }
    }
  }

  // 同步既有的 playerAId / playerBId 到 player1Id / player2Id
  try {
    await client.execute(`UPDATE battle_matches SET player1Id = playerAId WHERE player1Id IS NULL;`);
    await client.execute(`UPDATE battle_matches SET player2Id = playerBId WHERE player2Id IS NULL;`);
    console.log("✔ 已同步既有對戰 ID 至 player1Id / player2Id");
  } catch (e: any) {
    console.warn("同步 player1Id / player2Id:", e.message);
  }

  console.log("== 結構遷移成功完畢 ==");
}

migrate();
