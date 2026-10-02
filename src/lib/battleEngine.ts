import { BattleFighter, BattleLog, BattleStep } from "@/types";
import { getAvatarMeta } from "@/lib/avatars";

export interface StudentInputScore {
  studentNumber: string;
  name: string;
  avatarId: string;
  studentId: string;
  rawScore: number;
  hasHomeworkBuff: boolean; // true if completed, false if missing/partial
}

export interface MatchedPair {
  playerA: BattleFighter;
  playerB: BattleFighter;
  winner: "A" | "B" | "DRAW";
  winnerId: string | null;
  isDraw: boolean;
  battleLog: BattleLog;
}

export function calculateEffectivePower(rawScore: number, hasHomeworkBuff: boolean): number {
  return rawScore + (hasHomeworkBuff ? 5 : 0);
}

/**
 * 3 回合 16-bit 戰鬥計算引擎：
 * Round 1: 試探交鋒 (普通攻擊與換血)
 * Round 2: 作業護盾防禦 (若有護盾，實質抵擋/吸收 5 點傷害！)
 * Round 3: 職業奧義決戰 (發動職業專屬必殺技，震撼震動與暴擊飄字)
 */
export function generateBattleLog(
  fighterA: BattleFighter,
  fighterB: BattleFighter,
  weekNumber: number,
  weekTitle: string
): BattleLog {
  const metaA = getAvatarMeta(fighterA.avatarId);
  const metaB = getAvatarMeta(fighterB.avatarId);

  const powerDiff = fighterA.effectivePower - fighterB.effectivePower;
  let winner: "A" | "B" | "DRAW" = "DRAW";
  let winnerName = "平局";

  let totalDamageA = 20;
  let totalDamageB = 20;

  if (powerDiff > 0) {
    winner = "A";
    winnerName = fighterA.name;
    const extraDamage = Math.min(80, Math.round(powerDiff * 2.5));
    totalDamageB = Math.min(100, 20 + extraDamage);
    totalDamageA = Math.max(5, Math.round(20 - Math.min(15, powerDiff * 0.8)));
  } else if (powerDiff < 0) {
    winner = "B";
    winnerName = fighterB.name;
    const absDiff = Math.abs(powerDiff);
    const extraDamage = Math.min(80, Math.round(absDiff * 2.5));
    totalDamageA = Math.min(100, 20 + extraDamage);
    totalDamageB = Math.max(5, Math.round(20 - Math.min(15, absDiff * 0.8)));
  } else {
    winner = "DRAW";
    winnerName = "雙方平手";
    totalDamageA = 20;
    totalDamageB = 20;
  }

  fighterA.finalHp = Math.max(0, 100 - totalDamageA);
  fighterB.finalHp = Math.max(0, 100 - totalDamageB);

  // 分解 3 回合的傷害數值
  // Round 1: 普攻試探 (約佔總傷害 30%)
  const r1_dmgA = Math.max(3, Math.round(totalDamageA * 0.3));
  const r1_dmgB = Math.max(3, Math.round(totalDamageB * 0.3));

  // Round 2: 護盾防禦回合 (若有護盾，吸收 5 點傷害；無護盾則多承受傷害)
  const shieldAbsorbA = fighterA.buff > 0 ? 5 : 0;
  const shieldAbsorbB = fighterB.buff > 0 ? 5 : 0;

  const r2_rawDmgA = Math.max(4, Math.round(totalDamageA * 0.3));
  const r2_rawDmgB = Math.max(4, Math.round(totalDamageB * 0.3));

  const r2_dmgA = Math.max(0, r2_rawDmgA - shieldAbsorbA);
  const r2_dmgB = Math.max(0, r2_rawDmgB - shieldAbsorbB);

  // Round 3: 職業奧義決戰 (剩餘傷害全數爆發)
  const r3_dmgA = Math.max(2, totalDamageA - r1_dmgA - r2_dmgA);
  const r3_dmgB = Math.max(2, totalDamageB - r1_dmgB - r2_dmgB);

  let currentHpA = 100;
  let currentHpB = 100;

  const steps: BattleStep[] = [
    // Step 0: 雙方英雄登場
    {
      step: 0,
      round: 0,
      type: "ENTRY",
      title: "ROUND START",
      desc: `${fighterA.name}（${metaA.name}）VS ${fighterB.name}（${metaB.name}）進場就緒！`,
      shake: false,
      hpAfterA: 100,
      hpAfterB: 100,
    },

    // Step 1: 第一回合 普攻交鋒
    {
      step: 1,
      round: 1,
      type: "ROUND_1",
      title: "回合 1：試探交鋒",
      desc: `雙方近身突刺試探！${fighterA.name} 造成 ${r1_dmgB} 點傷害，${fighterB.name} 反擊造成 ${r1_dmgA} 點傷害！`,
      shake: false,
      damageToA: r1_dmgA,
      damageToB: r1_dmgB,
      hpAfterA: (currentHpA -= r1_dmgA),
      hpAfterB: (currentHpB -= r1_dmgB),
      actionText: "普攻交鋒",
    },

    // Step 2: 第二回合 作業護盾防禦回合
    {
      step: 2,
      round: 2,
      type: "SHIELD_ROUND_2",
      title: "回合 2：作業護盾防禦",
      desc:
        fighterA.buff > 0 && fighterB.buff > 0
          ? `雙方均繳齊作業！作業護盾金色屏障展開，各自吸收 5 點傷害！`
          : fighterA.buff > 0
          ? `${fighterA.name} 按時繳交作業！金色護盾【吸收 5 點傷害】！${fighterB.name} 無護盾承受全額衝擊！`
          : fighterB.buff > 0
          ? `${fighterB.name} 按時繳交作業！金色護盾【吸收 5 點傷害】！${fighterA.name} 無護盾承受全額衝擊！`
          : `雙方本週作業均有缺漏，無護盾庇護，雙雙承受實打實衝擊！`,
      shake: false,
      damageToA: r2_dmgA,
      damageToB: r2_dmgB,
      shieldAbsorbA,
      shieldAbsorbB,
      hpAfterA: (currentHpA -= r2_dmgA),
      hpAfterB: (currentHpB -= r2_dmgB),
      actionText: "護盾抵擋",
    },

    // Step 3: 第三回合 職業奧義必殺對決
    {
      step: 3,
      round: 3,
      type: "ULTIMATE_ROUND_3",
      title: "回合 3：職業奧義爆發！",
      desc: `${fighterA.name} 施展【${metaA.skillName}】！${fighterB.name} 釋放【${metaB.skillName}】！極限力量激烈碰撞！！`,
      shake: true,
      attacker: "BOTH",
      skillNameA: metaA.skillName,
      skillNameB: metaB.skillName,
      damageToA: r3_dmgA,
      damageToB: r3_dmgB,
      hpAfterA: fighterA.finalHp,
      hpAfterB: fighterB.finalHp,
      actionText: "奧義決戰",
    },

    // Step 4: 戰果揭曉
    {
      step: 4,
      type: "FINISH",
      title: winner === "DRAW" ? "勢均力敵 (Draw)" : "勝負揭曉 (Result)",
      desc:
        winner === "A"
          ? `${fighterA.name} 戰力技高一籌勝出！`
          : winner === "B"
          ? `${fighterB.name} 戰力技高一籌勝出！`
          : `實力旗鼓相當，握手言和！`,
      shake: false,
      hpAfterA: fighterA.finalHp,
      hpAfterB: fighterB.finalHp,
    },
  ];

  return {
    weekNumber,
    weekTitle,
    playerA: fighterA,
    playerB: fighterB,
    damageA: totalDamageA,
    damageB: totalDamageB,
    winner,
    winnerName,
    summary: `${fighterA.name} (${fighterA.effectivePower}分) vs ${fighterB.name} (${fighterB.effectivePower}分) => ${winnerName}`,
    steps,
  };
}

export function pairAndGenerateMatches(
  inputs: StudentInputScore[],
  weekNumber: number,
  weekTitle: string
): MatchedPair[] {
  const fighters: BattleFighter[] = inputs.map((s) => {
    const buff = s.hasHomeworkBuff ? 5 : 0;
    const effectivePower = s.rawScore + buff;
    return {
      id: s.studentId,
      studentNumber: s.studentNumber,
      name: s.name,
      avatarId: s.avatarId,
      rawScore: s.rawScore,
      buff,
      effectivePower,
      initialHp: 100,
      finalHp: 100,
      isBot: false,
    };
  });

  fighters.sort((a, b) => b.effectivePower - a.effectivePower);

  if (fighters.length % 2 !== 0) {
    const lastPlayer = fighters[fighters.length - 1];
    const botPower = Math.round(lastPlayer.effectivePower * 10) / 10;
    const bot: BattleFighter = {
      id: "bot_sentinel",
      studentNumber: "BOT-999",
      name: "守門武士 (替身機器人)",
      avatarId: "pixel-bot",
      rawScore: botPower,
      buff: 0,
      effectivePower: botPower,
      initialHp: 100,
      finalHp: 100,
      isBot: true,
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
