import { PlayerRating, MatchPairing } from "./types";
import { generateEliminationBracket } from "./singleElimination";

/**
 * 從初賽積分榜中擷取 Top N 選手，自動排入複賽單敗淘汰 Bracket
 */
export function generatePlayoffBracket(
  standings: PlayerRating[],
  topCut: number
): { pairings: MatchPairing[]; qualifiedPlayers: PlayerRating[] } {
  if (standings.length < topCut) {
    throw new Error(`參賽人數 (${standings.length}) 不足複賽設定人數 (${topCut})`);
  }

  // 1. 取出積分排名前 topCut 位選手
  const qualified = standings.slice(0, topCut).map((player, index) => ({
    ...player,
    seed: index + 1, // 重新指派複賽種子序 (1 ~ topCut)
  }));

  // 2. 生成單淘汰第一輪對局
  const { pairings } = generateEliminationBracket(qualified, "playoff");

  return {
    pairings,
    qualifiedPlayers: qualified,
  };
}

