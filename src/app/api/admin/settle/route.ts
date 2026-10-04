import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { pairAndGenerateMatches, StudentInputScore } from "@/lib/battleEngine";

export const dynamic = "force-dynamic";

interface ParsedScoreEntry {
  chinese: number;
  english: number;
  math: number;
  average: number;
}

// 解析文字輸入 (支援「學號 國文 英文 數學」或「學號 成績」或 CSV)
function parseScoresInput(rawText: string): Map<string, ParsedScoreEntry> {
  const result = new Map<string, ParsedScoreEntry>();
  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("學號")) continue;

    // 匹配常見分隔符：逗號、Tab、空格、冒號
    const parts = trimmed.split(/[\t,:\s]+/).filter(Boolean);
    if (parts.length >= 4) {
      // 學號 國 英 數
      const studentNum = parts[0].trim().toUpperCase();
      const c = parseFloat(parts[1]);
      const e = parseFloat(parts[2]);
      const m = parseFloat(parts[3]);
      if (!isNaN(c) && !isNaN(e) && !isNaN(m)) {
        const avg = Math.round(((c + e + m) / 3) * 10) / 10;
        result.set(studentNum, { chinese: c, english: e, math: m, average: avg });
      }
    } else if (parts.length >= 2) {
      // 學號 單一成績 (國英數皆採用此分)
      const studentNum = parts[0].trim().toUpperCase();
      const scoreVal = parseFloat(parts[1]);
      if (!isNaN(scoreVal)) {
        result.set(studentNum, {
          chinese: scoreVal,
          english: scoreVal,
          math: scoreVal,
          average: scoreVal,
        });
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
        challengeAnswers: {
          where: {
            challenge: {
              weekId: targetWeek.id,
            },
          },
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
      students: students.map((s) => {
        const scoreRec = s.examScores[0];
        const answers = s.challengeAnswers || [];
        const allCorrect = answers.length >= 3 && answers.every((a) => a.isCorrect);

        return {
          id: s.id,
          studentNumber: s.studentNumber,
          name: s.name,
          avatarId: s.avatarId,
          hasBuff: s.homeworkRecords[0]?.hasBuff ?? true,
          homeworkStatus: s.homeworkRecords[0]?.status ?? "completed",
          existingScore: scoreRec?.rawScore ?? null,
          chineseScore: scoreRec?.chineseScore ?? null,
          englishScore: scoreRec?.englishScore ?? null,
          mathScore: scoreRec?.mathScore ?? null,
          averageScore: scoreRec?.averageScore ?? null,
          previousAverage: scoreRec?.previousAverage ?? null,
          existingPower: scoreRec?.effectivePower ?? null,
          allChallengesCorrect: allCorrect,
        };
      }),
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
    const scoreMap = new Map<string, ParsedScoreEntry>();
    if (scoresText && typeof scoresText === "string") {
      const parsed = parseScoresInput(scoresText);
      parsed.forEach((val, key) => scoreMap.set(key, val));
    }
    if (Array.isArray(directScores)) {
      for (const item of directScores) {
        if (item.studentNumber) {
          const sNum = item.studentNumber.toUpperCase();
          const c = typeof item.chineseScore === "number" ? item.chineseScore : (item.rawScore ?? 75);
          const e = typeof item.englishScore === "number" ? item.englishScore : (item.rawScore ?? 75);
          const m = typeof item.mathScore === "number" ? item.mathScore : (item.rawScore ?? 75);
          const avg = Math.round(((c + e + m) / 3) * 10) / 10;
          scoreMap.set(sNum, { chinese: c, english: e, math: m, average: avg });
        }
      }
    }

    if (scoreMap.size === 0) {
      return NextResponse.json({ error: "未偵測到任何有效成績，請輸入「學號 國文 英文 數學」或「學號 成績」" }, { status: 400 });
    }

    // 取得所有學生與當週作業記錄、挑戰作答紀錄、以及歷史平均成績
    const allStudents = await prisma.student.findMany({
      include: {
        homeworkRecords: {
          where: { weekId: week.id },
        },
        examScores: {
          where: {
            week: {
              weekNumber: { lt: week.weekNumber },
            },
          },
          orderBy: { week: { weekNumber: "desc" } },
          take: 3,
        },
        challengeAnswers: {
          where: {
            challenge: {
              weekId: week.id,
            },
          },
        },
      },
    });

    // 準備計算輸入清單
    const inputScores: StudentInputScore[] = [];
    const missingInBatch: string[] = [];

    for (const student of allStudents) {
      const sNum = student.studentNumber.toUpperCase();
      if (scoreMap.has(sNum)) {
        const parsedEntry = scoreMap.get(sNum)!;
        const hwRecord = student.homeworkRecords[0];
        // 作業已完成才有護盾 (+10 戰力)
        const hasHomeworkBuff = hwRecord ? hwRecord.hasBuff : true;

        // 計算過去平均 (最多過去 3 週)
        const prevScores = student.examScores;
        let pastAvg = 0;
        if (prevScores.length > 0) {
          const sum = prevScores.reduce((acc, curr) => acc + (curr.averageScore || curr.rawScore), 0);
          pastAvg = Math.round((sum / prevScores.length) * 10) / 10;
        } else {
          pastAvg = parsedEntry.average;
        }

        // 作業三題挑戰是否全對
        const answers = student.challengeAnswers;
        const allCorrect = answers.length >= 3 && answers.every((a) => a.isCorrect);

        inputScores.push({
          studentNumber: student.studentNumber,
          name: student.name,
          avatarId: student.avatarId,
          studentId: student.id,
          rawScore: parsedEntry.average,
          chineseScore: parsedEntry.chinese,
          englishScore: parsedEntry.english,
          mathScore: parsedEntry.math,
          averageScore: parsedEntry.average,
          previousAverage: pastAvg,
          hasHomeworkBuff,
          allChallengesCorrect: allCorrect,
          skin: {
            gender: (student.skinGender as any) || "boy",
            charClass: (student.skinClass as any) || "warrior",
            color: (student.skinColor as any) || "blue",
          },
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
      // 1. 寫入或更新成績 (包含國英數三科成績、平均、進步幅度、有效戰力)
      for (const item of inputScores) {
        // 從 pair 中找到該學生算出的 effectivePower
        const fighter = pairs
          .flatMap((p) => [p.playerA, p.playerB])
          .find((f) => f.id === item.studentId);

        const effPower = fighter ? fighter.effectivePower : item.rawScore;

        await tx.examScore.upsert({
          where: {
            weekId_studentId: {
              weekId: week.id,
              studentId: item.studentId,
            },
          },
          update: {
            rawScore: item.rawScore,
            chineseScore: item.chineseScore ?? item.rawScore,
            englishScore: item.englishScore ?? item.rawScore,
            mathScore: item.mathScore ?? item.rawScore,
            averageScore: item.averageScore ?? item.rawScore,
            previousAverage: item.previousAverage ?? item.rawScore,
            effectivePower: effPower,
          },
          create: {
            weekId: week.id,
            studentId: item.studentId,
            rawScore: item.rawScore,
            chineseScore: item.chineseScore ?? item.rawScore,
            englishScore: item.englishScore ?? item.rawScore,
            mathScore: item.mathScore ?? item.rawScore,
            averageScore: item.averageScore ?? item.rawScore,
            previousAverage: item.previousAverage ?? item.rawScore,
            effectivePower: effPower,
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
    return NextResponse.json({ error: error.message || "成績結算失敗" }, { status: 500 });
  }
}
