export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  generateSwissPairings,
  assignGroups,
  generateRoundRobinSchedule,
  generateEliminationBracket,
  PlayerRating,
} from "@/lib/tournament";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "權限不足，僅賽事管理員可啟動比賽" }, { status: 403 });
    }

    const { id } = params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    if (tournament.status !== "pending") {
      return NextResponse.json({ error: "賽事已啟動或已結束" }, { status: 400 });
    }

    if (tournament.participants.length < 2) {
      return NextResponse.json({ error: "參賽人數至少需 2 人方可開賽" }, { status: 400 });
    }

    const playerRatings: PlayerRating[] = tournament.participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      nickname: p.user.nickname,
      score: p.currentScore,
      seed: p.seed,
    }));

    if (tournament.format === "swiss") {
      // 瑞士制：生成第一輪配對
      const pairings = generateSwissPairings(playerRatings, [], 1);

      await prisma.$transaction(async (tx) => {
        for (const pair of pairings) {
          const isBye = pair.player2Id === null;
          await tx.match.create({
            data: {
              tournamentId: id,
              round: 1,
              stage: "preliminary",
              player1Id: pair.player1Id,
              player2Id: pair.player2Id,
              // 若首輪即輪空，自動完成判勝得 1 分
              player1Result: isBye ? "win" : null,
              status: isBye ? "finished" : "pending",
              reportedBy: isBye ? user.id : null,
              reportedAt: isBye ? new Date() : null,
            },
          });
        }

        await tx.tournament.update({
          where: { id },
          data: { status: "ongoing", currentRound: 1 },
        });
      });
    } else if (tournament.format === "round_robin") {
      // 小組賽：依人數分組 (8人以上分 2 組，否則 1 組單循環)
      const groupCount = tournament.participants.length >= 8 ? 2 : 1;
      const groups = assignGroups(playerRatings, groupCount);

      await prisma.$transaction(async (tx) => {
        for (const group of groups) {
          // 更新參賽者分組
          for (const p of group.players) {
            await tx.tournamentParticipant.updateMany({
              where: { tournamentId: id, userId: p.userId },
              data: { groupName: group.groupName },
            });
          }

          // 生成該組全部輪次賽程
          const schedule = generateRoundRobinSchedule(group.players, group.groupName);
          for (const match of schedule) {
            const isBye = match.player2Id === null;
            await tx.match.create({
              data: {
                tournamentId: id,
                round: match.round,
                stage: "preliminary",
                groupName: match.groupName,
                player1Id: match.player1Id,
                player2Id: match.player2Id,
                player1Result: isBye ? "win" : null,
                status: isBye ? "finished" : "pending",
                reportedBy: isBye ? user.id : null,
                reportedAt: isBye ? new Date() : null,
              },
            });
          }
        }

        await tx.tournament.update({
          where: { id },
          data: { status: "ongoing", currentRound: 1 },
        });
      });
    } else if (tournament.format === "single_elimination") {
      // 單淘汰賽制
      const { pairings, totalRounds } = generateEliminationBracket(playerRatings, "preliminary");

      await prisma.$transaction(async (tx) => {
        // 建立第 1 輪比賽
        for (const pair of pairings) {
          const isBye = pair.player2Id === null;
          await tx.match.create({
            data: {
              tournamentId: id,
              round: 1,
              stage: "preliminary",
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

        // 建立後續空輪次節點供樹狀圖展示與晉級填入
        let currentMatchesCount = pairings.length;
        for (let r = 2; r <= totalRounds; r++) {
          currentMatchesCount = Math.ceil(currentMatchesCount / 2);
          for (let pos = 1; pos <= currentMatchesCount; pos++) {
            await tx.match.create({
              data: {
                tournamentId: id,
                round: r,
                stage: "preliminary",
                bracketPosition: pos,
                player1Id: tournament.participants[0].userId, // 暫代外鍵約束
                player2Id: null,
                status: "pending",
              },
            });
          }
        }

        await tx.tournament.update({
          where: { id },
          data: {
            status: "ongoing",
            currentRound: 1,
            totalRounds: totalRounds,
          },
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: `賽事已成功啟動！賽制：${tournament.format}，第 1 輪對局已自動生成。`,
    });
  } catch (error) {
    console.error("Start tournament error:", error);
    return NextResponse.json({ error: "啟動賽事失敗，請稍後再試" }, { status: 500 });
  }
}

