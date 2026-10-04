import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkUltimateEligibility } from "@/lib/battleEngine";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    if (!rawStudentNum) {
      return NextResponse.json({ error: "請提供學號" }, { status: 400 });
    }

    // 1. 查找學生
    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json(
        { error: `查無學號「${rawStudentNum}」的學生資料` },
        { status: 404 }
      );
    }

    // 2. 取得所有週次 (依週次排序)
    const weeks = await prisma.academicWeek.findMany({
      orderBy: { weekNumber: "asc" },
    });

    if (weeks.length === 0) {
      return NextResponse.json({ error: "系統尚未建立任何週次" }, { status: 400 });
    }

    const currentWeek = weeks[weeks.length - 1];

    // 3. 取得學生當週作業與成績
    const currentHomework = await prisma.homeworkRecord.findUnique({
      where: {
        weekId_studentId: {
          weekId: currentWeek.id,
          studentId: student.id,
        },
      },
    });

    const currentScore = await prisma.examScore.findUnique({
      where: {
        weekId_studentId: {
          weekId: currentWeek.id,
          studentId: student.id,
        },
      },
    });

    // 4. 取得歷次各週成績、作業與班級平均 (用於 Recharts 折線圖)
    const allExamScores = await prisma.examScore.findMany({
      include: { week: true },
    });

    const studentExamScores = await prisma.examScore.findMany({
      where: { studentId: student.id },
      include: { week: true },
      orderBy: { week: { weekNumber: "asc" } },
    });

    const studentHomeworks = await prisma.homeworkRecord.findMany({
      where: { studentId: student.id },
      include: { week: true },
    });

    // 依週次計算全班平均
    const weekClassAvgMap = new Map<string, number>();
    for (const w of weeks) {
      const scoresInWeek = allExamScores.filter((s) => s.weekId === w.id);
      if (scoresInWeek.length > 0) {
        const sum = scoresInWeek.reduce((acc, curr) => acc + (curr.averageScore || curr.rawScore), 0);
        weekClassAvgMap.set(w.id, Math.round((sum / scoresInWeek.length) * 10) / 10);
      } else {
        weekClassAvgMap.set(w.id, 75);
      }
    }

    const chartData = weeks.map((w) => {
      const score = studentExamScores.find((s) => s.weekId === w.id);
      const hw = studentHomeworks.find((h) => h.weekId === w.id);
      const baseScore = score?.rawScore ?? 75;
      const c = score?.chineseScore || baseScore;
      const e = score?.englishScore || baseScore;
      const m = score?.mathScore || baseScore;
      const avg = score?.averageScore || Math.round(((c + e + m) / 3) * 10) / 10;

      return {
        weekNumber: w.weekNumber,
        weekTitle: w.title,
        chinese: c,
        english: e,
        math: m,
        average: avg,
        classAverage: weekClassAvgMap.get(w.id) ?? 75,
        homeworkStatus: hw?.status ?? "completed",
      };
    });

    // 5. 取得當週錯題挑戰題目與學生作答紀錄
    const weeklyChallenges = await (prisma as any).weeklyChallenge.findMany({
      where: { weekId: currentWeek.id },
      orderBy: { subject: "asc" },
    });

    const studentAnswers = await (prisma as any).studentChallengeAnswer.findMany({
      where: {
        studentId: student.id,
        challenge: {
          weekId: currentWeek.id,
        },
      },
    });

    const answerMap = new Map<string, { isCorrect: boolean }>();
    for (const ans of studentAnswers) {
      answerMap.set(ans.challengeId, { isCorrect: ans.isCorrect });
    }

    const formattedChallenges = weeklyChallenges.map((ch: any) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = typeof ch.options === "string" ? JSON.parse(ch.options) : ch.options;
      } catch {
        parsedOptions = ["A", "B", "C", "D"];
      }

      const userAns = answerMap.get(ch.id);

      return {
        id: ch.id,
        subject: ch.subject,
        questionText: ch.questionText,
        options: parsedOptions,
        explanation: ch.explanation,
        userAnswer: userAns ? { isCorrect: userAns.isCorrect } : null,
      };
    });

    const allChallengesCorrect =
      formattedChallenges.length >= 3 &&
      formattedChallenges.every((c: any) => c.userAnswer && c.userAnswer.isCorrect);

    // 6. 逆轉奧義判定
    const avgScore = currentScore?.averageScore ?? currentScore?.rawScore ?? 75;
    const prevAvg = currentScore?.previousAverage ?? avgScore;
    const hasHwBuff = currentHomework?.hasBuff ?? true;
    const cScore = currentScore?.chineseScore ?? avgScore;
    const eScore = currentScore?.englishScore ?? avgScore;
    const mScore = currentScore?.mathScore ?? avgScore;

    const { hasUltimate, reason: ultimateReason } = checkUltimateEligibility(
      avgScore,
      prevAvg,
      hasHwBuff,
      allChallengesCorrect,
      cScore,
      eScore,
      mScore
    );

    // 7. 當週對戰資料
    const currentMatch = await prisma.battleMatch.findFirst({
      where: {
        weekId: currentWeek.id,
        OR: [{ playerAId: student.id }, { playerBId: student.id }],
      },
      include: {
        playerA: true,
        playerB: true,
      },
    });

    let matchView = null;
    if (currentMatch) {
      const isPlayerA = currentMatch.playerAId === student.id;
      const opponent = isPlayerA ? currentMatch.playerB : currentMatch.playerA;
      let parsedLog = null;
      try {
        parsedLog = JSON.parse(currentMatch.battleLog);
      } catch (e) {
        parsedLog = null;
      }

      let result: "win" | "loss" | "draw" | "pending" = "pending";
      if (currentMatch.isDraw) {
        result = "draw";
      } else if (currentMatch.winnerId === student.id) {
        result = "win";
      } else {
        result = "loss";
      }

      matchView = {
        matchId: currentMatch.id,
        weekNumber: currentWeek.weekNumber,
        weekTitle: currentWeek.title,
        isSettled: currentWeek.isSettled,
        battleLog: parsedLog,
        isPlayerA,
        opponentName: opponent?.name || currentMatch.botName || "神秘對手",
        opponentAvatar: opponent?.avatarId || currentMatch.botAvatar || "pixel-bot",
        result,
        mySkin: {
          gender: student.skinGender || "boy",
          charClass: student.skinClass || "warrior",
          color: student.skinColor || "blue",
        },
        opponentSkin: opponent
          ? {
              gender: opponent.skinGender || "girl",
              charClass: opponent.skinClass || "mage",
              color: opponent.skinColor || "red",
            }
          : {
              gender: "boy",
              charClass: "warrior",
              color: "purple",
            },
        myStartingHp: Math.round(avgScore),
        opponentStartingHp: opponent ? 85 : 80,
        myHasBuff: hasHwBuff,
        opponentHasBuff: true,
      };
    }

    const totalMatches = student.wins + student.losses + student.draws;
    const winRate = totalMatches > 0 ? Math.round((student.wins / totalMatches) * 100) : 0;

    return NextResponse.json({
      student,
      currentWeek,
      currentHomework: currentHomework
        ? {
            id: currentHomework.id,
            status: currentHomework.status,
            missingScope: currentHomework.missingScope,
            hasBuff: currentHomework.hasBuff,
          }
        : null,
      currentScore: currentScore
        ? {
            id: currentScore.id,
            rawScore: currentScore.rawScore,
            chineseScore: currentScore.chineseScore,
            englishScore: currentScore.englishScore,
            mathScore: currentScore.mathScore,
            averageScore: currentScore.averageScore,
            previousAverage: currentScore.previousAverage,
            effectivePower: currentScore.effectivePower,
          }
        : null,
      stats: {
        wins: student.wins,
        losses: student.losses,
        draws: student.draws,
        winRate,
      },
      chartData,
      challenges: formattedChallenges,
      allChallengesCorrect,
      hasUltimate,
      ultimateReason,
      match: matchView,
    });
  } catch (error: any) {
    console.error("GET /api/portal/[studentNumber] error:", error);
    return NextResponse.json({ error: "載入整合看板資料失敗" }, { status: 500 });
  }
}
