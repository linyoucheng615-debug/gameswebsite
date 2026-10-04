import * as fs from "fs";
import * as path from "path";
import prisma from "../src/lib/prisma";

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

async function seedChallenges() {
  console.log("檢查週次與題目狀態...");
  const weeks = await prisma.academicWeek.findMany({
    orderBy: { weekNumber: "asc" },
  });

  if (weeks.length === 0) {
    console.log("尚無週次，略過種子");
    return;
  }

  const latestWeek = weeks[weeks.length - 1];
  console.log(`目前最新週次: 第 ${latestWeek.weekNumber} 週 (ID: ${latestWeek.id}, ${latestWeek.title})`);

  // 檢查是否已有題目
  const existingChallenges = await (prisma as any).weeklyChallenge.findMany({
    where: { weekId: latestWeek.id },
  });

  if (existingChallenges.length === 0) {
    console.log("新增第 " + latestWeek.weekNumber + " 週作業錯題挑戰 (國、英、數各一題)...");
    
    // 國文
    await (prisma as any).weeklyChallenge.create({
      data: {
        weekId: latestWeek.id,
        subject: "CHINESE",
        questionText: "下列各組「」中的成語，何者用字完全正確？",
        options: JSON.stringify([
          "A. 墨守成「歸」",
          "B. 迫不「急」待",
          "C. 「膾」炙人口",
          "D. 濫「芋」充數"
        ]),
        correctAnswer: "C. 「膾」炙人口",
        explanation: "「膾炙人口」完全正確。A應為墨守成「規」，B應為迫不「及」待，D「芋」正確但常用「竽」充數（濫竽充數）。本題正解為 C。",
      },
    });

    // 英文
    await (prisma as any).weeklyChallenge.create({
      data: {
        weekId: latestWeek.id,
        subject: "ENGLISH",
        questionText: "If it ______ sunny tomorrow, we will have a picnic in the park.",
        options: JSON.stringify([
          "A. is",
          "B. will be",
          "C. was",
          "D. has been"
        ]),
        correctAnswer: "A. is",
        explanation: "在條件副詞子句 (If...) 中，表示未來可能發生的事情，主要子句用未來式 (will have)，條件子句需用「現在式代替未來式」，故選 is。",
      },
    });

    // 數學
    await (prisma as any).weeklyChallenge.create({
      data: {
        weekId: latestWeek.id,
        subject: "MATH",
        questionText: "小明有一袋蘋果，分給 6 個人餘 4 顆，分給 8 個人餘 6 顆。這袋蘋果最少可能有幾顆？",
        options: JSON.stringify([
          "A. 22 顆",
          "B. 24 顆",
          "C. 46 顆",
          "D. 48 顆"
        ]),
        correctAnswer: "A. 22 顆",
        explanation: "不足數相同問題：6人餘4即「不足2顆」，8人餘6即「不足2顆」。因此求 [6, 8] 之最小公倍數再減 2：LCM(6, 8) = 24，24 - 2 = 22 顆。",
      },
    });

    console.log("✔ 已成功建立 3 道挑戰題目！");
  } else {
    console.log(`已有 ${existingChallenges.length} 道挑戰題目，不重複建立。`);
  }

  // 檢查 exam_scores 是否有國英數成績，若為 0 則根據 rawScore 填補合理數值
  const examScores = await prisma.examScore.findMany({
    where: { weekId: latestWeek.id },
  });

  console.log(`檢查 ${examScores.length} 位學生的成績...`);
  for (const score of examScores as any[]) {
    if (score.chineseScore === 0 && score.mathScore === 0) {
      const base = score.rawScore || 75;
      const c = Math.max(40, Math.min(100, Math.round(base + (Math.random() * 12 - 6))));
      const e = Math.max(40, Math.min(100, Math.round(base + (Math.random() * 14 - 7))));
      const m = Math.max(40, Math.min(100, Math.round(base + (Math.random() * 10 - 5))));
      const avg = Math.round(((c + e + m) / 3) * 10) / 10;
      const prevAvg = Math.max(40, Math.round((avg + (Math.random() * 10 - 6)) * 10) / 10);

      await prisma.examScore.update({
        where: { id: score.id },
        data: {
          chineseScore: c,
          englishScore: e,
          mathScore: m,
          averageScore: avg,
          previousAverage: prevAvg,
        } as any,
      });
    }
  }

  console.log("✔ 學生成績國英數平均補正完成！");
}

seedChallenges()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
