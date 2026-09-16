export interface PlayerRating {
  userId: string;
  name?: string;
  nickname?: string;
  score: number;
  seed: number;
  hasHadBye?: boolean;
}

export interface MatchPairing {
  player1Id: string;
  player2Id: string | null; // null for BYE
  round: number;
  stage: "preliminary" | "playoff";
  groupName?: string | null;
  bracketPosition?: number | null;
}

export interface HistoricalMatch {
  player1Id: string;
  player2Id: string | null;
  round: number;
  status: string;
}

export interface GroupStanding {
  groupName: string;
  participants: PlayerRating[];
}

