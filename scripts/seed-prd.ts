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

async function seed() {
  console.log("== 開始檢查與填充 PRD 種子資料 ==");

  // 1. 確保最新週次
  let week = await prisma.academicWeek.findFirst({
    where: { weekNumber: 1 },
  });

  if (!week) {
    week = await prisma.academicWeek.create({
      data: {
        weekNumber: 1,
        title: "第 1 週：分數的除法與四則運算",
        isSettled: true,
      },
    });
    console.log("✔ 已建立第 1 週");
  }

  // 2. 確保 30 位學生
  const studentNames = [
    { num: "S101", name: "王小明", gender: "BOY" },
    { num: "S102", name: "李依婷", gender: "GIRL" },
    { num: "S103", name: "陳俊傑", gender: "BOY" },
    { num: "S104", name: "林子晴", gender: "GIRL" },
    { num: "S105", name: "張宇軒", gender: "BOY" },
    { num: "S106", name: "郭庭妤", gender: "GIRL" },
    { num: "S107", name: "蔡承恩", gender: "BOY" },
    { num: "S108", name: "許家豪", gender: "BOY" },
    { num: "S109", name: "楊雅涵", gender: "GIRL" },
    { num: "S110", name: "鄭博文", gender: "BOY" },
    { num: "S111", name: "謝佩珊", gender: "GIRL" },
    { num: "S112", name: "洪偉哲", gender: "BOY" },
    { num: "S113", name: "曾冠廷", gender: "BOY" },
    { num: "S114", name: "賴思穎", gender: "GIRL" },
    { num: "S115", name: "邱昱凱", gender: "BOY" },
    { num: "S116", name: "周佩欣", gender: "GIRL" },
    { num: "S117", name: "葉信宏", gender: "BOY" },
    { num: "S118", name: "廖苡彤", gender: "GIRL" },
    { num: "S119", name: "蘇冠宇", gender: "BOY" },
    { num: "S120", name: "潘品辰", gender: "BOY" },
    { num: "S121", name: "顏少威", gender: "BOY" },
    { num: "S122", name: "魏子翔", gender: "BOY" },
    { num: "S123", name: "蕭亦宣", gender: "GIRL" },
    { num: "S124", name: "羅敏慈", gender: "GIRL" },
    { num: "S125", name: "莊承翰", gender: "BOY" },
    { num: "S126", name: "戴羽彤", gender: "GIRL" },
    { num: "S127", name: "簡柏安", gender: "BOY" },
    { num: "S128", name: "施詠晴", gender: "GIRL" },
    { num: "S129", name: "柯鈞瀚", gender: "BOY" },
    { num: "S130", name: "方千瑜", gender: "GIRL" },
  ];

  for (const s of studentNames) {
    await prisma.student.upsert({
      where: { studentNumber: s.num },
      update: { name: s.name, gender: s.gender },
      create: { studentNumber: s.num, name: s.name, gender: s.gender },
    });
  }
  console.log("✔ 已確認 30 位學生基本資料");

  // 3. 填充第 1 週題庫 (國 3 題, 英 3 題, 數 3 題, 單字 10 題)
  const existingQuestions = await prisma.weeklyQuizQuestion.findMany({
    where: { weekId: week.id },
  });

  if (existingQuestions.length === 0) {
    console.log("建立每週四選一題庫...");
    const sampleQuestions = [
      // 數學 3 題
      {
        category: "MATH",
        questionText: "計算：(3/4) ÷ (2/5) 的結果是多少？",
        options: JSON.stringify(["A. 15/8", "B. 6/20", "C. 8/15", "D. 3/10"]),
        correctAnswer: "A. 15/8",
        explanation: "分數除法為乘上倒數：(3/4) × (5/2) = 15/8。",
      },
      {
        category: "MATH",
        questionText: "小明有一袋蘋果，分給 6 個人餘 4 顆，分給 8 個人餘 6 顆。這袋蘋果最少可能有幾顆？",
        options: JSON.stringify(["A. 22 顆", "B. 24 顆", "C. 46 顆", "D. 48 顆"]),
        correctAnswer: "A. 22 顆",
        explanation: "皆不足 2 顆：[6, 8] 之最小公倍數 24 減 2 = 22 顆。",
      },
      {
        category: "MATH",
        questionText: "一個長方體水槽長 20cm、寬 15cm，注入 3 公升的水後，水深為幾公分？",
        options: JSON.stringify(["A. 10 cm", "B. 8 cm", "C. 12 cm", "D. 15 cm"]),
        correctAnswer: "A. 10 cm",
        explanation: "3 公升 = 3000 立方公分，3000 ÷ (20 × 15) = 3000 ÷ 300 = 10 公分。",
      },

      // 國文 3 題
      {
        category: "CHINESE",
        questionText: "下列各組「」中的成語，何者用字完全正確？",
        options: JSON.stringify(["A. 墨守成「歸」", "B. 迫不「急」待", "C. 「膾」炙人口", "D. 濫「芋」充數"]),
        correctAnswer: "C. 「膾」炙人口",
        explanation: "A應為「規」，B應為「及」，D應為「竽」。正解為 C。",
      },
      {
        category: "CHINESE",
        questionText: "「忽逢桃花林，夾岸數百步，中無雜樹，芳草鮮美，落英繽紛。」句中「落英」是指什麼？",
        options: JSON.stringify(["A. 飄落的桃花瓣", "B. 掉落的果實", "C. 枯萎的樹枝", "D. 衰敗的落葉"]),
        correctAnswer: "A. 飄落的桃花瓣",
        explanation: "「英」在古漢語中常指花，「落英」即為飄落的花瓣。",
      },
      {
        category: "CHINESE",
        questionText: "下列哪一個選項的修辭手法與「白日依山盡，黃河入海流」相同？",
        options: JSON.stringify(["A. 對偶", "B. 誇飾", "C. 轉化", "D. 譬喻"]),
        correctAnswer: "A. 對偶",
        explanation: "白日對黃河，依山對入海，盡對流，字數相等、詞性相對，為標準對偶。",
      },

      // 英文 3 題
      {
        category: "ENGLISH",
        questionText: "If it ______ sunny tomorrow, we will have a picnic in the park.",
        options: JSON.stringify(["A. is", "B. will be", "C. was", "D. has been"]),
        correctAnswer: "A. is",
        explanation: "條件副詞子句 (If...) 中，以現在式代替未來式，故選 is。",
      },
      {
        category: "ENGLISH",
        questionText: "The math homework was so difficult that none of us ______ finish it on time.",
        options: JSON.stringify(["A. could", "B. can", "C. will", "D. should"]),
        correctAnswer: "A. could",
        explanation: "主要子句動詞 was 為過去式，從屬子句需一致使用過去式 could。",
      },
      {
        category: "ENGLISH",
        questionText: "My sister enjoys ______ fantasy novels before going to bed.",
        options: JSON.stringify(["A. reading", "B. to read", "C. read", "D. reads"]),
        correctAnswer: "A. reading",
        explanation: "enjoy 後方接動名詞 V-ing，故選 reading。",
      },

      // 單字 10 題
      {
        category: "VOCAB",
        questionText: "單字測驗：【challenge】的中文字義是？",
        options: JSON.stringify(["A. 挑戰", "B. 放棄", "C. 獎勵", "D. 遊戲"]),
        correctAnswer: "A. 挑戰",
        explanation: "challenge 名詞為挑戰、考驗。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【diligent】的中文字義是？",
        options: JSON.stringify(["A. 勤勉努力的", "B. 懶惰的", "C. 聰明的", "D. 驕傲的"]),
        correctAnswer: "A. 勤勉努力的",
        explanation: "diligent 形容詞為勤勉的、用功的。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【victory】的中文字義是？",
        options: JSON.stringify(["A. 勝利", "B. 失敗", "C. 和局", "D. 投降"]),
        correctAnswer: "A. 勝利",
        explanation: "victory 名詞為勝利、贏得競賽。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【courage】的中文字義是？",
        options: JSON.stringify(["A. 勇氣", "B. 恐懼", "C. 智慧", "D. 憤怒"]),
        correctAnswer: "A. 勇氣",
        explanation: "courage 名詞為勇氣、膽量。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【wisdom】的中文字義是？",
        options: JSON.stringify(["A. 智慧", "B. 力量", "C. 速度", "D. 護甲"]),
        correctAnswer: "A. 智慧",
        explanation: "wisdom 名詞為智慧、明智。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【strategy】的中文字義是？",
        options: JSON.stringify(["A. 戰術、策略", "B. 攻擊", "C. 逃跑", "D. 運氣"]),
        correctAnswer: "A. 戰術、策略",
        explanation: "strategy 名詞為策略、計畫戰術。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【guardian】的中文字義是？",
        options: JSON.stringify(["A. 守護者", "B. 破壞者", "C. 旁觀者", "D. 裁判"]),
        correctAnswer: "A. 守護者",
        explanation: "guardian 名詞為守護者、保衛者。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【transcend】的中文字義是？",
        options: JSON.stringify(["A. 超越、突破", "B. 停留", "C. 下降", "D. 放棄"]),
        correctAnswer: "A. 超越、突破",
        explanation: "transcend 動詞為超越、勝過極限。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【adversity】的中文字義是？",
        options: JSON.stringify(["A. 逆境、困厄", "B. 順境", "C. 幸運", "D. 財富"]),
        correctAnswer: "A. 逆境、困厄",
        explanation: "adversity 名詞為逆境、苦難考驗。",
      },
      {
        category: "VOCAB",
        questionText: "單字測驗：【shatter】的中文字義是？",
        options: JSON.stringify(["A. 粉碎、破滅", "B. 保護", "C. 拼湊", "D. 建造"]),
        correctAnswer: "A. 粉碎、破滅",
        explanation: "shatter 動詞為粉碎、破碎。",
      },
    ];

    for (const q of sampleQuestions) {
      await prisma.weeklyQuizQuestion.create({
        data: {
          weekId: week.id,
          category: q.category,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        },
      });
    }
    console.log(`✔ 已新增 ${sampleQuestions.length} 道題庫 (國 3, 英 3, 數 3, 單字 10)`);
  }

  // 4. 確保學生有第 1 週成績與作業
  const students = await prisma.student.findMany();
  for (const s of students) {
    const isSpecialMissing = s.studentNumber === "S104" || s.studentNumber === "S118" || s.studentNumber === "S127";
    const isSpecialPartial = s.studentNumber === "S109" || s.studentNumber === "S122";

    const hwStatus = isSpecialMissing ? "MISSING" : isSpecialPartial ? "PARTIAL" : "COMPLETED";
    const missingScope = isSpecialMissing ? "數習 P.32-35" : isSpecialPartial ? "國作第 4 課訂正" : null;

    await prisma.homeworkRecord.upsert({
      where: {
        studentId_weekId: {
          studentId: s.id,
          weekId: week.id,
        },
      },
      update: {
        status: hwStatus,
        missingScope,
      },
      create: {
        studentId: s.id,
        weekId: week.id,
        status: hwStatus,
        missingScope,
      },
    });

    // 確保三科成績
    const existingScore = await prisma.examScore.findUnique({
      where: {
        studentId_weekId: {
          studentId: s.id,
          weekId: week.id,
        },
      },
    });

    if (!existingScore || existingScore.chineseScore === 0) {
      const c = 82 + Math.floor(Math.random() * 16);
      const e = 80 + Math.floor(Math.random() * 18);
      const m = 85 + Math.floor(Math.random() * 14);
      const avg = Math.round(((c + e + m) / 3) * 10) / 10;
      const prev = Math.round((avg - (Math.random() * 6 - 3)) * 10) / 10;

      await prisma.examScore.upsert({
        where: {
          studentId_weekId: {
            studentId: s.id,
            weekId: week.id,
          },
        },
        update: {
          chineseScore: c,
          englishScore: e,
          mathScore: m,
          averageScore: avg,
          previousAverage: prev,
        },
        create: {
          studentId: s.id,
          weekId: week.id,
          chineseScore: c,
          englishScore: e,
          mathScore: m,
          averageScore: avg,
          previousAverage: prev,
        },
      });
    }

    // 預設解鎖並裝備晶片
    await prisma.studentWeeklyQuestLog.upsert({
      where: {
        studentId_weekId: {
          studentId: s.id,
          weekId: week.id,
        },
      },
      update: {},
      create: {
        studentId: s.id,
        weekId: week.id,
        completedMath: true,
        completedChinese: false,
        completedEnglish: false,
        completedVocab: false,
        hasUnlockedChip: true,
      },
    });

    await prisma.weeklyStudentLoadout.upsert({
      where: {
        studentId_weekId: {
          studentId: s.id,
          weekId: week.id,
        },
      },
      update: {},
      create: {
        studentId: s.id,
        weekId: week.id,
        equippedChip: "ADVERSITY_SHATTER",
      },
    });
  }

  console.log("✔ 學生成績、作業、修練與晶片種子完畢！");
}

seed()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
