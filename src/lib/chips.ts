export type ChipId =
  | "MATH_VOID"
  | "CHINESE_INK"
  | "ENGLISH_STORM"
  | "ADVERSITY_SHATTER"
  | "GUARDIAN_BASTION"
  | "SELF_TRANSCENDENCE";

export interface TacticalChip {
  id: ChipId;
  name: string;
  category: "MASTERY" | "DILIGENCE"; // 學科精熟 | 勤勉突破
  icon: string;
  badge: string;
  thresholdDesc: string;
  effectDesc: string;
  animationDesc: string;
  bannerColor: string;
}

export const TACTICAL_CHIPS: Record<ChipId, TacticalChip> = {
  MATH_VOID: {
    id: "MATH_VOID",
    name: "幾何湮滅陣",
    category: "MASTERY",
    icon: "📐",
    badge: "數學 ≥ 85 或前 15%",
    thresholdDesc: "當週數學科成績 ≥ 85 分，或達班級 PR 85（前 15%）",
    effectDesc: "穿透傷害，無視對手 30% 防禦！",
    animationDesc: "幾何晶體矩陣升起，釋放高亮度穿透藍白光束！",
    bannerColor: "from-blue-600 via-indigo-600 to-cyan-500",
  },
  CHINESE_INK: {
    id: "CHINESE_INK",
    name: "千字筆墨斬",
    category: "MASTERY",
    icon: "🖋️",
    badge: "國文 ≥ 85 或前 15%",
    thresholdDesc: "當週國文科成績 ≥ 85 分，或達班級 PR 85（前 15%）",
    effectDesc: "真實傷害打擊；若自身血量落後，吸取該次傷害 30% 轉為生命！",
    animationDesc: "突進帶出毛筆水墨拖尾與繁體字殘影，收刀墨滴爆破震屏！",
    bannerColor: "from-slate-800 via-stone-700 to-amber-700",
  },
  ENGLISH_STORM: {
    id: "ENGLISH_STORM",
    name: "律動疾風矢",
    category: "MASTERY",
    icon: "🏹",
    badge: "英文 ≥ 85 或前 15%",
    thresholdDesc: "當週英文科成績 ≥ 85 分，或達班級 PR 85（前 15%）",
    effectDesc: "開局先手風暴壓制（削弱對手 20% 攻擊），第 3 回合漫天箭雨多段暴擊！",
    animationDesc: "浮現金光風暴羽翼，向天發射箭雨流星轟炸敵方半場！",
    bannerColor: "from-amber-500 via-orange-500 to-yellow-400",
  },
  ADVERSITY_SHATTER: {
    id: "ADVERSITY_SHATTER",
    name: "逆境破甲焰",
    category: "DILIGENCE",
    icon: "🔥",
    badge: "自主修練達標",
    thresholdDesc: "完成當週「自主修練道場」任一項挑戰",
    effectDesc: "若自身週考平均分低於對手，全場傷害大幅提升 35% 反殺！",
    animationDesc: "雙拳燃起赤紅烈焰，重捶地面引發裂地碎石爆擊！",
    bannerColor: "from-rose-600 via-red-600 to-orange-500",
  },
  GUARDIAN_BASTION: {
    id: "GUARDIAN_BASTION",
    name: "守護壁壘",
    category: "DILIGENCE",
    icon: "🛡️",
    badge: "作業準時全勤",
    thresholdDesc: "當週作業為 COMPLETED（準時全勤）",
    effectDesc: "第 1~2 回合護盾升級為玄武巨盾（減傷 50%），並反彈 20% 傷害！",
    animationDesc: "身前召喚巨大符文水晶光盾，抵擋攻擊並彈出金屬格擋音波！",
    bannerColor: "from-emerald-600 via-teal-600 to-cyan-600",
  },
  SELF_TRANSCENDENCE: {
    id: "SELF_TRANSCENDENCE",
    name: "自我超越",
    category: "DILIGENCE",
    icon: "⚡",
    badge: "成績實質進步",
    thresholdDesc: "當週成績高於自己過去平均（averageScore > previousAverage）",
    effectDesc: "第 3 回合必定觸發超大爆擊 (CRITICAL HIT)！",
    animationDesc: "金黃色爆氣聚能，向前推動全螢幕金色衝擊波！",
    bannerColor: "from-yellow-500 via-amber-500 to-orange-500",
  },
};

/**
 * 計算分數陣列的第 85 百分位數 (PR 85, 前 15% 門檻)
 */
