import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TACTICAL_CHIPS, isChipUnlocked, ChipId, calculateP85Threshold } from "@/lib/chips";

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

    // 2. 取得所有週次
    const weeks = await prisma.academicWeek.findMany({
      orderBy: { weekNumber: "asc" },
    });

    if (weeks.length === 0) {
      return NextResponse.json({ error: "系統尚未建立任何週次" }, { status: 400 });
    }

    const currentWeek = weeks[weeks.length - 1];

    // 3. 學生當週作業與成績
    const currentHomework = await prisma.homeworkRecord.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: currentWeek.id,
        },
      },
    });

    const currentScore = await prisma.examScore.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: currentWeek.id,
        },
      },
    });

    // 4. 取得歷次各週成績、作業與班級平均 (用於 Recharts)
    const allExamScores = await prisma.examScore.findMany({
      include: { academicWeek: true },
    });

    const studentExamScores = await prisma.examScore.findMany({
      where: { studentId: student.id },
      include: { academicWeek: true },
      orderBy: { academicWeek: { weekNumber: "asc" } },
    });

    const studentHomeworks = await prisma.homeworkRecord.findMany({
      where: { studentId: student.id },
      include: { academicWeek: true },
    });

    // 各科及總分班級平均
    const weekClassAvgMap = new Map<string, { chinese: number; english: number; math: number; total: number; average: number }>();
    for (const w of weeks) {
      const scoresInWeek = allExamScores.filter((s) => s.weekId === w.id);
      if (scoresInWeek.length > 0) {
        const cSum = scoresInWeek.reduce((acc, curr) => acc + (curr.chineseScore || 0), 0);
        const eSum = scoresInWeek.reduce((acc, curr) => acc + (curr.englishScore || 0), 0);
        const mSum = scoresInWeek.reduce((acc, curr) => acc + (curr.mathScore || 0), 0);
        const count = scoresInWeek.length;
        const cAvg = Math.round((cSum / count) * 10) / 10;
        const eAvg = Math.round((eSum / count) * 10) / 10;
        const mAvg = Math.round((mSum / count) * 10) / 10;
        const totAvg = Math.round((cAvg + eAvg + mAvg) * 10) / 10;
        const avg = Math.round((totAvg / 3) * 10) / 10;
        weekClassAvgMap.set(w.id, { chinese: cAvg, english: eAvg, math: mAvg, total: totAvg, average: avg });
      } else {
        weekClassAvgMap.set(w.id, { chinese: 75, english: 75, math: 75, total: 225, average: 75 });
      }
    }

    const chartData = weeks.map((w) => {
      const score = studentExamScores.find((s) => s.weekId === w.id);
      const hw = studentHomeworks.find((h) => h.weekId === w.id);
      const c = score?.chineseScore ?? 75;
      const e = score?.englishScore ?? 75;
      const m = score?.mathScore ?? 75;
      const total = Math.round((c + e + m) * 10) / 10;
      const avg = score?.averageScore ?? Math.round(((c + e + m) / 3) * 10) / 10;
      const classStat = weekClassAvgMap.get(w.id) ?? { chinese: 75, english: 75, math: 75, total: 225, average: 75 };

      return {
        weekNumber: w.weekNumber,
        weekTitle: w.title,
        chinese: c,
        english: e,
        math: m,
        total,
        average: avg,
        chineseClassAvg: classStat.chinese,
        englishClassAvg: classStat.english,
        mathClassAvg: classStat.math,
        totalClassAvg: classStat.total,
        averageClassAvg: classStat.average,
        homeworkStatus: hw?.status || "COMPLETED",
      };
    });

    // 5. 每週自主修練任務狀態與題目
    const questLog = await prisma.studentWeeklyQuestLog.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: currentWeek.id,
        },
      },
    });

    const questions = await prisma.weeklyQuizQuestion.findMany({
      where: { weekId: currentWeek.id },
      orderBy: { createdAt: "asc" },
    });

    const quests = {
      math: {
        completed: questLog?.completedMath ?? false,
        questions: questions
          .filter((q) => q.category === "MATH")
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            options: JSON.parse(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
      },
      chinese: {
        completed: questLog?.completedChinese ?? false,
        questions: questions
          .filter((q) => q.category === "CHINESE")
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            options: JSON.parse(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
      },
      english: {
        completed: questLog?.completedEnglish ?? false,
        questions: questions
          .filter((q) => q.category === "ENGLISH")
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            options: JSON.parse(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
      },
      vocab: {
        completed: questLog?.completedVocab ?? false,
        questions: questions
          .filter((q) => q.category === "VOCAB")
          .map((q) => ({
            id: q.id,
            questionText: q.questionText,
            options: JSON.parse(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
      },
      hasUnlockedChip: questLog?.hasUnlockedChip ?? false,
    };

    // 6. 晶片解鎖狀態與班級 PR85 (Top 15%) 門檻
    const weekExamScores = allExamScores.filter((s) => s.weekId === currentWeek.id && (s.averageScore || 0) > 0);
    const mathP85Threshold = calculateP85Threshold(weekExamScores.map((s) => s.mathScore || 0));
    const chineseP85Threshold = calculateP85Threshold(weekExamScores.map((s) => s.chineseScore || 0));
    const englishP85Threshold = calculateP85Threshold(weekExamScores.map((s) => s.englishScore || 0));

    const isExcused = !currentScore || (currentScore.chineseScore === 0 && currentScore.englishScore === 0 && currentScore.mathScore === 0);

    const hasHwComp = currentHomework?.status === "COMPLETED";
    const chipQualificationData = {
      chineseScore: currentScore?.chineseScore || 0,
      englishScore: currentScore?.englishScore || 0,
      mathScore: currentScore?.mathScore || 0,
      averageScore: currentScore?.averageScore || 0,
      previousAverage: currentScore?.previousAverage || 0,
      hasHomeworkCompleted: hasHwComp,
      hasCompletedAnyQuest: questLog?.hasUnlockedChip ?? false,
      mathP85Threshold,
      chineseP85Threshold,
      englishP85Threshold,
    };

    const chipsList = (Object.keys(TACTICAL_CHIPS) as ChipId[]).map((cid) => {
      const meta = TACTICAL_CHIPS[cid];
      const { unlocked, reason, isTop15Percent } = isChipUnlocked(cid, chipQualificationData);
      return {
        ...meta,
        unlocked,
        lockReason: reason,
        isTop15Percent: !!isTop15Percent,
      };
    });

    // 學生當週裝備的晶片
    const loadout = await prisma.weeklyStudentLoadout.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: currentWeek.id,
        },
      },
    });

    const equippedChip = loadout?.equippedChip || chipsList.find((c) => c.unlocked)?.id || "ADVERSITY_SHATTER";

    // 7. 當週對戰推演
    const match = await prisma.battleMatch.findFirst({
      where: {
        weekId: currentWeek.id,
        OR: [{ player1Id: student.id }, { player2Id: student.id }],
      },
      include: {
        player1: true,
        player2: true,
      },
    });

    let matchView = null;
    if (match) {
      let parsedLog = null;
      try {
        parsedLog = JSON.parse(match.battleLog);
      } catch {
        parsedLog = null;
      }
      matchView = {
        id: match.id,
        isSettled: currentWeek.isSettled,
        player1: match.player1,
        player2: match.player2,
        winnerId: match.winnerId,
        isDraw: match.isDraw,
        battleLog: parsedLog,
      };
    }

    // 8. 歷史戰績統計
    const allMatches = await prisma.battleMatch.findMany({
      where: {
        OR: [{ player1Id: student.id }, { player2Id: student.id }],
      },
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;
    for (const m of allMatches) {
      if (m.isDraw) draws += 1;
      else if (m.winnerId === student.id) wins += 1;
      else if (m.winnerId) losses += 1;
    }

    const totalMatches = wins + losses + draws;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return NextResponse.json({
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        name: student.name,
        gender: student.gender,
      },
      currentWeek: {
        id: currentWeek.id,
        weekNumber: currentWeek.weekNumber,
        title: currentWeek.title,
        isSettled: currentWeek.isSettled,
      },
      homework: currentHomework
        ? {
            status: currentHomework.status,
            missingScope: currentHomework.missingScope,
          }
        : { status: "COMPLETED", missingScope: null },
      examScore: currentScore
        ? {
            chineseScore: currentScore.chineseScore,
            englishScore: currentScore.englishScore,
            mathScore: currentScore.mathScore,
            averageScore: currentScore.averageScore,
            previousAverage: currentScore.previousAverage,
          }
        : null,
      stats: {
        wins,
        losses,
        draws,
        winRate,
      },
      chartData,
      quests,
      chips: chipsList,
      equippedChip,
      match: matchView,
      isExcused,
      p85Thresholds: {
        math: mathP85Threshold,
        chinese: chineseP85Threshold,
        english: englishP85Threshold,
      },
    });
  } catch (error: any) {
    console.error("GET /api/portal/[studentNumber] error:", error);
    return NextResponse.json({ error: "載入看板資料失敗" }, { status: 500 });
  }
}

