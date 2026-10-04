import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { StudentBattleViewData, BattleLog } from "@/types";

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
        { error: `查無學號「${rawStudentNum}」的學生資料，請確認後重試` },
        { status: 404 }
      );
    }

    // 2. 查找該學生的最新一場已結算對戰
    // 學生可能是 playerA 或 playerB
    const latestMatch = await prisma.battleMatch.findFirst({
      where: {
        OR: [{ playerAId: student.id }, { playerBId: student.id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        week: true,
        playerA: true,
        playerB: true,
      },
    });

    let currentMatchData: StudentBattleViewData["currentMatch"] = null;

    if (latestMatch) {
      const isPlayerA = latestMatch.playerAId === student.id;
      const opponentName = isPlayerA
        ? latestMatch.playerB?.name || latestMatch.botName || "神秘對手"
        : latestMatch.playerA.name;

      const opponentAvatar = isPlayerA
        ? latestMatch.playerB?.avatarId || latestMatch.botAvatar || "pixel-bot"
        : latestMatch.playerA.avatarId;

      let result: "win" | "loss" | "draw" | "pending" = "pending";
      if (latestMatch.isDraw) {
        result = "draw";
      } else if (latestMatch.winnerId === student.id) {
        result = "win";
      } else {
        result = "loss";
      }

      let parsedBattleLog: BattleLog | null = null;
      try {
        parsedBattleLog = JSON.parse(latestMatch.battleLog);
      } catch (e) {
        console.error("Failed to parse battleLog:", e);
      }

      currentMatchData = {
        matchId: latestMatch.id,
        weekNumber: latestMatch.week.weekNumber,
        weekTitle: latestMatch.week.title,
        isSettled: latestMatch.week.isSettled,
        battleLog: parsedBattleLog,
        isPlayerA,
        opponentName,
        opponentAvatar,
        result,
      };
    }

    // 3. 取得學生個人歷史週考成績 (不含他人成績，確保隱私隔離)
    const historyExamScores = await prisma.examScore.findMany({
      where: { studentId: student.id },
      include: {
        week: true,
      },
      orderBy: { week: { weekNumber: "asc" } },
    });

    // 取得歷史作業紀錄 (用於判斷是否有 Buff)
    const hwRecords = await prisma.homeworkRecord.findMany({
      where: { studentId: student.id },
    });
    const hwMap = new Map<string, boolean>();
    hwRecords.forEach((h) => hwMap.set(h.weekId, h.hasBuff));

    const historyScores = historyExamScores.map((score) => ({
      weekNumber: score.week.weekNumber,
      weekTitle: score.week.title,
      rawScore: score.rawScore,
      effectivePower: score.effectivePower,
      hasBuff: hwMap.get(score.weekId) ?? true,
    }));

    // 4. 計算勝率
    const totalMatches = student.wins + student.losses + student.draws;
    const winRate = totalMatches > 0 ? Math.round((student.wins / totalMatches) * 1000) / 10 : 0;

    // 5. 取得本週最新週次與作業任務狀態
    const latestWeek = await prisma.academicWeek.findFirst({
      orderBy: { weekNumber: "desc" },
    });

    let currentWeekHomework: StudentBattleViewData["currentWeekHomework"] = null;
    if (latestWeek) {
      const currentHw = await prisma.homeworkRecord.findFirst({
        where: {
          weekId: latestWeek.id,
          studentId: student.id,
        },
      });

      const hasBuff = currentHw ? currentHw.hasBuff : true;
      const status = (currentHw?.status as "completed" | "missing" | "partial") || "completed";

      currentWeekHomework = {
        weekNumber: latestWeek.weekNumber,
        unitTitle: latestWeek.title,
        deadlineText: latestWeek.deadline,
        isSettled: latestWeek.isSettled,
        status,
        missingScope: currentHw?.missingScope || null,
        hasBuff,
      };
    }

    const responseData: StudentBattleViewData = {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        name: student.name,
        avatarId: student.avatarId,
        wins: student.wins,
        losses: student.losses,
        draws: student.draws,
      },
      currentMatch: currentMatchData,
      historyScores,
      stats: {
        totalMatches,
        wins: student.wins,
        losses: student.losses,
        draws: student.draws,
        winRate,
      },
      currentWeekHomework,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("GET /api/battle/[studentNumber] error:", error);
    return NextResponse.json({ error: "取得對戰與個人歷史失敗" }, { status: 500 });
  }
}
