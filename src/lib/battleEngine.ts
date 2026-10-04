import { ChipCode, FighterState, RoundAction, BattleLogData } from "@/types/battle";
import { TACTICAL_CHIPS } from "@/lib/chips";

export interface StudentInputScore {
  studentNumber: string;
  name: string;
  gender: "BOY" | "GIRL";
  studentId: string;
  chineseScore: number;
  englishScore: number;
  mathScore: number;
  averageScore: number;
  previousAverage: number;
  hasHomeworkCompleted: boolean;
  hasCompletedAnyQuest: boolean;
  equippedChip?: ChipCode;
  isExcused?: boolean; // 請假備戰中
}

export interface MatchedPair {
  player1: any;
  player2: any;
  winner: "P1" | "P2" | "DRAW";
  winnerId: string | null;
  isDraw: boolean;
  battleLog: BattleLogData;
}

/**
 * 計算陣列中位數 (Median)
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 75;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

/**
 * 30 秒 4 階段學力推演結算生成器 (Version 2.0 / 方案 A 英文開局先手壓制)
 */
export function generate30sBattleLog(
  p1: StudentInputScore,
  p2: StudentInputScore,
  weekNumber: number,
  weekTitle: string
): BattleLogData {
  const initialHp1 = Math.min(100, Math.max(35, Math.round(p1.averageScore || 75)));
  const initialHp2 = Math.min(100, Math.max(35, Math.round(p2.averageScore || 75)));

  const chip1 = (p1.equippedChip as ChipCode) || (p1.hasCompletedAnyQuest ? "ADVERSITY_SHATTER" : p1.hasHomeworkCompleted ? "GUARDIAN_BASTION" : "SELF_TRANSCENDENCE");
  const chip2 = (p2.equippedChip as ChipCode) || (p2.hasCompletedAnyQuest ? "ADVERSITY_SHATTER" : p2.hasHomeworkCompleted ? "GUARDIAN_BASTION" : "SELF_TRANSCENDENCE");

  const metaChip1 = TACTICAL_CHIPS[chip1] || TACTICAL_CHIPS.ADVERSITY_SHATTER;
  const metaChip2 = TACTICAL_CHIPS[chip2] || TACTICAL_CHIPS.GUARDIAN_BASTION;

  // =========================================================================
  // 方案 A 核心：英文晶片開局先手壓制 (Pre-battle Debuff)
  // 若有玩家裝備 ENGLISH_STORM，開局第 2 秒搶先射出風暴光矢，對手被掛上 WEAKENED (ATK -20%)
  // =========================================================================
  const p1HasEnglishStorm = chip1 === "ENGLISH_STORM" && (p1.englishScore >= 85 || (p1 as any).isEnglishTop15);
  const p2HasEnglishStorm = chip2 === "ENGLISH_STORM" && (p2.englishScore >= 85 || (p2 as any).isEnglishTop15);

  let p1Weakened = false;
  let p2Weakened = false;
  let stormTriggeredBy: string | undefined = undefined;

  if (p1HasEnglishStorm && !p2HasEnglishStorm) {
    p2Weakened = true;
    stormTriggeredBy = p1.studentId;
  } else if (p2HasEnglishStorm && !p1HasEnglishStorm) {
    p1Weakened = true;
    stormTriggeredBy = p2.studentId;
  } else if (p1HasEnglishStorm && p2HasEnglishStorm) {
    // 雙方英文晶片互轟抵消或皆受影響
    p1Weakened = true;
    p2Weakened = true;
    stormTriggeredBy = "BOTH";
  }

  // 攻擊削弱倍率 (若被 WEAKENED 則 ATK -20%，即乘上 0.8)
  const p1AtkMult = p1Weakened ? 0.8 : 1.0;
  const p2AtkMult = p2Weakened ? 0.8 : 1.0;

  const rounds: RoundAction[] = [];

  // =========================================================================
  // Round 1 (05s ~ 13s)：元素普攻交鋒 (數學較高者先攻)
  // =========================================================================
  const p1StartsFirst = (p1.mathScore || 0) >= (p2.mathScore || 0);

  // P1 基礎普攻傷害 (12~18)
  let p1BaseDmg = Math.round((14 + Math.round((p1.averageScore - p2.averageScore) * 0.08)) * p1AtkMult);
  p1BaseDmg = Math.max(7, Math.min(22, p1BaseDmg));

  // P2 基礎普攻傷害 (12~18)
  let p2BaseDmg = Math.round((14 + Math.round((p2.averageScore - p1.averageScore) * 0.08)) * p2AtkMult);
  p2BaseDmg = Math.max(7, Math.min(22, p2BaseDmg));

  if (p1StartsFirst) {
    // P1 先攻
    rounds.push({
      round: 1,
      attackerId: p1.studentId,
      targetId: p2.studentId,
      actionType: "NORMAL_ATTACK",
      damage: p1BaseDmg,
      floatingText: p1Weakened ? `WEAKENED! -${p1BaseDmg}` : `-${p1BaseDmg}`,
    });
    // P2 後攻反擊
    rounds.push({
      round: 1,
      attackerId: p2.studentId,
      targetId: p1.studentId,
      actionType: "NORMAL_ATTACK",
      damage: p2BaseDmg,
      floatingText: p2Weakened ? `WEAKENED! -${p2BaseDmg}` : `-${p2BaseDmg}`,
    });
  } else {
    // P2 先攻
    rounds.push({
      round: 1,
      attackerId: p2.studentId,
      targetId: p1.studentId,
      actionType: "NORMAL_ATTACK",
      damage: p2BaseDmg,
      floatingText: p2Weakened ? `WEAKENED! -${p2BaseDmg}` : `-${p2BaseDmg}`,
    });
    // P1 後攻反擊
    rounds.push({
      round: 1,
      attackerId: p1.studentId,
      targetId: p2.studentId,
      actionType: "NORMAL_ATTACK",
      damage: p1BaseDmg,
      floatingText: p1Weakened ? `WEAKENED! -${p1BaseDmg}` : `-${p1BaseDmg}`,
    });
  }

  // =========================================================================
  // Round 2 (13s ~ 21s)：作業護盾與晶片交互克制檢驗
  // =========================================================================
  let p1AtkR2 = Math.round(20 * p1AtkMult);
  let p2AtkR2 = Math.round(20 * p2AtkMult);

  let p1Pierced = false;
  let p2Pierced = false;
  let p1Reflected = false;
  let p2Reflected = false;

  // 1. P1 攻擊 P2：
  // 檢驗 P1 晶片是否為 MATH_VOID 穿透
  if (chip1 === "MATH_VOID") {
    p1Pierced = true;
    // 無視對手防禦
  } else if (chip2 === "GUARDIAN_BASTION" && p2.hasHomeworkCompleted) {
    // P2 守護壁壘：玄武巨盾 (減傷 50% 並反彈 20%)
    p1AtkR2 = Math.round(p1AtkR2 * 0.5);
    p2Reflected = true;
  } else if (p2.hasHomeworkCompleted) {
    // 基礎作業護盾：減傷 15%
    p1AtkR2 = Math.round(p1AtkR2 * 0.85);
  }

  // 2. P2 攻擊 P1：
  if (chip2 === "MATH_VOID") {
    p2Pierced = true;
  } else if (chip1 === "GUARDIAN_BASTION" && p1.hasHomeworkCompleted) {
    p2AtkR2 = Math.round(p2AtkR2 * 0.5);
    p1Reflected = true;
  } else if (p1.hasHomeworkCompleted) {
    p2AtkR2 = Math.round(p2AtkR2 * 0.85);
  }

  // 執行反彈傷害
  const reflectDmgToP1 = p2Reflected ? Math.round(p1AtkR2 * 0.2) + 6 : 0;
  const reflectDmgToP2 = p1Reflected ? Math.round(p2AtkR2 * 0.2) + 6 : 0;

  rounds.push({
    round: 2,
    attackerId: p1.studentId,
    targetId: p2.studentId,
    actionType: "SHIELD_CHECK",
    damage: p1AtkR2,
    isPierced: p1Pierced,
    isReflected: p2Reflected,
    floatingText: p1Pierced
      ? `PIERCE! -${p1AtkR2}`
      : p2Reflected
      ? `REFLECT! 減傷 -${p1AtkR2}`
      : p2.hasHomeworkCompleted
      ? `GUARD! -${p1AtkR2}`
      : `-${p1AtkR2}`,
  });

  rounds.push({
    round: 2,
    attackerId: p2.studentId,
    targetId: p1.studentId,
    actionType: "SHIELD_CHECK",
    damage: p2AtkR2,
    isPierced: p2Pierced,
    isReflected: p1Reflected,
    floatingText: p2Pierced
      ? `PIERCE! -${p2AtkR2}`
      : p1Reflected
      ? `REFLECT! 減傷 -${p2AtkR2}`
      : p1.hasHomeworkCompleted
      ? `GUARD! -${p2AtkR2}`
      : `-${p2AtkR2}`,
  });

  // =========================================================================
  // Round 3 (21s ~ 27s)：終局晶片大招對轟 (Super Flash & Ultimates)
  // =========================================================================
  let p1UltDmg = Math.round(26 * p1AtkMult);
  let p2UltDmg = Math.round(26 * p2AtkMult);
  let p1Crit = false;
  let p2Crit = false;
  let healP1 = 0;
  let healP2 = 0;

  // 晶片 1 大招計算
  if (chip1 === "ADVERSITY_SHATTER" && p1.averageScore < p2.averageScore) {
    p1UltDmg = Math.round(38 * 1.35 * p1AtkMult); // +35% 逆境超量暴擊
    p1Crit = true;
  } else if (chip1 === "SELF_TRANSCENDENCE" && p1.averageScore > p1.previousAverage) {
    p1UltDmg = Math.round(44 * p1AtkMult);
    p1Crit = true;
  } else if (chip1 === "MATH_VOID") {
    p1UltDmg = Math.round(42 * p1AtkMult);
    p1Crit = true;
  } else if (chip1 === "ENGLISH_STORM") {
    p1UltDmg = Math.round(40 * p1AtkMult);
    p1Crit = true;
  } else if (chip1 === "CHINESE_INK") {
    p1UltDmg = Math.round(36 * p1AtkMult);
    healP1 = Math.round(p1UltDmg * 0.3);
  }

  // 晶片 2 大招計算
  if (chip2 === "ADVERSITY_SHATTER" && p2.averageScore < p1.averageScore) {
    p2UltDmg = Math.round(38 * 1.35 * p2AtkMult);
    p2Crit = true;
  } else if (chip2 === "SELF_TRANSCENDENCE" && p2.averageScore > p2.previousAverage) {
    p2UltDmg = Math.round(44 * p2AtkMult);
    p2Crit = true;
  } else if (chip2 === "MATH_VOID") {
    p2UltDmg = Math.round(42 * p2AtkMult);
    p2Crit = true;
  } else if (chip2 === "ENGLISH_STORM") {
    p2UltDmg = Math.round(40 * p2AtkMult);
    p2Crit = true;
  } else if (chip2 === "CHINESE_INK") {
    p2UltDmg = Math.round(36 * p2AtkMult);
    healP2 = Math.round(p2UltDmg * 0.3);
  }

  rounds.push({
    round: 3,
    attackerId: p1.studentId,
    targetId: p2.studentId,
    actionType: "CHIP_ULTIMATE",
    damage: p1UltDmg,
    isCritical: p1Crit,
    bannerText: `【${metaChip1.name}】奧義引爆！`,
    floatingText: p1Crit ? `CRITICAL! -${p1UltDmg}` : `-${p1UltDmg}`,
  });

  rounds.push({
    round: 3,
    attackerId: p2.studentId,
    targetId: p1.studentId,
    actionType: "CHIP_ULTIMATE",
    damage: p2UltDmg,
    isCritical: p2Crit,
    bannerText: `【${metaChip2.name}】奧義引爆！`,
    floatingText: p2Crit ? `CRITICAL! -${p2UltDmg}` : `-${p2UltDmg}`,
  });

  // 計算最終生命值
  const totalDmgToP1 = p2BaseDmg + p2AtkR2 + reflectDmgToP1 + p2UltDmg;
  const totalDmgToP2 = p1BaseDmg + p1AtkR2 + reflectDmgToP2 + p1UltDmg;

  const finalHp1 = Math.max(0, initialHp1 - totalDmgToP1 + healP1);
  const finalHp2 = Math.max(0, initialHp2 - totalDmgToP2 + healP2);

  let winnerId: string | null = null;
  let winnerCode: "P1" | "P2" | "DRAW" = "DRAW";
  let isDraw = false;

  if (finalHp1 > finalHp2) {
    winnerId = p1.studentId;
    winnerCode = "P1";
  } else if (finalHp2 > finalHp1) {
    winnerId = p2.studentId;
    winnerCode = "P2";
  } else {
    isDraw = true;
    winnerCode = "DRAW";
  }

  // =========================================================================
  // Round 4：因果分析報告 (resultAnalysis)
  // =========================================================================
  let keyFactor = "實力相近，平分秋色";
  let summary = "雙方在三回合推演中攻防平衡，各展所長。";
  let reason1 = "";
  let reason2 = "";

  if (winnerCode === "P1") {
    if (p1HasEnglishStorm && p2Weakened) {
      keyFactor = "英文風暴開局壓制";
      summary = `【${p1.name}】開局發動【律動疾風矢】搶先壓制，使【${p2.name}】全場攻擊削弱 20%，奠定最終血量優勢！`;
    } else if (chip1 === "ADVERSITY_SHATTER" && p1.averageScore < p2.averageScore) {
      keyFactor = "逆境破甲翻盤暴擊";
      summary = `【${p1.name}】雖然週考均分落後，但憑藉自主修練解鎖【逆境破甲焰】，在第三回合爆發 +35% 超量傷害強勢逆轉！`;
    } else if (chip1 === "GUARDIAN_BASTION" && p1.hasHomeworkCompleted) {
      keyFactor = "守護壁壘鐵壁防守";
      summary = `【${p1.name}】作業準時全勤啟動【守護壁壘】，成功吸收 50% 傷害並觸發 20% 反彈，瓦解對手攻勢！`;
    } else if (p1Pierced) {
      keyFactor = "幾何穿透無視防禦";
      summary = `【${p1.name}】發動【幾何湮滅陣】貫穿對手防護盾，打出致命真實傷害奪勝！`;
    } else {
      keyFactor = "學力厚積與作業優勢";
      summary = `【${p1.name}】憑藉扎實的卷面平均分與作業防護盾，在三回合攻防中穩定勝出！`;
    }
    reason1 = summary;
    reason2 = p2Weakened
      ? "開局受到對手英文風暴壓制削弱 20% 攻擊力，後續輸出不足惜敗。"
      : p2.hasHomeworkCompleted
      ? "雖有作業護盾，但在第三回合大招對轟中承受超量傷害惜敗。"
      : "作業缺交失去減傷護盾庇護，未能抵擋對手大招擊破。";
  } else if (winnerCode === "P2") {
    if (p2HasEnglishStorm && p1Weakened) {
      keyFactor = "英文風暴開局壓制";
      summary = `【${p2.name}】開局發動【律動疾風矢】搶先壓制，使【${p1.name}】全場攻擊削弱 20%，奠定最終血量優勢！`;
    } else if (chip2 === "ADVERSITY_SHATTER" && p2.averageScore < p1.averageScore) {
      keyFactor = "逆境破甲翻盤暴擊";
      summary = `【${p2.name}】雖然週考均分落後，但憑藉自主修練解鎖【逆境破甲焰】，在第三回合爆發 +35% 超量傷害強勢逆轉！`;
    } else if (chip2 === "GUARDIAN_BASTION" && p2.hasHomeworkCompleted) {
      keyFactor = "守護壁壘鐵壁防守";
      summary = `【${p2.name}】作業準時全勤啟動【守護壁壘】，成功吸收 50% 傷害並觸發 20% 反彈，瓦解對手攻勢！`;
    } else {
      keyFactor = "晶片大招爆發奪勝";
      summary = `【${p2.name}】在第三回合釋放【${metaChip2.name}】專屬奧義，成功拉開血量差距奪勝！`;
    }
    reason2 = summary;
    reason1 = p1Weakened
      ? "開局受到對手英文風暴壓制削弱 20% 攻擊力，後續輸出不足惜敗。"
      : p1.hasHomeworkCompleted
      ? "雖有作業護盾，但在第三回合大招對轟中承受超量傷害惜敗。"
      : "作業缺交失去減傷護盾庇護，未能抵擋對手大招擊破。";
  } else {
    reason1 = "雙方戰力旗鼓相當，三回合平分秋色。";
    reason2 = "雙方戰力旗鼓相當，三回合平分秋色。";
  }

  const fighterA: FighterState = {
    id: p1.studentId,
    name: p1.name,
    studentNumber: p1.studentNumber,
    gender: p1.gender,
    initialHp: initialHp1,
    currentHp: finalHp1,
    hasHomeworkShield: p1.hasHomeworkCompleted,
    equippedChip: chip1,
    isWeakened: p1Weakened,
    isShadowCoach: p1.studentNumber === "COACH_NPC",
    bannerColor: metaChip1.bannerColor,
    chipName: metaChip1.name,
  };

  const fighterB: FighterState = {
    id: p2.studentId,
    name: p2.name,
    studentNumber: p2.studentNumber,
    gender: p2.gender,
    initialHp: initialHp2,
    currentHp: finalHp2,
    hasHomeworkShield: p2.hasHomeworkCompleted,
    equippedChip: chip2,
    isWeakened: p2Weakened,
    isShadowCoach: p2.studentNumber === "COACH_NPC",
    bannerColor: metaChip2.bannerColor,
    chipName: metaChip2.name,
  };

  return {
    version: "2.0",
    weekNumber,
    weekTitle,
    fighterA,
    fighterB,
    preBattleDebuffs: {
      englishStormTriggeredBy: stormTriggeredBy,
    },
    rounds,
    winnerId,
    isDraw,
    resultAnalysis: {
      keyFactor,
      summary,
    },
    // 兼容舊版結構
    player1: fighterA,
    player2: fighterB,
    winner: winnerCode,
    winnerName: winnerCode === "P1" ? p1.name : winnerCode === "P2" ? p2.name : "平局",
    causalityAnalysis: {
      reasonForP1: reason1,
      reasonForP2: reason2,
    },
  };
}

