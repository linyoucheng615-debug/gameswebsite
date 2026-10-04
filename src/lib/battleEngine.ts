import { BattleLog } from "@/types";
import { ChipId, TACTICAL_CHIPS } from "@/lib/chips";

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
  hasHomeworkCompleted: boolean; // COMPLETED
  hasCompletedAnyQuest: boolean;
  equippedChip?: ChipId;
}

export interface MatchedPair {
  player1: any;
  player2: any;
  winner: "P1" | "P2" | "DRAW";
  winnerId: string | null;
  isDraw: boolean;
  battleLog: any;
}

/**
 * 30 秒 3 回合學力推演結算生成器
 */
export function generate30sBattleLog(
  p1: StudentInputScore,
  p2: StudentInputScore,
  weekNumber: number,
  weekTitle: string
): any {
  // 初始 HP = 週考三科平均分 (限制 35 ~ 100)
  const initialHp1 = Math.min(100, Math.max(35, Math.round(p1.averageScore || 75)));
  const initialHp2 = Math.min(100, Math.max(35, Math.round(p2.averageScore || 75)));

  const chip1 = p1.equippedChip || (p1.hasCompletedAnyQuest ? "ADVERSITY_SHATTER" : p1.hasHomeworkCompleted ? "GUARDIAN_BASTION" : "SELF_TRANSCENDENCE");
  const chip2 = p2.equippedChip || (p2.hasCompletedAnyQuest ? "ADVERSITY_SHATTER" : p2.hasHomeworkCompleted ? "GUARDIAN_BASTION" : "SELF_TRANSCENDENCE");

  const metaChip1 = TACTICAL_CHIPS[chip1] || TACTICAL_CHIPS.ADVERSITY_SHATTER;
  const metaChip2 = TACTICAL_CHIPS[chip2] || TACTICAL_CHIPS.GUARDIAN_BASTION;

  // ----------------------------------------------------
  // Round 1: 試探交鋒 (0~8s)
  // 基礎扣血 12~18
  // ----------------------------------------------------
  let r1_dmgToP1 = 14 + Math.round((p2.averageScore - p1.averageScore) * 0.1);
  let r1_dmgToP2 = 14 + Math.round((p1.averageScore - p2.averageScore) * 0.1);

  // 守護壁壘機制：前兩回合減免 50% 並反彈 15 點固定傷害
  if (chip1 === "GUARDIAN_BASTION") {
    r1_dmgToP1 = Math.round(r1_dmgToP1 * 0.5);
    r1_dmgToP2 += 15;
  }
  if (chip2 === "GUARDIAN_BASTION") {
    r1_dmgToP2 = Math.round(r1_dmgToP2 * 0.5);
    r1_dmgToP1 += 15;
  }

  r1_dmgToP1 = Math.max(8, Math.min(25, r1_dmgToP1));
  r1_dmgToP2 = Math.max(8, Math.min(25, r1_dmgToP2));

  // ----------------------------------------------------
  // Round 2: 戰況升溫 (8~18s)
  // 基礎扣血 18~24
  // ----------------------------------------------------
  let r2_dmgToP1 = 20;
  let r2_dmgToP2 = 20;

  if (p1.hasHomeworkCompleted) r2_dmgToP1 = Math.round(r2_dmgToP1 * 0.85); // 護盾減傷 15%
  if (p2.hasHomeworkCompleted) r2_dmgToP2 = Math.round(r2_dmgToP2 * 0.85);

  if (chip1 === "GUARDIAN_BASTION") {
    r2_dmgToP1 = Math.round(r2_dmgToP1 * 0.5);
    r2_dmgToP2 += 15;
  }
  if (chip2 === "GUARDIAN_BASTION") {
    r2_dmgToP2 = Math.round(r2_dmgToP2 * 0.5);
    r2_dmgToP1 += 15;
  }

  r2_dmgToP1 = Math.max(8, Math.min(30, r2_dmgToP1));
  r2_dmgToP2 = Math.max(8, Math.min(30, r2_dmgToP2));

  // ----------------------------------------------------
  // Round 3: 晶片大招對轟 (18~28s)
  // 大招依晶片機制結算
  // ----------------------------------------------------
  let r3_dmgToP1 = 25;
  let r3_dmgToP2 = 25;

  // 逆境破甲焰：若自身週考平均低於對手，全場傷害 +35%
  if (chip1 === "ADVERSITY_SHATTER" && p1.averageScore < p2.averageScore) {
    r3_dmgToP2 = Math.round(38 * 1.35); // 翻盤超量傷害
  }
  if (chip2 === "ADVERSITY_SHATTER" && p2.averageScore < p1.averageScore) {
    r3_dmgToP1 = Math.round(38 * 1.35);
  }

  // 自我超越：必爆擊
  if (chip1 === "SELF_TRANSCENDENCE" && p1.averageScore > p1.previousAverage) {
    r3_dmgToP2 = Math.max(r3_dmgToP2, 45);
  }
  if (chip2 === "SELF_TRANSCENDENCE" && p2.averageScore > p2.previousAverage) {
    r3_dmgToP1 = Math.max(r3_dmgToP1, 45);
  }

  // 幾何湮滅陣：穿透 30%
  if (chip1 === "MATH_VOID" && p1.mathScore >= 85) {
    r3_dmgToP2 = Math.max(r3_dmgToP2, 42);
  }
  if (chip2 === "MATH_VOID" && p2.mathScore >= 85) {
    r3_dmgToP1 = Math.max(r3_dmgToP1, 42);
  }

  // 律動疾風矢：3 段打擊
  if (chip1 === "ENGLISH_STORM" && p1.englishScore >= 85) {
    r3_dmgToP2 = Math.max(r3_dmgToP2, 40);
    r3_dmgToP1 = Math.round(r3_dmgToP1 * 0.8); // 削減對手 20%
  }
  if (chip2 === "ENGLISH_STORM" && p2.englishScore >= 85) {
    r3_dmgToP1 = Math.max(r3_dmgToP1, 40);
    r3_dmgToP2 = Math.round(r3_dmgToP2 * 0.8);
  }

  // 千字筆墨斬：吸血 30%
  let healP1 = 0;
  let healP2 = 0;
  if (chip1 === "CHINESE_INK" && p1.chineseScore >= 85) {
    r3_dmgToP2 = Math.max(r3_dmgToP2, 38);
    healP1 = Math.round(r3_dmgToP2 * 0.3);
  }
  if (chip2 === "CHINESE_INK" && p2.chineseScore >= 85) {
    r3_dmgToP1 = Math.max(r3_dmgToP1, 38);
    healP2 = Math.round(r3_dmgToP1 * 0.3);
  }

  const finalHp1 = Math.max(0, initialHp1 - r1_dmgToP1 - r2_dmgToP1 - r3_dmgToP1 + healP1);
  const finalHp2 = Math.max(0, initialHp2 - r1_dmgToP2 - r2_dmgToP2 - r3_dmgToP2 + healP2);

  let winner: "P1" | "P2" | "DRAW" = "DRAW";
  let winnerName = "平局";
  if (finalHp1 > finalHp2) {
    winner = "P1";
    winnerName = p1.name;
  } else if (finalHp2 > finalHp1) {
    winner = "P2";
    winnerName = p2.name;
  }

  // 勝負因果分析文本
  let reason1 = "";
  let reason2 = "";

  if (winner === "P1") {
    if (chip1 === "ADVERSITY_SHATTER" && p1.averageScore < p2.averageScore) {
      reason1 = `逆轉關鍵：作業與自主修練全勤，裝備【${metaChip1.name}】觸發 +35% 逆境增傷，成功反殺高分對手！`;
    } else if (chip1 === "GUARDIAN_BASTION") {
      reason1 = `防守關鍵：作業準時全勤啟動【${metaChip1.name}】，成功吸收 50% 傷害並反彈 30 點傷害奠定勝局！`;
    } else if (chip1 === "SELF_TRANSCENDENCE") {
      reason1 = `成長關鍵：本週成績大幅進步觸發【${metaChip1.name}】，在第 3 回合必定爆擊奪勝！`;
    } else {
      reason1 = `學科實力：${p1.mathScore >= 85 ? "數學" : p1.chineseScore >= 85 ? "國文" : "英文"}精熟，發動【${metaChip1.name}】終結對局！`;
    }
    reason2 = p2.hasHomeworkCompleted ? "雖有作業護盾，但在第 3 回合晶片大招對轟中承受超量傷害惜敗。" : "作業缺交失去減傷護盾，未能抵擋對手大招擊破。";
  } else if (winner === "P2") {
    if (chip2 === "ADVERSITY_SHATTER" && p2.averageScore < p1.averageScore) {
      reason2 = `逆轉關鍵：作業與自主修練全勤，裝備【${metaChip2.name}】觸發 +35% 逆境增傷，成功反殺高分對手！`;
    } else {
      reason2 = `勝因：裝備【${metaChip2.name}】發揮優勢，壓制對手。`;
    }
    reason1 = p1.hasHomeworkCompleted ? "雖有作業護盾，但在第 3 回合晶片對決中承受超量傷害惜敗。" : "作業缺交失去減傷護盾，未能抵擋對手大招擊破。";
  } else {
    reason1 = "雙方戰力旗鼓相當，三回合平分秋色。";
    reason2 = "雙方戰力旗鼓相當，三回合平分秋色。";
  }

  return {
    weekNumber,
    weekTitle,
    player1: {
      studentNumber: p1.studentNumber,
      name: p1.name,
      gender: p1.gender,
      initialHp: initialHp1,
      finalHp: finalHp1,
      equippedChip: chip1,
      chipName: metaChip1.name,
      bannerColor: metaChip1.bannerColor,
      hasHomeworkCompleted: p1.hasHomeworkCompleted,
      averageScore: p1.averageScore,
    },
    player2: {
      studentNumber: p2.studentNumber,
      name: p2.name,
      gender: p2.gender,
      initialHp: initialHp2,
      finalHp: finalHp2,
      equippedChip: chip2,
      chipName: metaChip2.name,
      bannerColor: metaChip2.bannerColor,
      hasHomeworkCompleted: p2.hasHomeworkCompleted,
      averageScore: p2.averageScore,
    },
    winner,
    winnerName,
    causalityAnalysis: {
      reasonForP1: reason1,
      reasonForP2: reason2,
    },
    rounds: [
      {
        round: 1,
        title: "Round 1 試探交鋒",
        desc: "雙方迅速前衝互換普攻！",
        damageToP1: r1_dmgToP1,
        damageToP2: r1_dmgToP2,
        shakePx: 2,
      },
      {
        round: 2,
        title: "Round 2 戰況升溫",
        desc: "作業護盾與學科能力激戰，雙方逼近半血警戒線！",
        damageToP1: r2_dmgToP1,
        damageToP2: r2_dmgToP2,
        shakePx: 4,
      },
      {
        round: 3,
        title: "Round 3 晶片大招對轟",
        desc: `【${metaChip1.name}】對轟【${metaChip2.name}】！全螢幕超必殺爆發！`,
        damageToP1: r3_dmgToP1,
        damageToP2: r3_dmgToP2,
        healP1,
        healP2,
        shakePx: 8,
        superFlash: true,
      },
    ],
  };
}

