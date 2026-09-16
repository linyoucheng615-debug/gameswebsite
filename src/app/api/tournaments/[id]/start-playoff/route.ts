import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generatePlayoffBracket, PlayerRating } from "@/lib/tournament";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "權限不足，僅賽事管理員可啟動複賽" }, { status: 403 });
    }

    const { id } = params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: true },
          orderBy: [
            { currentScore: "desc" },
            { seed: "asc" },
          ],
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    if (tournament.status === "playoff" || tournament.status === "completed") {
      return NextResponse.json({ error: "複賽已啟動或賽事已完結" }, { status: 400 });
    }

    const topCut = tournament.topCut || 4;
    if (tournament.participants.length < topCut) {
      return NextResponse.json(
        { error: `參賽選手不足 ${topCut} 人，無法啟動 Top ${topCut} 複賽` },
        { status: 400 }
      );
    }

    // 依初賽積分排序後的參賽名單
    const standings: PlayerRating[] = tournament.participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      nickname: p.user.nickname,
      score: p.currentScore,
      seed: p.seed,
    }));

    // 生成複賽晉級樹
    const { pairings, qualifiedPlayers } = generatePlayoffBracket(standings, topCut);
    const totalPlayoffRounds = Math.log2(topCut);

    await prisma.$transaction(async (tx) => {
      // 建立複賽第 1 輪對局
      for (const pair of pairings) {
        const isBye = pair.player2Id === null;
        await tx.match.create({
          data: {
            tournamentId: id,
            round: 1,
            stage: "playoff",
            bracketPosition: pair.bracketPosition,
            player1Id: pair.player1Id,
            player2Id: pair.player2Id,
            player1Result: isBye ? "win" : null,
            status: isBye ? "finished" : "pending",
            reportedBy: isBye ? user.id : null,
            reportedAt: isBye ? new Date() : null,
          },
        });
      }

      // 建立複賽後續輪次空節點
      let currentMatchesCount = pairings.length;
      for (let r = 2; r <= totalPlayoffRounds; r++) {
        currentMatchesCount = Math.ceil(currentMatchesCount / 2);
        for (let pos = 1; pos <= currentMatchesCount; pos++) {
          await tx.match.create({
            data: {
              tournamentId: id,
              round: r,
              stage: "playoff",
              bracketPosition: pos,
              player1Id: qualifiedPlayers[0].userId, // 占位外鍵
              player2Id: null,
              status: "pending",
            },
          });
        }
      }

      await tx.tournament.update({
        where: { id },
        data: {
          status: "playoff",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `成功擷取前 ${topCut} 名選手進入單敗淘汰複賽！`,
      qualifiedPlayers: qualifiedPlayers.map((p) => p.nickname),
    });
  } catch (error) {
    console.error("Start playoff error:", error);
    return NextResponse.json({ error: "啟動複賽失敗，請稍後再試" }, { status: 500 });
  }
}

