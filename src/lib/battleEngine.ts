import { BattleFighter, BattleLog, BattleStep } from "@/types";
import { getAvatarMeta } from "@/lib/avatars";

export interface StudentInputScore {
  studentNumber: string;
  name: string;
  avatarId: string;
  studentId: string;
  rawScore: number;
  chineseScore?: number;
  englishScore?: number;
  mathScore?: number;
  averageScore?: number;
  previousAverage?: number;
  hasHomeworkBuff: boolean; // 作業準時完成 (+10 戰力, 開局 +1 氣)
  allChallengesCorrect?: boolean; // 作業三題挑戰全對 (+15 戰力, 奧義就緒)
  skin?: {
    gender: "boy" | "girl";
    charClass: "warrior" | "mage" | "ranger" | "assassin";
    color: "blue" | "red" | "green" | "purple" | "gold";
  };
}

export interface MatchedPair {
  playerA: BattleFighter;
  playerB: BattleFighter;
  winner: "A" | "B" | "DRAW";
  winnerId: string | null;
  isDraw: boolean;
  battleLog: BattleLog;
}

/**
 * 有效戰力計算公式：
 * 有效戰力 = 三科平均 + (作業準時完成 ? 10 : 0) + (作業三題挑戰全對 ? 15 : 0) + (進步幅度 * 1.5)
 */
export function calculateEffectivePower(
  averageScore: number,
  hasHomeworkBuff: boolean,
  allChallengesCorrect: boolean = false,
  previousAverage: number = 0
): {
  effectivePower: number;
  buff: number;
  challengeBonus: number;
  growthBonus: number;
} {
  const buff = hasHomeworkBuff ? 10 : 0;
  const challengeBonus = allChallengesCorrect ? 15 : 0;
  const improvement = previousAverage > 0 ? Math.max(0, averageScore - previousAverage) : 0;
  const growthBonus = Math.round(improvement * 1.5 * 10) / 10;
  const effectivePower = Math.round((averageScore + buff + challengeBonus + growthBonus) * 10) / 10;

  return {
    effectivePower,
    buff,
    challengeBonus,
    growthBonus,
  };
}

/**
 * 判定學員最高科目與專屬技能
 */
export function getSubjectSkill(
  chinese: number = 70,
  english: number = 70,
  math: number = 70
): {
  highestSubject: "CHINESE" | "ENGLISH" | "MATH";
  skillName: string;
  desc: string;
} {
  if (chinese >= english && chinese >= math) {
    return {
      highestSubject: "CHINESE",
      skillName: "📚 詞藻狂嵐",
      desc: "風暴詞章盤旋呼嘯，狂風席捲削弱對方防禦！",
    };
  } else if (english >= chinese && english >= math) {
    return {
      highestSubject: "ENGLISH",
      skillName: "🔤 語法雷擊",
      desc: "雷霆文法交錯劈裂，連續 3 段電弧無情轟炸！",
    };
  } else {
    return {
      highestSubject: "MATH",
      skillName: "📐 幾何爆破",
      desc: "多邊形矩陣奧義展開，幾何幾何力場引發劇烈震波！",
    };
  }
}

/**
 * 判定是否符合「逆轉奧義」發動資格
 * 條件：
 * 1. 成績進步 (平均 > 過去平均)
 * 2. 作業準時 + 三題挑戰全對
 * 3. 單科滿 90 分以上
 */
export function checkUltimateEligibility(
  averageScore: number,
  previousAverage: number,
  hasHomeworkBuff: boolean,
  allChallengesCorrect: boolean,
  chinese: number,
  english: number,
  math: number
): { hasUltimate: boolean; reason: string } {
  const improvement = previousAverage > 0 ? averageScore - previousAverage : 0;
  if (improvement > 0.5) {
    return {
      hasUltimate: true,
      reason: `本週平均成績進步 +${improvement.toFixed(1)} 分，激發奧義潛能！`,
    };
  }
  if (hasHomeworkBuff && allChallengesCorrect) {
    return {
      hasUltimate: true,
      reason: "作業按時繳交且作業三題挑戰全數答對，解鎖終極奧義！",
    };
  }
  if (chinese >= 90 || english >= 90 || math >= 90) {
    const topSub = chinese >= 90 ? "國文" : english >= 90 ? "英文" : "數學";
    return {
      hasUltimate: true,
      reason: `${topSub}達到 90 分卓越門檻，觸發學霸奧義境界！`,
    };
  }
  return {
    hasUltimate: false,
    reason: "尚未滿足奧義條件（需三科進步、作業+挑戰全對、或單科滿90分）",
  };
}

