import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { pairAndGenerateMatches, StudentInputScore } from "@/lib/battleEngine";

export const dynamic = "force-dynamic";

// 解析文字輸入 (支援「學號 成績」、「學號,成績」或 CSV)
function parseScoresInput(rawText: string): Map<string, number> {
  const result = new Map<string, number>();
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("學號")) continue;

    // 匹配常見分隔符：逗號、Tab、空格、冒號
    const parts = trimmed.split(/[\t,:\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const studentNum = parts[0].trim().toUpperCase();
      const scoreVal = parseFloat(parts[1]);
      if (!isNaN(scoreVal)) {
        result.set(studentNum, scoreVal);
      }
    }
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekId = searchParams.get("weekId");

    let targetWeek = null;
    if (weekId) {
      targetWeek = await prisma.academicWeek.findUnique({ where: { id: weekId } });
    } else {
      targetWeek = await prisma.academicWeek.findFirst({ orderBy: { weekNumber: "desc" } });
    }

    if (!targetWeek) {
      return NextResponse.json({ week: null, students: [], matches: [] });
    }

    const students = await prisma.student.findMany({
      orderBy: { studentNumber: "asc" },
      include: {
        homeworkRecords: {
          where: { weekId: targetWeek.id },
        },
        examScores: {
          where: { weekId: targetWeek.id },
        },
      },
    });

    const matches = await prisma.battleMatch.findMany({
      where: { weekId: targetWeek.id },
      include: {
        playerA: true,
        playerB: true,
        winner: true,
      },
    });

    return NextResponse.json({
      week: targetWeek,
      students: students.map((s) => ({
        id: s.id,
        studentNumber: s.studentNumber,
        name: s.name,
        avatarId: s.avatarId,
        hasBuff: s.homeworkRecords[0]?.hasBuff ?? true,
        homeworkStatus: s.homeworkRecords[0]?.status ?? "completed",
        existingScore: s.examScores[0]?.rawScore ?? null,
        existingPower: s.examScores[0]?.effectivePower ?? null,
      })),
      matches: matches.map((m) => ({
        id: m.id,
        playerA: m.playerA,
        playerB: m.playerB,
        botName: m.botName,
        botPower: m.botPower,
        winner: m.winner,
        isDraw: m.isDraw,
        battleLog: JSON.parse(m.battleLog),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/settle error:", error);
    return NextResponse.json({ error: "取得結算資料失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權操作" }, { status: 401 });
    }

    const body = await req.json();
    const { weekId, scoresText, directScores } = body;

    if (!weekId) {
      return NextResponse.json({ error: "請提供 weekId" }, { status: 400 });
    }

    const week = await prisma.academicWeek.findUnique({
      where: { id: weekId },
    });

    if (!week) {
      return NextResponse.json({ error: "查無此週次" }, { status: 404 });
    }

    // 解析成績
    const scoreMap = new Map<string, number>();
    if (scoresText && typeof scoresText === "string") {
      const parsed = parseScoresInput(scoresText);
      parsed.forEach((val, key) => scoreMap.set(key, val));
    }
    if (Array.isArray(directScores)) {
      for (const item of directScores) {
        if (item.studentNumber && typeof item.rawScore === "number") {
          scoreMap.set(item.studentNumber.toUpperCase(), item.rawScore);
        }
      }
    }

    if (scoreMap.size === 0) {
      return NextResponse.json({ error: "未偵測到任何有效成績，請輸入「學號 成績」" }, { status: 400 });
    }

    // 取得所有學生與當週作業記錄
    const allStudents = await prisma.student.findMany({
      include: {
        homeworkRecords: {
          where: { weekId: week.id },
        },
      },
    });

    // 準備計算輸入清單
    const inputScores: StudentInputScore[] = [];
    const missingInBatch: string[] = [];

    for (const student of allStudents) {
      const sNum = student.studentNumber.toUpperCase();
      if (scoreMap.has(sNum)) {
        const rawScore = scoreMap.get(sNum)!;
        const hwRecord = student.homeworkRecords[0];
        // 作業已完成才有護盾 (+5 分)，缺交或部分完成為 +0
        const hasHomeworkBuff = hwRecord ? hwRecord.hasBuff : true;

        inputScores.push({
          studentNumber: student.studentNumber,
          name: student.name,
          avatarId: student.avatarId,
          studentId: student.id,
          rawScore,
          hasHomeworkBuff,
        });
      } else {
        missingInBatch.push(student.studentNumber);
      }
    }

    if (inputScores.length === 0) {
      return NextResponse.json({ error: "輸入的學號與資料庫學生名單無任何吻合" }, { status: 400 });
    }

    // 執行相近實力配對與戰鬥模擬
    const pairs = pairAndGenerateMatches(inputScores, week.weekNumber, week.title);

    // 資料庫交易寫入：更新成績、儲存對戰記錄、標記已結算
    await prisma.$transaction(async (tx) => {
      // 1. 寫入或更新成績
      for (const item of inputScores) {
        const effectivePower = item.rawScore + (item.hasHomeworkBuff ? 5 : 0);
        await tx.examScore.upsert({
          where: {
            weekId_studentId: {
              weekId: week.id,
              studentId: item.studentId,
            },
          },
          update: {
            rawScore: item.rawScore,
            effectivePower,
          },
          create: {
            weekId: week.id,
            studentId: item.studentId,
            rawScore: item.rawScore,
            effectivePower,
          },
        });
      }

      // 2. 清除該週舊有對局 (避免重複)
      await tx.battleMatch.deleteMany({
        where: { weekId: week.id },
      });

      // 3. 寫入配對與戰果
      for (const pair of pairs) {
        const isBot = pair.playerB.isBot;
        await tx.battleMatch.create({
          data: {
            weekId: week.id,
            playerAId: pair.playerA.id,
            playerBId: isBot ? null : pair.playerB.id,
            botName: isBot ? pair.playerB.name : null,
            botPower: isBot ? pair.playerB.effectivePower : null,
            botAvatar: isBot ? pair.playerB.avatarId : null,
            winnerId: pair.winnerId,
            isDraw: pair.isDraw,
            battleLog: JSON.stringify(pair.battleLog),
          },
        });
      }

      // 4. 標記週次已結算
      await tx.academicWeek.update({
        where: { id: week.id },
        data: { isSettled: true },
      });

      // 5. 重新統計所有學生的勝負平歷史 (全場等冪校準)
      const allMatches = await tx.battleMatch.findMany();
      const statsMap = new Map<string, { wins: number; losses: number; draws: number }>();
      for (const s of allStudents) {
        statsMap.set(s.id, { wins: 0, losses: 0, draws: 0 });
      }

      for (const m of allMatches) {
        const pA = m.playerAId;
        const pB = m.playerBId;

        if (m.isDraw) {
          if (statsMap.has(pA)) statsMap.get(pA)!.draws += 1;
          if (pB && statsMap.has(pB)) statsMap.get(pB)!.draws += 1;
        } else if (m.winnerId) {
          if (m.winnerId === pA) {
            if (statsMap.has(pA)) statsMap.get(pA)!.wins += 1;
            if (pB && statsMap.has(pB)) statsMap.get(pB)!.losses += 1;
          } else if (m.winnerId === pB) {
            if (pB && statsMap.has(pB)) statsMap.get(pB)!.wins += 1;
            if (statsMap.has(pA)) statsMap.get(pA)!.losses += 1;
          }
        }
      }

      for (const [studentId, stats] of statsMap.entries()) {
        await tx.student.update({
          where: { id: studentId },
          data: {
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `結算完成！共配對 ${pairs.length} 組對戰（包含 ${inputScores.length} 位學生成績）`,
      pairsCount: pairs.length,
      studentsCount: inputScores.length,
      pairs: pairs.map((p) => ({
        playerA: p.playerA,
        playerB: p.playerB,
        winner: p.winner,
        summary: p.battleLog.summary,
      })),
    });
  } catch (error: any) {
    console.error("POST /api/admin/settle error:", error);
    return NextResponse.json({ error: "對戰結算失敗: " + (error?.message || "未知錯誤") }, { status: 500 });
  }
}
