export type UserRole = "admin" | "player";

export type TournamentFormat = "swiss" | "round_robin" | "single_elimination";

export type TournamentCategory = "esports" | "sports" | "tcg" | "chess" | "general";

export type TournamentStatus = "pending" | "ongoing" | "playoff" | "completed";

export type StageType = "preliminary" | "playoff";

export type MatchStatus = "pending" | "finished";

export type MatchResult = "win" | "loss" | "draw" | null;

export interface UserProfile {
  id: string;
  studentId: string;
  name: string;
  nickname: string;
  role: UserRole;
  avatar?: string;
  motto?: string | null;
  createdAt: string;
}

export interface RivalRecord {
  opponentId: string;
  opponentNickname: string;
  opponentAvatar?: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // percentage e.g. 75.0
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // percentage e.g. 66.7
  streak: { type: "win" | "loss" | "none"; count: number };
  nemesis: RivalRecord | null; // worst winrate opponent
  favoriteRival: RivalRecord | null; // best winrate opponent
  allRivals: RivalRecord[];
  recentMatches: {
    matchId: string;
    tournamentName: string;
    tournamentCategory: string;
    round: number;
    opponentNickname: string;
    result: "win" | "loss" | "draw";
    scoreChange: string;
    date: string;
  }[];
}

export interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  format: TournamentFormat;
  category: TournamentCategory;
  status: TournamentStatus;
  topCut: number; // e.g. 4 or 8 players qualify for playoff bracket
  currentRound: number;
  totalRounds?: number;
  createdBy: string;
  createdAt: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  seed: number;
  currentScore: number;
  groupName?: string | null; // e.g. "Group A" for Round Robin stage
  user?: UserProfile;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  stage: StageType;
  groupName?: string | null;
  bracketPosition?: number | null;
  player1Id: string;
  player2Id?: string | null; // null represents a Bye (輪空)
  player1Result: MatchResult;
  player2Result: MatchResult;
  status: MatchStatus;
  reportedBy?: string | null;
  reporter?: { id: string; nickname: string } | null;
  player1?: UserProfile;
  player2?: UserProfile;
}

