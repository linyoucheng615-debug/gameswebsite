export type HomeworkStatus = "completed" | "missing" | "partial";

export interface Student {
  id: string;
  studentNumber: string;
  name: string;
  parentPhone?: string | null;
  avatarId: string;
  wins: number;
  losses: number;
  draws: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicWeek {
  id: string;
  weekNumber: number;
  title: string;
  deadline: string;
  isSettled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeworkRecord {
  id: string;
  weekId: string;
  studentId: string;
  status: HomeworkStatus;
  missingScope?: string | null;
  hasBuff: boolean;
  student?: Student;
  week?: AcademicWeek;
}

export interface ExamScore {
  id: string;
  weekId: string;
  studentId: string;
  rawScore: number;
  effectivePower: number;
  student?: Student;
  week?: AcademicWeek;
}

export interface BattleFighter {
  id: string;
  studentNumber: string;
  name: string;
  avatarId: string;
  rawScore: number;
  buff: number; // 5 if completed, 0 if missing/partial
  effectivePower: number;
  initialHp: number;
  finalHp: number;
  isBot?: boolean;
}

export interface BattleStep {
  step: number;
  round?: number;
  type: "ENTRY" | "ROUND_1" | "SHIELD_ROUND_2" | "ULTIMATE_ROUND_3" | "BUFF" | "CLASH" | "DAMAGE" | "FINISH";
  title: string;
  desc: string;
  shake?: boolean;
  attacker?: "A" | "B" | "BOTH";
  damageToA?: number;
  damageToB?: number;
  shieldAbsorbA?: number;
  shieldAbsorbB?: number;
  hpAfterA?: number;
  hpAfterB?: number;
  skillNameA?: string;
  skillNameB?: string;
  actionText?: string;
}

export interface BattleLog {
  weekNumber: number;
  weekTitle: string;
  playerA: BattleFighter;
  playerB: BattleFighter;
  damageA: number;
  damageB: number;
  winner: "A" | "B" | "DRAW";
  winnerName: string;
  summary: string;
  steps: BattleStep[];
}

export interface BattleMatch {
  id: string;
  weekId: string;
  playerAId: string;
  playerBId?: string | null;
  botName?: string | null;
  botPower?: number | null;
  botAvatar?: string | null;
  winnerId?: string | null;
  isDraw: boolean;
  battleLog: string; // JSON parsed into BattleLog
  createdAt?: string;
  updatedAt?: string;
  playerA?: Student;
  playerB?: Student | null;
  winner?: Student | null;
  week?: AcademicWeek;
}

export interface StudentBattleViewData {
  student: Student;
  currentMatch: {
    matchId: string;
    weekNumber: number;
    weekTitle: string;
    isSettled: boolean;
    battleLog: BattleLog | null;
    isPlayerA: boolean;
    opponentName: string;
    opponentAvatar: string;
    result: "win" | "loss" | "draw" | "pending";
  } | null;
  historyScores: {
    weekNumber: number;
    weekTitle: string;
    rawScore: number;
    effectivePower: number;
    hasBuff: boolean;
    result?: "win" | "loss" | "draw";
  }[];
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
}