/**
 * 智慧配對服務 (邊界處理：請假缺考排除、冷卻排程避免重複交手、奇數班級守護教練補位)
 */
export function pairAndGenerate30sMatches(
  inputs: StudentInputScore[],
  weekNumber: number,
  weekTitle: string,
  historyPairs?: Array<{ player1Id: string; player2Id: string; weekNumber: number }>
): MatchedPair[] {
  // 1. 排除請假缺席學生 (isExcused)
  const activeFighters = inputs.filter((s) => !s.isExcused && s.studentNumber !== "COACH_NPC");

  // 若有效學生為 0，直接回傳空陣列
  if (activeFighters.length === 0) return [];

  // 2. 依「三科平均成績」由高至低進行實力排序
  activeFighters.sort((a, b) => b.averageScore - a.averageScore);

  // 3. 奇數人數時：自動由「班級守護教練 (COACH_NPC)」補位
  if (activeFighters.length % 2 !== 0) {
    const medScore = calculateMedian(activeFighters.map((f) => f.averageScore));
    activeFighters.push({
      studentNumber: "COACH_NPC",
      name: "班級守護教練",
      gender: "BOY",
      studentId: "coach_npc_id",
      chineseScore: medScore,
      englishScore: medScore,
      mathScore: medScore,
      averageScore: medScore,
      previousAverage: medScore,
      hasHomeworkCompleted: true, // 自帶基礎護盾
      hasCompletedAnyQuest: false,
      equippedChip: "GUARDIAN_BASTION",
    });
  }

  // 4. 配對演算法：搜尋平均分差距 ±5 分內的候選池，並優先避開過去 2 週曾交手的對象
  const used = new Set<string>();
  const pairs: MatchedPair[] = [];

  // 建立歷史交手查表 (紀錄過去對戰過的最短週次間隔)
  const recentOpponentMap = new Map<string, Set<string>>();
  if (historyPairs && historyPairs.length > 0) {
    for (const h of historyPairs) {
      if (weekNumber - h.weekNumber <= 2) {
        if (!recentOpponentMap.has(h.player1Id)) recentOpponentMap.set(h.player1Id, new Set());
        if (!recentOpponentMap.has(h.player2Id)) recentOpponentMap.set(h.player2Id, new Set());
        recentOpponentMap.get(h.player1Id)!.add(h.player2Id);
        recentOpponentMap.get(h.player2Id)!.add(h.player1Id);
      }
    }
  }

  for (let i = 0; i < activeFighters.length; i++) {
    const f1 = activeFighters[i];
    if (used.has(f1.studentId)) continue;

    used.add(f1.studentId);

    // 尋找最佳對手 f2
    let bestOpponent: StudentInputScore | null = null;
    let bestOpponentIndex = -1;

    // 優先在剩餘未配對者中尋找分數差距最接近且最近未交手者
    let minScoreDiff = Infinity;
    let fallbackOpponent: StudentInputScore | null = null;
    let fallbackIndex = -1;

    for (let j = i + 1; j < activeFighters.length; j++) {
      const f2 = activeFighters[j];
      if (used.has(f2.studentId)) continue;

      const diff = Math.abs(f1.averageScore - f2.averageScore);
      const hasRecentBattle = recentOpponentMap.get(f1.studentId)?.has(f2.studentId);

      // 第一優先：近兩週未曾交手
      if (!hasRecentBattle) {
        if (diff < minScoreDiff) {
          minScoreDiff = diff;
          bestOpponent = f2;
          bestOpponentIndex = j;
        }
      }

      // 備選：若所有人都曾交手，選分差最小者
      if (!fallbackOpponent || diff < Math.abs(f1.averageScore - fallbackOpponent.averageScore)) {
        fallbackOpponent = f2;
        fallbackIndex = j;
      }
    }

    const chosen = bestOpponent || fallbackOpponent;
    const chosenIndex = bestOpponent ? bestOpponentIndex : fallbackIndex;

    if (chosen) {
      used.add(chosen.studentId);
      const battleLog = generate30sBattleLog(f1, chosen, weekNumber, weekTitle);
      const winner = battleLog.winner || "DRAW";
      const winnerId = winner === "P1" ? f1.studentId : winner === "P2" ? chosen.studentId : null;

      pairs.push({
        player1: f1,
        player2: chosen,
        winner,
        winnerId,
        isDraw: winner === "DRAW",
        battleLog,
      });
    }
  }

  return pairs;
}

