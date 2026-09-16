import prisma from "@/lib/prisma";
import { getNextBracketSlot } from "./singleElimination";
import { MatchResult } from "@/types";

/**
 * 重新計算並同步指定比賽所有選手的累計積分 (Score)
 * 勝 = 1.0, 和 = 0.5, 負 = 0.0, 輪空 (BYE) = 1.0
 */
export async function recalculateTournamentScores(tournamentId: string) {
  // 1. 取得該比賽所有已完成的對局
  const finishedMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: "finished",
    },
  });

  // 2. 統計每位選手的得分
  const scoreMap = new Map<string, number>();

  for (const m of finishedMatches) {
    // 處理輪空場次 (player2Id 為 null，player1 自動得 1 分)
    if (m.player2Id === null) {
      scoreMap.set(m.player1Id, (scoreMap.get(m.player1Id) || 0) + 1.0);
      continue;
    }

    // 處理正常對局
    if (m.player1Result === "win") {
      scoreMap.set(m.player1Id, (scoreMap.get(m.player1Id) || 0) + 1.0);
    } else if (m.player1Result === "draw") {
      scoreMap.set(m.player1Id, (scoreMap.get(m.player1Id) || 0) + 0.5);
    }

    if (m.player2Result === "win") {
      scoreMap.set(m.player2Id, (scoreMap.get(m.player2Id) || 0) + 1.0);
    } else if (m.player2Result === "draw") {
      scoreMap.set(m.player2Id, (scoreMap.get(m.player2Id) || 0) + 0.5);
    }
  }

  // 3. 取得該比賽所有參賽者並批次更新積分
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
  });

  for (const p of participants) {
    const newScore = scoreMap.get(p.userId) || 0.0;
    if (p.currentScore !== newScore) {
      await prisma.tournamentParticipant.update({
        where: { id: p.id },
        data: { currentScore: newScore },
      });
    }
  }
}

/**
 * 若為淘汰賽或複賽階段，當勝負底定時自動將勝者晉級至下一輪
 */
export async function advancePlayoffWinnerIfApplicable(
  matchId: string,
  winnerId: string | null
) {
  if (!winnerId) return;

  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!currentMatch) return;

  const isElimination =
    currentMatch.tournament.format === "single_elimination" ||
    currentMatch.stage === "playoff";

  if (!isElimination || currentMatch.bracketPosition === null) {
    return;
  }

  const { nextRound, nextPosition, slot } = getNextBracketSlot(
    currentMatch.round,
    currentMatch.bracketPosition
  );

  // 尋找下一輪對應的對局節點
  const nextMatch = await prisma.match.findFirst({
    where: {
      tournamentId: currentMatch.tournamentId,
      stage: currentMatch.stage,
      round: nextRound,
      bracketPosition: nextPosition,
    },
  });

  if (nextMatch) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: {
        [slot === "player1" ? "player1Id" : "player2Id"]: winnerId,
      },
    });
  }
}

/**
 * 雙向推導對局結果
 */
export function deriveMatchResults(
  reportingUserId: string,
  player1Id: string,
  player2Id: string | null,
  userReportedResult: "win" | "draw" | "loss"
): { p1Result: MatchResult; p2Result: MatchResult } {
  // 若為輪空對局，player1 必勝
  if (player2Id === null) {
    return { p1Result: "win", p2Result: null };
  }

  if (reportingUserId === player1Id) {
    if (userReportedResult === "win") return { p1Result: "win", p2Result: "loss" };
    if (userReportedResult === "loss") return { p1Result: "loss", p2Result: "win" };
    return { p1Result: "draw", p2Result: "draw" };
  } else {
    // reportingUserId === player2Id
    if (userReportedResult === "win") return { p1Result: "loss", p2Result: "win" };
    if (userReportedResult === "loss") return { p1Result: "win", p2Result: "loss" };
    return { p1Result: "draw", p2Result: "draw" };
  }
}

