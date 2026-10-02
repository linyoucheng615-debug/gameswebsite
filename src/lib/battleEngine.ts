import { BattleFighter, BattleLog, BattleStep } from "@/types";

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

/**
 * 戰鬥計算引擎：
 * 1. Buff 機制：已完成作業者 +5 分有效戰力；缺交/部分完成 +0 分。
 * 2. 嚴格戰力排序與相鄰兩兩配對。
 * 3. 奇數自動生成同分段機器人。
 * 4. 戰鬥模擬：基礎傷害 20 滴，依分數差距線性放大，生成 5~7 秒動畫所需的 battle_log。
 */
export function calculateEffectivePower(rawScore: number, hasHomeworkBuff: boolean): number {
  return rawScore + (hasHomeworkBuff ? 5 : 0);
}

export function generateBattleLog(
  fighterA: BattleFighter,
  fighterB: BattleFighter,
  weekNumber: number,
  weekTitle: string
): BattleLog {
  const powerDiff = fighterA.effectivePower - fighterB.effectivePower;
  let winner: "A" | "B" | "DRAW" = "DRAW";
  let winnerName = "平局";

  let damageA = 20;
  let damageB = 20;

  if (powerDiff > 0) {
    winner = "A";
    winnerName = fighterA.name;
    // 依分數差距線性放大
    const extraDamage = Math.min(80, Math.round(powerDiff * 2.5));
    damageB = Math.min(100, 20 + extraDamage);
    damageA = Math.max(5, Math.round(20 - Math.min(15, powerDiff * 0.8)));
  } else if (powerDiff < 0) {
    winner = "B";
    winnerName = fighterB.name;
    const absDiff = Math.abs(powerDiff);
    const extraDamage = Math.min(80, Math.round(absDiff * 2.5));
    damageA = Math.min(100, 20 + extraDamage);
    damageB = Math.max(5, Math.round(20 - Math.min(15, absDiff * 0.8)));
  } else {
    winner = "DRAW";
    winnerName = "雙方平手";
    damageA = 20;
    damageB = 20;
  }

  fighterA.finalHp = Math.max(0, 100 - damageA);
  fighterB.finalHp = Math.max(0, 100 - damageB);

  const steps: BattleStep[] = [
    {
      step: 1,
      type: "ENTRY",
      title: "英雄登場",
      desc: `${fighterA.name} 與 ${fighterB.name} 邁入第 ${weekNumber} 週對戰舞台！`,
      shake: false,
    },
  ];

  // Step 2: Buff 觸發
  if (fighterA.buff > 0 || fighterB.buff > 0) {
    let buffDesc = "";
    if (fighterA.buff > 0 && fighterB.buff > 0) {
      buffDesc = `雙方均繳齊作業！觸發【作業護盾：有效戰力 +5】！`;
    } else if (fighterA.buff > 0) {
      buffDesc = `${fighterA.name} 繳齊作業！觸發【作業充能：護盾 +5】！`;
    } else {
      buffDesc = `${fighterB.name} 繳齊作業！觸發【作業充能：護盾 +5】！`;
    }

    steps.push({
      step: 2,
      type: "BUFF",
      title: "作業護盾充能",
      desc: buffDesc,
      shake: false,
      attacker: fighterA.buff > 0 && fighterB.buff > 0 ? "BOTH" : fighterA.buff > 0 ? "A" : "B",
    });
  }

  // Step 3: 雙方衝撞位移與傷害飄字
  steps.push({
    step: 3,
    type: "CLASH",
    title: "極限交鋒",
    desc: `雙方展開衝撞交鋒！${fighterA.name} (戰力 ${fighterA.effectivePower}) VS ${fighterB.name} (戰力 ${fighterB.effectivePower})！`,
    shake: true,
    attacker: "BOTH",
    damageToA: damageA,
    damageToB: damageB,
  });

  // Step 4: 結算
  let finishDesc = "";
  if (winner === "A") {
    finishDesc = `${fighterA.name} 戰力技高一籌，對 ${fighterB.name} 造成 ${damageB} 點重擊勝出！`;
  } else if (winner === "B") {
    finishDesc = `${fighterB.name} 戰力壓制，對 ${fighterA.name} 造成 ${damageA} 點重擊勝出！`;
  } else {
    finishDesc = `雙方實力旗鼓相當，均扣除 ${damageA} 點血量，握手言和！`;
  }

  steps.push({
    step: 4,
    type: "FINISH",
    title: winner === "DRAW" ? "勢均力敵 (Draw)" : "勝負揭曉 (Result)",
    desc: finishDesc,
    shake: false,
  });

  return {
    weekNumber,
    weekTitle,
    playerA: fighterA,
    playerB: fighterB,
    damageA,
    damageB,
    winner,
    winnerName,
    summary: `${fighterA.name} (${fighterA.effectivePower}分) vs ${fighterB.name} (${fighterB.effectivePower}分) => ${winnerName}`,
    steps,
  };
}

/**
 * 批次進行相近對手配對演算法
 */
export function pairAndGenerateMatches(
  inputs: StudentInputScore[],
  weekNumber: number,
  weekTitle: string
): MatchedPair[] {
  // 1. 換算每位學生的最終有效戰力
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

  // 2. 嚴格由高至低排序
  fighters.sort((a, b) => b.effectivePower - a.effectivePower);

  // 3. 檢查是否為奇數，若是則在末端或該分段生成替身機器人
  if (fighters.length % 2 !== 0) {
    const lastPlayer = fighters[fighters.length - 1];
    // 生成同分段平均戰力替身機器人
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

  // 4. 相鄰兩兩自動配對 (1 vs 2, 3 vs 4, ...)
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
