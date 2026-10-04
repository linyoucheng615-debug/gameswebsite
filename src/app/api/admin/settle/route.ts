import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { pairAndGenerate30sMatches, StudentInputScore } from "@/lib/battleEngine";
import { ChipId } from "@/lib/chips";

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
        questLogs: {
          where: { weekId: targetWeek.id },
        },
        weeklyLoadouts: {
          where: { weekId: targetWeek.id },
        },
      },
    });

    const matches = await prisma.battleMatch.findMany({
      where: { weekId: targetWeek.id },
      include: {
        player1: true,
        player2: true,
      },
    });

    return NextResponse.json({
      week: targetWeek,
      students: students.map((s) => {
        const scoreRec = s.examScores[0];
        const hwRec = s.homeworkRecords[0];
        const questLog = s.questLogs[0];
        const loadout = s.weeklyLoadouts[0];
        const isHwCompleted = hwRec ? hwRec.status === "COMPLETED" : true;

        return {
          id: s.id,
          studentNumber: s.studentNumber,
          name: s.name,
          gender: s.gender,
          hasBuff: isHwCompleted,
          homeworkStatus: hwRec?.status ?? "COMPLETED",
          chineseScore: scoreRec?.chineseScore ?? null,
          englishScore: scoreRec?.englishScore ?? null,
          mathScore: scoreRec?.mathScore ?? null,
          averageScore: scoreRec?.averageScore ?? null,
          previousAverage: scoreRec?.previousAverage ?? null,
          effectivePower: scoreRec ? scoreRec.averageScore + (isHwCompleted ? 10 : 0) : null,
          hasUnlockedChip: questLog?.hasUnlockedChip ?? false,
          equippedChip: loadout?.equippedChip ?? null,
        };
      }),
      matches: matches.map((m) => {
        let parsedBattleLog = null;
        try {
          parsedBattleLog = JSON.parse(m.battleLog);
        } catch {
          parsedBattleLog = null;
        }

        return {
          id: m.id,
          player1: m.player1,
          player2: m.player2,
          winnerId: m.winnerId,
          isDraw: m.isDraw,
          battleLog: parsedBattleLog,
        };
      }),
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
      return NextResponse.json(
        { error: "未偵測到任何有效成績，請輸入「學號 國文 英文 數學」或「學號 成績」" },
        { status: 400 }
      );
    }

    // 取得所有學生資料、當週作業、自主修練與裝備晶片、以及歷史平均成績
    const allStudents = await prisma.student.findMany({
      include: {
        homeworkRecords: {
          where: { weekId: week.id },
        },
        questLogs: {
          where: { weekId: week.id },
        },
        weeklyLoadouts: {
          where: { weekId: week.id },
        },
        examScores: {
          where: {
            academicWeek: {
              weekNumber: { lt: week.weekNumber },
            },
          },
          orderBy: { academicWeek: { weekNumber: "desc" } },
          take: 3,
        },
      },
    });

    // 確保替身機器人存在於資料庫
    let botSentinel = await prisma.student.findUnique({
      where: { studentNumber: "BOT-999" },
    });
    if (!botSentinel) {
      botSentinel = await prisma.student.create({
        data: {
          studentNumber: "BOT-999",
          name: "守門武士 (替身)",
          gender: "BOY",
        },
      });
    }

    const inputScores: StudentInputScore[] = [];
    const missingInBatch: string[] = [];

    for (const student of allStudents) {
      if (student.studentNumber === "BOT-999") continue;
      const sNum = student.studentNumber.toUpperCase();
      if (scoreMap.has(sNum)) {
        const parsedEntry = scoreMap.get(sNum)!;
        const hwRecord = student.homeworkRecords[0];
        const isHwCompleted = hwRecord ? hwRecord.status === "COMPLETED" : true;

        // 計算過去平均 (最多過去 3 週)
        const prevScores = student.examScores;
        let pastAvg = parsedEntry.average;
        if (prevScores.length > 0) {
          const sum = prevScores.reduce((acc, curr) => acc + curr.averageScore, 0);
          pastAvg = Math.round((sum / prevScores.length) * 10) / 10;
        }

        const questLog = student.questLogs[0];
        const hasCompletedAnyQuest =
          questLog?.hasUnlockedChip ||
          questLog?.completedMath ||
          questLog?.completedChinese ||
          questLog?.completedEnglish ||
          questLog?.completedVocab ||
          false;

        const loadout = student.weeklyLoadouts[0];
        const equippedChip = (loadout?.equippedChip as ChipId) || undefined;

        inputScores.push({
          studentNumber: student.studentNumber,
          name: student.name,
          gender: (student.gender as "BOY" | "GIRL") || "BOY",
          studentId: student.id,
          chineseScore: parsedEntry.chinese,
          englishScore: parsedEntry.english,
          mathScore: parsedEntry.math,
          averageScore: parsedEntry.average,
          previousAverage: pastAvg,
          hasHomeworkCompleted: isHwCompleted,
          hasCompletedAnyQuest,
          equippedChip,
        });
      } else {
        missingInBatch.push(student.studentNumber);
      }
    }

    if (inputScores.length === 0) {
      return NextResponse.json({ error: "輸入的學號與資料庫學生名單無任何吻合" }, { status: 400 });
    }

    // 執行 30 秒學力推演配對與模擬
    const pairs = pairAndGenerate30sMatches(inputScores, week.weekNumber, week.title);

    // 資料庫交易寫入：更新成績、儲存對戰記錄、標記已結算
    await prisma.$transaction(async (tx) => {
      // 1. 寫入或更新成績
      for (const item of inputScores) {
        await tx.examScore.upsert({
          where: {
            studentId_weekId: {
              studentId: item.studentId,
              weekId: week.id,
            },
          },
          update: {
            chineseScore: item.chineseScore,
            englishScore: item.englishScore,
            mathScore: item.mathScore,
            averageScore: item.averageScore,
            previousAverage: item.previousAverage,
          },
          create: {
            studentId: item.studentId,
            weekId: week.id,
            chineseScore: item.chineseScore,
            englishScore: item.englishScore,
            mathScore: item.mathScore,
            averageScore: item.averageScore,
            previousAverage: item.previousAverage,
          },
        });
      }

      // 2. 清除該週舊有對局 (避免重複)
      await tx.battleMatch.deleteMany({
        where: { weekId: week.id },
      });

      // 3. 寫入配對與戰果
      for (const pair of pairs) {
        const p1Id = pair.player1.studentId;
        const p2Id = pair.player2.studentId === "bot_sentinel" ? botSentinel.id : pair.player2.studentId;

        await tx.battleMatch.create({
          data: {
            weekId: week.id,
            player1Id: p1Id,
            player2Id: p2Id,
            winnerId: pair.winnerId === "bot_sentinel" ? botSentinel.id : pair.winnerId,
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
    });

    return NextResponse.json({
      success: true,
      message: `結算完成！共配對 ${pairs.length} 組對戰（包含 ${inputScores.length} 位學生成績）`,
      pairsCount: pairs.length,
      studentsCount: inputScores.length,
      pairs: pairs.map((p) => ({
        player1: p.player1,
        player2: p.player2,
        winner: p.winner,
        battleLog: p.battleLog,
      })),
    });
  } catch (error: any) {
    console.error("POST /api/admin/settle error:", error);
    return NextResponse.json({ error: error.message || "成績結算失敗" }, { status: 500 });
  }
}
