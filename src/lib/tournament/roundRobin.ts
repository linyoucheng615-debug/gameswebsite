import { PlayerRating, MatchPairing } from "./types";

/**
 * 將選手分組 (支援 S 型蛇形平衡分組 Snake Seeding)
 */
export function assignGroups(
  players: PlayerRating[],
  groupCount: number
): { groupName: string; players: PlayerRating[] }[] {
  if (groupCount <= 0) throw new Error("分組數必須大於 0");
  
  const groups: { groupName: string; players: PlayerRating[] }[] = [];
  for (let i = 0; i < groupCount; i++) {
    const charCode = 65 + i; // 'A', 'B', 'C', ...
    groups.push({
      groupName: `Group ${String.fromCharCode(charCode)}`,
      players: [],
    });
  }

  // 按種子序由高至低排序 (seed 1 最強)
  const sorted = [...players].sort((a, b) => a.seed - b.seed);

  // 蛇形分配 (Snake Seeding)
  let forward = true;
  let groupIndex = 0;

  for (const player of sorted) {
    groups[groupIndex].players.push(player);

    if (forward) {
      if (groupIndex === groupCount - 1) {
        forward = false;
      } else {
        groupIndex++;
      }
    } else {
      if (groupIndex === 0) {
        forward = true;
      } else {
        groupIndex--;
      }
    }
  }

  return groups;
}

/**
 * 圓盤輪轉法 (Circle / Polygon Method) 生成單循環對局排程
 */
export function generateRoundRobinSchedule(
  players: PlayerRating[],
  groupName: string
): MatchPairing[] {
  if (players.length < 2) return [];

  const pairings: MatchPairing[] = [];
  const list: (PlayerRating | null)[] = [...players];

  // 奇數補虛擬空位 (代表輪空 BYE)
  if (list.length % 2 !== 0) {
    list.push(null);
  }

  const numPlayers = list.length;
  const numRounds = numPlayers - 1;
  const matchesPerRound = numPlayers / 2;

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = list[i];
      const p2 = list[numPlayers - 1 - i];

      if (p1 !== null && p2 !== null) {
        // 輪流調換黑白方（交替主客場）
        const isAlternate = (round + i) % 2 === 0;
        pairings.push({
          player1Id: isAlternate ? p1.userId : p2.userId,
          player2Id: isAlternate ? p2.userId : p1.userId,
          round: round,
          stage: "preliminary",
          groupName: groupName,
        });
      } else if (p1 !== null && p2 === null) {
        // p1 輪空
        pairings.push({
          player1Id: p1.userId,
          player2Id: null,
          round: round,
          stage: "preliminary",
          groupName: groupName,
        });
      } else if (p1 === null && p2 !== null) {
        // p2 輪空
        pairings.push({
          player1Id: p2.userId,
          player2Id: null,
          round: round,
          stage: "preliminary",
          groupName: groupName,
        });
      }
    }

    // 圓盤輪轉：固定 list[0]，其餘順時針旋轉 1 位
    const fixed = list[0];
    const rest = list.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    list.splice(0, list.length, fixed, ...rest);
  }

  return pairings;
}