/**
 * 35 秒 3 回合 16-bit 街機戰鬥計算引擎：
 * Round 1: 基礎交鋒 (5~15s, 依有效戰力差距扣除 15~25 HP)
 * Round 2: 學科絕技 (15~25s, 國英數最高科專屬絕技大招)
 * Round 3: 逆轉奧義 (25~35s, Super Flash 1秒黑屏、金色橫幅、8px 劇烈震動、CRITICAL -50 逆轉暴擊)
 * Finish: 戰果與親師因果分析卡片 (35~40s)
 */
export function generateBattleLog(
  fighterA: BattleFighter,
  fighterB: BattleFighter,
  weekNumber: number,
  weekTitle: string
): BattleLog {
  const metaA = getAvatarMeta(fighterA.avatarId);
  const metaB = getAvatarMeta(fighterB.avatarId);

  const skillA = getSubjectSkill(fighterA.chineseScore, fighterA.englishScore, fighterA.mathScore);
  const skillB = getSubjectSkill(fighterB.chineseScore, fighterB.englishScore, fighterB.mathScore);

  fighterA.highestSubject = skillA.highestSubject;
  fighterA.highestSkillName = skillA.skillName;
  fighterB.highestSubject = skillB.highestSubject;
  fighterB.highestSkillName = skillB.skillName;

  // 基礎 HP (以三科平均成績為準，至少 35，最多 100)
  const initialHpA = Math.min(100, Math.max(35, Math.round(fighterA.averageScore || fighterA.rawScore || 80)));
  const initialHpB = Math.min(100, Math.max(35, Math.round(fighterB.averageScore || fighterB.rawScore || 80)));

  fighterA.initialHp = initialHpA;
  fighterB.initialHp = initialHpB;

  let currentHpA = initialHpA;
  let currentHpB = initialHpB;

  const powerDiff = fighterA.effectivePower - fighterB.effectivePower;

  // --- Round 1: 基礎交鋒 (5~15s) ---
  // 依有效戰力差距扣除 15~25 HP
  let r1_dmgA = 18;
  let r1_dmgB = 18;
  if (powerDiff > 0) {
    r1_dmgB = Math.min(25, 18 + Math.round(powerDiff * 0.4));
    r1_dmgA = Math.max(12, 18 - Math.round(powerDiff * 0.3));
  } else if (powerDiff < 0) {
    r1_dmgA = Math.min(25, 18 + Math.round(Math.abs(powerDiff) * 0.4));
    r1_dmgB = Math.max(12, 18 - Math.round(Math.abs(powerDiff) * 0.3));
  }
  currentHpA = Math.max(10, currentHpA - r1_dmgA);
  currentHpB = Math.max(10, currentHpB - r1_dmgB);

  // --- Round 2: 學科絕技 (15~25s) ---
  // 根據學科最高分施展技能
  const r2_dmgB = Math.min(30, Math.max(15, Math.round((fighterA.rawScore || 75) * 0.28)));
  const r2_dmgA = Math.min(30, Math.max(15, Math.round((fighterB.rawScore || 75) * 0.28)));
  currentHpA = Math.max(5, currentHpA - r2_dmgA);
  currentHpB = Math.max(5, currentHpB - r2_dmgB);

  // --- Round 3: 逆轉奧義 (25~35s) ---
  // 逆轉奧義判定：若弱勢方具有奧義且強勢方無奧義，觸發「逆轉勝」！
  const ultA = fighterA.hasUltimate;
  const ultB = fighterB.hasUltimate;

  let r3_dmgA = 20;
  let r3_dmgB = 20;
  let r3_shake = true;
  let r3_superFlash = ultA || ultB;

  if (ultA && !ultB) {
    // A 施展超必殺奧義，重創 B -50 點
    r3_dmgB = 50;
    r3_dmgA = 10;
  } else if (ultB && !ultA) {
    // B 施展超必殺奧義，重創 A -50 點
    r3_dmgA = 50;
    r3_dmgB = 10;
  } else if (ultA && ultB) {
    // 雙方同時爆發奧義！神仙對決！
    if (fighterA.effectivePower >= fighterB.effectivePower) {
      r3_dmgB = 48;
      r3_dmgA = 42;
    } else {
      r3_dmgA = 48;
      r3_dmgB = 42;
    }
  } else {
    // 雙方無奧義，進行普通搏擊
    if (powerDiff > 0) {
      r3_dmgB = 25;
      r3_dmgA = 15;
    } else if (powerDiff < 0) {
      r3_dmgA = 25;
      r3_dmgB = 15;
    }
  }

  currentHpA = Math.max(0, currentHpA - r3_dmgA);
  currentHpB = Math.max(0, currentHpB - r3_dmgB);

  fighterA.finalHp = currentHpA;
  fighterB.finalHp = currentHpB;

  // 判定勝負
  let winner: "A" | "B" | "DRAW" = "DRAW";
  let winnerName = "平局";
  if (currentHpA > currentHpB) {
    winner = "A";
    winnerName = fighterA.name;
  } else if (currentHpB > currentHpA) {
    winner = "B";
    winnerName = fighterB.name;
  } else {
    winner = "DRAW";
    winnerName = "雙方平手";
  }

  // 產生因果歸因分析文字
  const reasonA =
    winner === "A"
      ? `${fighterA.highestSkillName} 奏效${ultA ? " + 達成條件解鎖逆轉奧義造成 -50 暴擊" : ""}${
          fighterA.buff > 0 ? " + 作業按時完成保住護盾" : ""
        }`
      : `${fighterA.buff === 0 ? "作業缺交損失 10 戰力與氣量護盾；" : ""}${
          !ultA && ultB ? `未能觸發奧義，遭到對手【${fighterB.highestSkillName}】逆轉` : "戰力些微差距惜敗"
        }`;

  const reasonB =
    winner === "B"
      ? `${fighterB.highestSkillName} 奏效${ultB ? " + 達成條件解鎖逆轉奧義造成 -50 暴擊" : ""}${
          fighterB.buff > 0 ? " + 作業按時完成保住護盾" : ""
        }`
      : `${fighterB.buff === 0 ? "作業缺交損失 10 戰力與氣量護盾；" : ""}${
          !ultB && ultA ? `未能觸發奧義，遭到對手【${fighterA.highestSkillName}】逆轉` : "戰力些微差距惜敗"
        }`;

  const steps: BattleStep[] = [
    // Step 0: 0~5s 開場登場與 Buff 標記
    {
      step: 0,
      round: 0,
      type: "ENTRY",
      title: "ROUND START",
      desc: `${fighterA.name}（${metaA.name}，HP ${initialHpA}）VS ${fighterB.name}（${metaB.name}，HP ${initialHpB}）進場就緒！`,
      shake: false,
      superFlash: false,
      hpAfterA: initialHpA,
      hpAfterB: initialHpB,
      actionText: "英雄進場",
    },

    // Step 1: 5~15s 第 1 回合 基礎交鋒
    {
      step: 1,
      round: 1,
      type: "ROUND_1",
      title: "回合 1：基礎交鋒",
      desc: `雙方短兵相接！${fighterA.name} 造成 ${r1_dmgB} 點傷害，${fighterB.name} 反擊造成 ${r1_dmgA} 點傷害！`,
      shake: false,
      superFlash: false,
      damageToA: r1_dmgA,
      damageToB: r1_dmgB,
      hpAfterA: initialHpA - r1_dmgA,
      hpAfterB: initialHpB - r1_dmgB,
      actionText: "普攻交鋒",
    },

    // Step 2: 15~25s 第 2 回合 學科絕技
    {
      step: 2,
      round: 2,
      type: "ROUND_2_SKILL",
      title: "回合 2：學科絕技！",
      desc: `${fighterA.name} 施放【${skillA.skillName}】！${fighterB.name} 施展【${skillB.skillName}】！領域強烈衝擊！`,
      shake: true,
      superFlash: false,
      skillNameA: skillA.skillName,
      skillNameB: skillB.skillName,
      damageToA: r2_dmgA,
      damageToB: r2_dmgB,
      hpAfterA: initialHpA - r1_dmgA - r2_dmgA,
      hpAfterB: initialHpB - r1_dmgB - r2_dmgB,
      actionText: "學科大招",
    },

    // Step 3: 25~35s 第 3 回合 逆轉奧義
    {
      step: 3,
      round: 3,
      type: "ROUND_3_ULTIMATE",
      title: r3_superFlash ? "回合 3：🔥 逆轉奧義爆發！" : "回合 3：終局拼刀決戰！",
      desc:
        ultA && ultB
          ? `⚡ 雙方同時發動逆轉奧義！金光蔽日，毀滅性衝擊震碎全場！`
          : ultA
          ? `🔥 ${fighterA.name} 觸發逆轉奧義！【${metaA.skillName}】全螢幕 Super Flash！造成 CRITICAL! -${r3_dmgB} 巨額暴擊！`
          : ultB
          ? `🔥 ${fighterB.name} 觸發逆轉奧義！【${metaB.skillName}】全螢幕 Super Flash！造成 CRITICAL! -${r3_dmgA} 巨額暴擊！`
          : `雙方拼盡全力施展最後一擊！刀光劍影決出高下！`,
      shake: true,
      superFlash: r3_superFlash,
      attacker: ultA && !ultB ? "A" : ultB && !ultA ? "B" : "BOTH",
      skillNameA: metaA.skillName,
      skillNameB: metaB.skillName,
      damageToA: r3_dmgA,
      damageToB: r3_dmgB,
      hpAfterA: currentHpA,
      hpAfterB: currentHpB,
      actionText: r3_superFlash ? "🔥 逆轉奧義" : "終局拼刀",
    },

    // Step 4: 35~40s 終局結算
    {
      step: 4,
      round: 4,
      type: "FINISH",
      title: winner === "DRAW" ? "勢均力敵 (Draw)" : "勝負揭曉 (Result)",
      desc:
        winner === "A"
          ? `👑 恭喜 ${fighterA.name} 獲得勝利！剩餘 HP: ${currentHpA}`
          : winner === "B"
          ? `👑 恭喜 ${fighterB.name} 獲得勝利！剩餘 HP: ${currentHpB}`
          : `兩位冒險者棋逢敵手，以平局落幕！`,
      shake: false,
      superFlash: false,
      hpAfterA: currentHpA,
      hpAfterB: currentHpB,
    },
  ];

  return {
    weekNumber,
    weekTitle,
    playerA: fighterA,
    playerB: fighterB,
    damageA: initialHpA - currentHpA,
    damageB: initialHpB - currentHpB,
    winner,
    winnerName,
    summary: `${fighterA.name} (戰力 ${fighterA.effectivePower}) vs ${fighterB.name} (戰力 ${fighterB.effectivePower}) => ${winnerName}`,
    causalityAnalysis: {
      reasonForA: reasonA,
      reasonForB: reasonB,
    },
    steps,
  };
}