export function calculateP85Threshold(scores: number[]): number {
  if (!scores || scores.length === 0) return 85;
  const sorted = [...scores].sort((a, b) => a - b);
  // PR85: 佔全班前 15% 門檻
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(0.85 * sorted.length) - 1));
  return sorted[index];
}

/**
 * 檢查學生是否具備裝備指定晶片的資格 (支援絕對分數 ≥ 85 或 PR ≥ 85 雙軌判定)
 */
export function isChipUnlocked(
  chipId: ChipId,
  data: {
    chineseScore?: number;
    englishScore?: number;
    mathScore?: number;
    averageScore?: number;
    previousAverage?: number;
    hasHomeworkCompleted?: boolean;
    hasCompletedAnyQuest?: boolean;
    mathP85Threshold?: number;
    chineseP85Threshold?: number;
    englishP85Threshold?: number;
  }
): { unlocked: boolean; reason: string; isTop15Percent?: boolean } {
  switch (chipId) {
    case "MATH_VOID": {
      const score = data.mathScore ?? 0;
      const isAbsolute = score >= 85;
      const p85 = data.mathP85Threshold;
      const isTop15 = typeof p85 === "number" && p85 > 0 && score >= p85;
      const unlocked = isAbsolute || isTop15;

      if (isTop15 && !isAbsolute) {
        return { unlocked: true, reason: "🏆 榮登班級前 15% 解鎖", isTop15Percent: true };
      }
      if (isAbsolute) {
        return { unlocked: true, reason: "數學科達 85 分解鎖", isTop15Percent: false };
      }
      return {
        unlocked: false,
        reason: p85
          ? `數學目前 ${score} 分 (需 ≥ 85 或達班級前 15% 門檻 ${p85} 分)`
          : `數學目前 ${score} 分 (需 ≥ 85)`,
        isTop15Percent: false,
      };
    }
    case "CHINESE_INK": {
      const score = data.chineseScore ?? 0;
      const isAbsolute = score >= 85;
      const p85 = data.chineseP85Threshold;
      const isTop15 = typeof p85 === "number" && p85 > 0 && score >= p85;
      const unlocked = isAbsolute || isTop15;

      if (isTop15 && !isAbsolute) {
        return { unlocked: true, reason: "🏆 榮登班級前 15% 解鎖", isTop15Percent: true };
      }
      if (isAbsolute) {
        return { unlocked: true, reason: "國文科達 85 分解鎖", isTop15Percent: false };
      }
      return {
        unlocked: false,
        reason: p85
          ? `國文目前 ${score} 分 (需 ≥ 85 或達班級前 15% 門檻 ${p85} 分)`
          : `國文目前 ${score} 分 (需 ≥ 85)`,
        isTop15Percent: false,
      };
    }
    case "ENGLISH_STORM": {
      const score = data.englishScore ?? 0;
      const isAbsolute = score >= 85;
      const p85 = data.englishP85Threshold;
      const isTop15 = typeof p85 === "number" && p85 > 0 && score >= p85;
      const unlocked = isAbsolute || isTop15;

      if (isTop15 && !isAbsolute) {
        return { unlocked: true, reason: "🏆 榮登班級前 15% 解鎖", isTop15Percent: true };
      }
      if (isAbsolute) {
        return { unlocked: true, reason: "英文科達 85 分解鎖", isTop15Percent: false };
      }
      return {
        unlocked: false,
        reason: p85
          ? `英文目前 ${score} 分 (需 ≥ 85 或達班級前 15% 門檻 ${p85} 分)`
          : `英文目前 ${score} 分 (需 ≥ 85)`,
        isTop15Percent: false,
      };
    }
    case "ADVERSITY_SHATTER":
      return {
        unlocked: !!data.hasCompletedAnyQuest,
        reason: data.hasCompletedAnyQuest ? "已完成自主修練任務解鎖" : "需完成自主修練道場任一項目",
      };
    case "GUARDIAN_BASTION":
      return {
        unlocked: !!data.hasHomeworkCompleted,
        reason: data.hasHomeworkCompleted ? "作業全勤解鎖" : "需作業準時繳交完成",
      };
    case "SELF_TRANSCENDENCE": {
      const isImproved = (data.averageScore ?? 0) > (data.previousAverage ?? 0);
      return {
        unlocked: isImproved,
        reason: isImproved
          ? `本週平均 (${data.averageScore}) 高於過去平均 (${data.previousAverage})`
          : `本週平均 (${data.averageScore ?? 0}) 未超越過去平均 (${data.previousAverage ?? 0})`,
      };
    }
    default:
      return { unlocked: false, reason: "未知晶片" };
  }
}

