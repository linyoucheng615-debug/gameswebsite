export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateSwissPairings, PlayerRating, HistoricalMatch } from "@/lib/tournament";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入帳號" }, { status: 401 });
    }

    const { id } = params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: { include: { user: true } },
        matches: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    const isOrganizer = user.role === "admin" || tournament.createdBy === user.id;
    if (!isOrganizer) {
      return NextResponse.json({ error: "權限不足，僅賽事主辦人或管理員可推進輪次" }, { status: 403 });
    }

    if (tournament.status !== "ongoing") {
      return NextResponse.json({ error: "賽事未處於進行中狀態" }, { status: 400 });
    }

    const currentRound = tournament.currentRound;

    // 檢查當前輪次是否全部對局已完成
    const unfinishedMatches = tournament.matches.filter(
      (m) => m.round === currentRound && m.stage === "preliminary" && m.status === "pending"
    );

    if (unfinishedMatches.length > 0) {
      return NextResponse.json(
        {
          error: `第 ${currentRound} 輪尚有 ${unfinishedMatches.length} 場對局未登記結果，請先確認或由管理員覆寫。`,
        },
        { status: 400 }
      );
    }

    if (tournament.format === "swiss") {
      if (currentRound >= tournament.totalRounds) {
        return NextResponse.json(
          {
            error: `已達到瑞士制預設總輪次 (${tournament.totalRounds} 輪)，請啟動複賽或完結賽事。`,
          },
          { status: 400 }
        );
      }

      const nextRoundNumber = currentRound + 1;

      // 準備選手與歷史對戰數據
      const players: PlayerRating[] = tournament.participants.map((p) => ({
        userId: p.userId,
        score: p.currentScore,
        seed: p.seed,
        name: p.user.name,
        nickname: p.user.nickname,
      }));

      const history: HistoricalMatch[] = tournament.matches
        .filter((m) => m.stage === "preliminary")
        .map((m) => ({
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          round: m.round,
          status: m.status,
        }));

      // 生成下一輪配對
      const pairings = generateSwissPairings(players, history, nextRoundNumber);

      await prisma.$transaction(async (tx) => {
        for (const pair of pairings) {
          const isBye = pair.player2Id === null;
          await tx.match.create({
            data: {
              tournamentId: id,
              round: nextRoundNumber,
              stage: "preliminary",
              player1Id: pair.player1Id,
              player2Id: pair.player2Id,
              player1Result: isBye ? "win" : null,
              status: isBye ? "finished" : "pending",
              reportedBy: isBye ? user.id : null,
              reportedAt: isBye ? new Date() : null,
            },
          });
        }

        await tx.tournament.update({
          where: { id },
          data: { currentRound: nextRoundNumber },
        });
      });

      return NextResponse.json({
        success: true,
        message: `成功推進至第 ${nextRoundNumber} 輪，全新配對已生成！`,
      });
    }

    return NextResponse.json({
      error: "此賽制無須手動推進輪次（分組賽已生成完整排程，淘汰賽隨勝負自動晉級）。",
    }, { status: 400 });
  } catch (error) {
    console.error("Next round error:", error);
    return NextResponse.json({ error: "推進輪次失敗，請稍後再試" }, { status: 500 });
  }
}

