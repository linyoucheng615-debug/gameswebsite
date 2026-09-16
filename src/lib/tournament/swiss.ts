import { PlayerRating, MatchPairing, HistoricalMatch } from "./types";

/**
 * 瑞士制配對演算法 (Swiss-System Pairing)
 * 遵循原則：
 * 1. 積分相近配對 (Score groups)
 * 2. 避免重複交手 (No repeat pairings)
 * 3. 奇數人數輪空處理 (BYE assignment - 優先分配給未曾輪空且積分較低者)
 * 4. 回溯機制 (Backtracking) 解決死結 (Float pairing)
 */
export function generateSwissPairings(
  players: PlayerRating[],
  previousMatches: HistoricalMatch[],
  roundNumber: number
): MatchPairing[] {
  if (players.length < 2) {
    throw new Error("參賽選手人數至少需為 2 人以上");
  }

  // 1. 構建歷史對戰黑名單 (查找集合)
  const playedPairs = new Set<string>();
  const playersWithBye = new Set<string>();

  for (const m of previousMatches) {
    if (m.player2Id === null) {
      playersWithBye.add(m.player1Id);
    } else {
      const key1 = `${m.player1Id}_${m.player2Id}`;
      const key2 = `${m.player2Id}_${m.player1Id}`;
      playedPairs.add(key1);
      playedPairs.add(key2);
    }
  }

  const pairings: MatchPairing[] = [];
  const pool = [...players];

  // 2. 奇數人數處理 (分配 BYE)
  if (pool.length % 2 !== 0) {
    // 按積分升序、種子序降序排列（優先選擇排名較後的選手輪空）
    const byeCandidates = [...pool].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.seed - a.seed;
    });

    // 挑選尚未獲得過輪空的選手
    const byePlayer =
      byeCandidates.find((p) => !playersWithBye.has(p.userId)) || byeCandidates[0];

    // 從配對池移除該名選手並生成輪空場次
    const byeIndex = pool.findIndex((p) => p.userId === byePlayer.userId);
    pool.splice(byeIndex, 1);

    pairings.push({
      player1Id: byePlayer.userId,
      player2Id: null, // null 代表輪空 BYE
      round: roundNumber,
      stage: "preliminary",
    });
  }

  // 3. 選手排序（積分高者在前，同分依種子序排序）
  pool.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.seed - b.seed;
  });

  // 4. 回溯配對搜尋 (Backtracking Pairing)
  const matchedPairs: [PlayerRating, PlayerRating][] = [];
  const success = backtrackPairing(pool, playedPairs, matchedPairs);

  if (!success) {
    // 極端情況：所有可能皆有歷史交手（例如輪次已超過理論上限），放寬歷史限制作最近分配對
    console.warn("無法找到完全不重複的配對，啟動備用最近分降級配對");
    matchedPairs.length = 0;
    greedyPairingWithFallback(pool, matchedPairs);
  }

  // 5. 轉換為 MatchPairing
  for (const [p1, p2] of matchedPairs) {
    pairings.push({
      player1Id: p1.userId,
      player2Id: p2.userId,
      round: roundNumber,
      stage: "preliminary",
    });
  }

  return pairings;
}

/**
 * 回溯搜尋有效配對組合
 */
function backtrackPairing(
  remaining: PlayerRating[],
  playedPairs: Set<string>,
  result: [PlayerRating, PlayerRating][]
): boolean {
  if (remaining.length === 0) return true;

  const current = remaining[0];
  const candidates = remaining.slice(1);

  for (let i = 0; i < candidates.length; i++) {
    const opponent = candidates[i];
    const pairKey = `${current.userId}_${opponent.userId}`;

    if (!playedPairs.has(pairKey)) {
      // 嘗試配對
      result.push([current, opponent]);

      const nextRemaining = candidates.filter((_, idx) => idx !== i);
      if (backtrackPairing(nextRemaining, playedPairs, result)) {
        return true;
      }

      // 回溯
      result.pop();
    }
  }

  return false;
}

/**
 * 備用貪心配對（當輪次過多無解時的保護措施）
 */
function greedyPairingWithFallback(
  list: PlayerRating[],
  result: [PlayerRating, PlayerRating][]
) {
  const unused = [...list];
  while (unused.length >= 2) {
    const p1 = unused.shift()!;
    const p2 = unused.shift()!;
    result.push([p1, p2]);
  }
}

