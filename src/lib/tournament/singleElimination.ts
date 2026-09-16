import { PlayerRating, MatchPairing } from "./types";

/**
 * 依種子順序生成單淘汰對局樹 (Single Elimination Bracket)
 * 經典排列保證種子 1 與種子 2 僅能在最終決賽碰頭
 */
export function generateEliminationBracket(
  players: PlayerRating[],
  stage: "preliminary" | "playoff" = "preliminary"
): { pairings: MatchPairing[]; totalRounds: number } {
  const n = players.length;
  if (n < 2) {
    throw new Error("淘汰賽選手至少需 2 人");
  }

  // 1. 計算晉級樹規模 (取大於等於 n 的最小 2 次方數)
  let bracketSize = 2;
  while (bracketSize < n) {
    bracketSize *= 2;
  }

  const totalRounds = Math.log2(bracketSize);

  // 2. 依照標準種子對戰順序生成第一輪配對種子序
  const seedPairs = getSeedOrder(bracketSize);

  // 3. 將選手按種子排序 (seed 1 最前)
  const sortedPlayers = [...players].sort((a, b) => a.seed - b.seed);
  const playerMap = new Map<number, PlayerRating>();
  sortedPlayers.forEach((p, idx) => {
    playerMap.set(idx + 1, p);
  });

  const pairings: MatchPairing[] = [];

  // 生成第一輪場次 (Round 1)
  for (let matchIndex = 0; matchIndex < seedPairs.length; matchIndex++) {
    const [seedA, seedB] = seedPairs[matchIndex];
    const p1 = playerMap.get(seedA) || null;
    const p2 = playerMap.get(seedB) || null;

    if (p1) {
      pairings.push({
        player1Id: p1.userId,
        player2Id: p2 ? p2.userId : null, // 若未滿人則為 BYE
        round: 1,
        stage: stage,
        bracketPosition: matchIndex + 1,
      });
    }
  }

  return { pairings, totalRounds };
}

/**
 * 遞迴生成標準對稱種子排列 (例如 8 人: [1,8], [4,5], [2,7], [3,6])
 */
function getSeedOrder(size: number): [number, number][] {
  let seeds = [1, 2];

  while (seeds.length < size) {
    const nextSeeds: number[] = [];
    const currentMax = seeds.length * 2 + 1;

    for (const s of seeds) {
      nextSeeds.push(s);
      nextSeeds.push(currentMax - s);
    }
    seeds = nextSeeds;
  }

  const pairs: [number, number][] = [];
  for (let i = 0; i < seeds.length; i += 2) {
    pairs.push([seeds[i], seeds[i + 1]]);
  }

  return pairs;
}

/**
 * 計算淘汰賽下一輪配對節點
 * round r 的 position p，晉級到 round r + 1 的 position ceil(p / 2)
 * p 為奇數時進入 player1，p 為偶數時進入 player2
 */
export function getNextBracketSlot(currentRound: number, currentPosition: number) {
  return {
    nextRound: currentRound + 1,
    nextPosition: Math.ceil(currentPosition / 2),
    slot: currentPosition % 2 === 1 ? "player1" : "player2",
  };
}