export function pairAndGenerate30sMatches(
  inputs: StudentInputScore[],
  weekNumber: number,
  weekTitle: string
): MatchedPair[] {
  // 依有效戰力排序
  const fighters = [...inputs].sort((a, b) => b.averageScore - a.averageScore);

  // 奇數時由替身補齊
  if (fighters.length % 2 !== 0) {
    const last = fighters[fighters.length - 1];
    fighters.push({
      studentNumber: "BOT-999",
      name: "守門武士 (替身機器人)",
      gender: "BOY",
      studentId: "bot_sentinel",
      chineseScore: last.averageScore,
      englishScore: last.averageScore,
      mathScore: last.averageScore,
      averageScore: last.averageScore,
      previousAverage: last.averageScore,
      hasHomeworkCompleted: false,
      hasCompletedAnyQuest: false,
      equippedChip: "GUARDIAN_BASTION",
    });
  }

  const pairs: MatchedPair[] = [];
  for (let i = 0; i < fighters.length; i += 2) {
    const f1 = fighters[i];
    const f2 = fighters[i + 1];

    const battleLog = generate30sBattleLog(f1, f2, weekNumber, weekTitle);
    const winner = battleLog.winner;
    const winnerId = winner === "P1" ? f1.studentId : winner === "P2" ? f2.studentId : null;

    pairs.push({
      player1: f1,
      player2: f2,
      winner,
      winnerId: f1.studentId === "bot_sentinel" ? null : winnerId,
      isDraw: winner === "DRAW",
      battleLog,
    });
  }

  return pairs;
}

