import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getLevelTitle(level: number): string {
  if (level >= 10) return "🌟 傳奇大魔導士";
  if (level >= 7) return "🔮 奧術大賢者";
  if (level >= 5) return "📜 博學戰術大師";
  if (level >= 3) return "⚔️ 精銳冒險學者";
  if (level >= 2) return "🏹 初階探索者";
  return "🌱 新手見習生";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    if (!rawStudentNum) {
      return NextResponse.json({ error: "請提供學號" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json({ error: "查無此學生" }, { status: 404 });
    }

    // 檢查或建立學生 EXP/Coin 紀錄
    let expCoin = await prisma.studentExpCoin.findUnique({
      where: { studentId: student.id },
    });

    const todayStr = getTodayString();

    if (!expCoin) {
      expCoin = await prisma.studentExpCoin.create({
        data: {
          studentId: student.id,
          level: 1,
          currentExp: 0,
          coins: 0,
          dailyQuizCount: 0,
          lastQuizDate: todayStr,
        },
      });
    } else if (expCoin.lastQuizDate !== todayStr) {
      // 跨日自動重置今日測驗次數
      expCoin = await prisma.studentExpCoin.update({
        where: { id: expCoin.id },
        data: {
          dailyQuizCount: 0,
          lastQuizDate: todayStr,
        },
      });
    }

    // 取得所有單字庫
    const allWords = await prisma.vocabularyWord.findMany();
    if (allWords.length < 4) {
      return NextResponse.json(
        { error: "題庫單字不足 4 個，請請老師先於後台匯入單字" },
        { status: 400 }
      );
    }

    // 隨機抽取 10 題
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    const chosenWords = shuffled.slice(0, Math.min(10, shuffled.length));

    // 生成題目 (隨機中翻英或英翻中，4個選項)
    const questions = chosenWords.map((target, idx) => {
      const isEnToZh = Math.random() > 0.5;
      const questionText = isEnToZh ? target.english : target.chinese;
      const correctAnswer = isEnToZh ? target.chinese : target.english;

      // 產生 3 個錯誤干擾選項
      const otherWords = allWords.filter((w) => w.id !== target.id);
      const wrongShuffled = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
      const wrongAnswers = wrongShuffled.map((w) => (isEnToZh ? w.chinese : w.english));

      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        id: idx + 1,
        question: questionText,
        correctAnswer,
        options,
        type: isEnToZh ? ("en_to_zh" as const) : ("zh_to_en" as const),
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        studentNumber: student.studentNumber,
      },
      playerStatus: {
        level: expCoin.level,
        levelTitle: getLevelTitle(expCoin.level),
        currentExp: expCoin.currentExp,
        nextLevelExp: expCoin.level * 100,
        coins: expCoin.coins,
        dailyQuizCount: expCoin.dailyQuizCount,
        maxDailyQuiz: 3,
        canEarnRewards: expCoin.dailyQuizCount < 3,
      },
      questions,
    });
  } catch (error: any) {
    console.error("GET /api/student/[studentNumber]/quiz error:", error);
    return NextResponse.json({ error: "取得測驗題目失敗" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    const body = await req.json();
    const correctCount = Number(body.correctCount) || 0;

    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json({ error: "查無此學生" }, { status: 404 });
    }

    const todayStr = getTodayString();
    let expCoin = await prisma.studentExpCoin.findUnique({
      where: { studentId: student.id },
    });

    if (!expCoin) {
      expCoin = await prisma.studentExpCoin.create({
        data: {
          studentId: student.id,
          level: 1,
          currentExp: 0,
          coins: 0,
          dailyQuizCount: 0,
          lastQuizDate: todayStr,
        },
      });
    }

    // 檢查跨日重置
    let currentDailyCount = expCoin.dailyQuizCount;
    if (expCoin.lastQuizDate !== todayStr) {
      currentDailyCount = 0;
    }

    const canEarnReward = currentDailyCount < 3;
    let earnedExp = 0;
    let earnedCoins = 0;

    if (canEarnReward) {
      earnedExp = correctCount * 10;
      earnedCoins = correctCount * 5;
    }

    let newExp = expCoin.currentExp + earnedExp;
    let newLevel = expCoin.level;
    let leveledUp = false;

    // 升級計算 (每 100 EXP 升 1 級)
    while (newExp >= newLevel * 100) {
      newExp -= newLevel * 100;
      newLevel += 1;
      leveledUp = true;
    }

    const updated = await prisma.studentExpCoin.update({
      where: { id: expCoin.id },
      data: {
        level: newLevel,
        currentExp: newExp,
        coins: expCoin.coins + earnedCoins,
        dailyQuizCount: currentDailyCount + 1,
        lastQuizDate: todayStr,
      },
    });

    return NextResponse.json({
      success: true,
      earnedExp,
      earnedCoins,
      leveledUp,
      canEarnReward,
      playerStatus: {
        level: updated.level,
        levelTitle: getLevelTitle(updated.level),
        currentExp: updated.currentExp,
        nextLevelExp: updated.level * 100,
        coins: updated.coins,
        dailyQuizCount: updated.dailyQuizCount,
        maxDailyQuiz: 3,
      },
    });
  } catch (error: any) {
    console.error("POST /api/student/[studentNumber]/quiz error:", error);
    return NextResponse.json({ error: "結算測驗結果失敗" }, { status: 500 });
  }
}