export function pairAndGenerateMatches(
  inputs: StudentInputScore[],
  weekNumber: number,
  weekTitle: string
): MatchedPair[] {
  const fighters: BattleFighter[] = inputs.map((s) => {
    const avg = s.averageScore ?? s.rawScore ?? 75;
    const prevAvg = s.previousAverage ?? avg;
    const { effectivePower, buff, challengeBonus, growthBonus } = calculateEffectivePower(
      avg,
      s.hasHomeworkBuff,
      s.allChallengesCorrect ?? false,
      prevAvg
    );

    const c = s.chineseScore ?? avg;
    const e = s.englishScore ?? avg;
    const m = s.mathScore ?? avg;

    const { hasUltimate, reason: ultimateReason } = checkUltimateEligibility(
      avg,
      prevAvg,
      s.hasHomeworkBuff,
      s.allChallengesCorrect ?? false,
      c,
      e,
      m
    );

    return {
      id: s.studentId,
      studentNumber: s.studentNumber,
      name: s.name,
      avatarId: s.avatarId,
      rawScore: s.rawScore,
      chineseScore: c,
      englishScore: e,
      mathScore: m,
      averageScore: avg,
      previousAverage: prevAvg,
      buff,
      challengeBonus,
      growthBonus,
      effectivePower,
      initialHp: Math.round(avg),
      finalHp: Math.round(avg),
      hasUltimate,
      ultimateReason,
      isBot: false,
      skin: s.skin,
    };
  });

  fighters.sort((a, b) => b.effectivePower - a.effectivePower);

  if (fighters.length % 2 !== 0) {
    const lastPlayer = fighters[fighters.length - 1];
    const botPower = Math.round(lastPlayer.effectivePower * 10) / 10;
    const botAvg = Math.round(lastPlayer.averageScore || 75);
    const bot: BattleFighter = {
      id: "bot_sentinel",
      studentNumber: "BOT-999",
      name: "守門武士 (替身機器人)",
      avatarId: "pixel-bot",
      rawScore: botPower,
      chineseScore: botAvg,
      englishScore: botAvg,
      mathScore: botAvg,
      averageScore: botAvg,
      previousAverage: botAvg,
      buff: 0,
      challengeBonus: 0,
      growthBonus: 0,
      effectivePower: botPower,
      initialHp: botAvg,
      finalHp: botAvg,
      hasUltimate: false,
      ultimateReason: "機器人無奧義加成",
      isBot: true,
      skin: {
        gender: "boy",
        charClass: "warrior",
        color: "purple",
      },
    };
    fighters.push(bot);
  }

  const pairs: MatchedPair[] = [];
  for (let i = 0; i < fighters.length; i += 2) {
    const fighterA = fighters[i];
    const fighterB = fighters[i + 1];

    const battleLog = generateBattleLog(fighterA, fighterB, weekNumber, weekTitle);

    let winnerId: string | null = null;
    let isDraw = false;

    if (battleLog.winner === "A") {
      winnerId = fighterA.isBot ? null : fighterA.id;
    } else if (battleLog.winner === "B") {
      winnerId = fighterB.isBot ? null : fighterB.id;
    } else {
      isDraw = true;
    }

    pairs.push({
      playerA: fighterA,
      playerB: fighterB,
      winner: battleLog.winner,
      winnerId,
      isDraw,
      battleLog,
    });
  }

  return pairs;
}
