export type HomeworkStatus = "completed" | "missing" | "partial";

export interface Student {
  id: string;
  studentNumber: string;
  name: string;
  parentPhone?: string | null;
  avatarId: string;
  skinGender?: string;
  skinClass?: string;
  skinColor?: string;
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
  chineseScore: number;
  englishScore: number;
  mathScore: number;
  averageScore: number;
  previousAverage: number;
  effectivePower: number;
  student?: Student;
  week?: AcademicWeek;
}

export interface WeeklyChallenge {
  id: string;
  weekId: string;
  subject: "CHINESE" | "ENGLISH" | "MATH";
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
  createdAt?: string;
}

export interface StudentChallengeAnswer {
  id: string;
  studentId: string;
  challengeId: string;
  isCorrect: boolean;
  answeredAt?: string;
}

export interface PortalData {
  student: Student;
  currentWeek: AcademicWeek;
  currentHomework: HomeworkRecord | null;
  currentScore: ExamScore | null;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  chartData: {
    weekNumber: number;
    weekTitle: string;
    chinese: number;
    english: number;
    math: number;
    average: number;
    classAverage: number;
    homeworkStatus: HomeworkStatus;
  }[];
  challenges: {
    id: string;
    subject: "CHINESE" | "ENGLISH" | "MATH";
    questionText: string;
    options: string[];
    explanation?: string | null;
    userAnswer?: {
      isCorrect: boolean;
    } | null;
  }[];
  allChallengesCorrect: boolean;
  hasUltimate: boolean;
  ultimateReason: string;
  match: any | null;
}

export interface BattleFighter {
  id: string;
  studentNumber: string;
  name: string;
  avatarId: string;
  rawScore: number;
  chineseScore?: number;
  englishScore?: number;
  mathScore?: number;
  averageScore?: number;
  previousAverage?: number;
  buff: number; // 10 if completed, 0 if missing/partial
  challengeBonus?: number; // 15 if all 3 challenges correct
  growthBonus?: number; // improvement * 1.5
  effectivePower: number;
  initialHp: number;
  finalHp: number;
  hasUltimate?: boolean;
  ultimateReason?: string;
  highestSubject?: "CHINESE" | "ENGLISH" | "MATH";
  highestSkillName?: string;
  isBot?: boolean;
  skin?: {
    gender: "boy" | "girl";
    charClass: "warrior" | "mage" | "ranger" | "assassin";
    color: "blue" | "red" | "green" | "purple" | "gold";
  };
}

export interface BattleStep {
  step: number;
  round?: number;
  type: "ENTRY" | "ROUND_1" | "ROUND_2_SKILL" | "ROUND_3_ULTIMATE" | "SHIELD_ROUND_2" | "ULTIMATE_ROUND_3" | "BUFF" | "CLASH" | "DAMAGE" | "FINISH";
  title: string;
  desc: string;
  shake?: boolean;
  superFlash?: boolean;
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
  causalityAnalysis?: {
    reasonForA: string;
    reasonForB: string;
  };
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
    mySkin?: {
      gender: "boy" | "girl";
      charClass: "warrior" | "mage" | "ranger" | "assassin";
      color: "blue" | "red" | "green" | "purple" | "gold";
    };
    opponentSkin?: {
      gender: "boy" | "girl";
      charClass: "warrior" | "mage" | "ranger" | "assassin";
      color: "blue" | "red" | "green" | "purple" | "gold";
    };
    myCards?: string[];
    opponentCards?: string[];
    myStartingHp?: number;
    opponentStartingHp?: number;
    myHasBuff?: boolean;
    opponentHasBuff?: boolean;
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
  currentWeekHomework?: {
    weekNumber: number;
    unitTitle: string;
    deadlineText: string;
    isSettled: boolean;
    status: "completed" | "missing" | "partial";
    missingScope?: string | null;
    hasBuff: boolean;
  } | null;
  playerExpCoin?: {
    level: number;
    currentExp: number;
    coins: number;
  };
}
