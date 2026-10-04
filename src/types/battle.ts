/**
 * 補習班週考成績平台 - 戰鬥與學力推演嚴格型別定義檔
 * Version: 2.0 (PRD Alignment)
 */

export type ChipCode =
  | 'MATH_VOID'
  | 'CHINESE_INK'
  | 'ENGLISH_STORM'
  | 'ADVERSITY_SHATTER'
  | 'GUARDIAN_BASTION'
  | 'SELF_TRANSCENDENCE';

export interface FighterState {
  id: string;
  name: string;
  studentNumber: string;
  gender: 'BOY' | 'GIRL';
  initialHp: number;
  currentHp: number;
  hasHomeworkShield: boolean;
  equippedChip: ChipCode;
  isWeakened: boolean; // 由對手英文晶片觸發 (ATK -20%)
  isShadowCoach?: boolean; // 是否為系統補位教練 NPC
  bannerColor?: string;
  chipName?: string;
}

export interface RoundAction {
  round: 1 | 2 | 3;
  attackerId: string;
  targetId: string;
  actionType: 'NORMAL_ATTACK' | 'SHIELD_CHECK' | 'CHIP_ULTIMATE';
  damage: number;
  isCritical?: boolean;
  isPierced?: boolean;   // 數學晶片穿透護盾
  isReflected?: boolean; // 守護壁壘反彈
  floatingText: string;  // 例如 "-16", "GUARD!", "PIERCE! -25", "WEAKENED! -12"
  bannerText?: string;   // 第三回合奧義名稱
}

export interface BattleLogData {
  version: '2.0';
  fighterA: FighterState;
  fighterB: FighterState;
  preBattleDebuffs: {
    englishStormTriggeredBy?: string; // 施放者 ID
  };
  rounds: RoundAction[];
  winnerId: string | null;
  isDraw: boolean;
  resultAnalysis: {
    keyFactor: string; // 因果報告主因 (如：英文開局壓制、作業護盾減傷、逆境暴擊)
    summary: string;
  };
  weekNumber?: number;
  weekTitle?: string;
  // 兼容器欄位 (若舊版前端仍讀取 player1/player2)
  player1?: any;
  player2?: any;
  winner?: 'P1' | 'P2' | 'DRAW';
  winnerName?: string;
  causalityAnalysis?: {
    reasonForP1?: string;
    reasonForP2?: string;
  };
}

