"use client";

import { Trophy, Swords, ShieldAlert } from "lucide-react";
import { Match, UserProfile } from "@/types";

interface BracketViewProps {
  matches: Match[];
  currentUser: UserProfile | null;
  onSelectMatch?: (match: Match) => void;
}

export default function BracketView({
  matches,
  currentUser,
  onSelectMatch,
}: BracketViewProps) {
  // Filter elimination/playoff matches
  const bracketMatches = matches.filter(
    (m) => m.stage === "playoff" || m.bracketPosition !== null
  );

  if (bracketMatches.length === 0) {
    return (
      <div className="text-center py-16 bg-cyber-card border border-cyber-border p-8 cyber-cut-br">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">尚未進入淘汰賽階段</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          當初賽結束並由賽事管理員啟動「單淘汰複賽」後，此處將自動生成標準樹狀對戰晉級圖。
        </p>
      </div>
    );
  }

  // Group matches by round
  const maxRound = Math.max(...bracketMatches.map((m) => m.round));
  const rounds: { round: number; name: string; matches: Match[] }[] = [];

  for (let r = 1; r <= maxRound; r++) {
    const roundMatches = bracketMatches
      .filter((m) => m.round === r)
      .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));

    let roundName = `Round ${r}`;
    if (r === maxRound) {
      roundName = "冠軍決賽 (Finals)";
    } else if (r === maxRound - 1) {
      roundName = "準決賽 (Semifinals)";
    } else if (r === maxRound - 2) {
      roundName = "半準決賽 (Quarterfinals)";
    }

    rounds.push({
      round: r,
      name: roundName,
      matches: roundMatches,
    });
  }

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-stretch gap-8 min-w-[700px] sm:min-w-[900px] py-4">
        {rounds.map((rd, rdIndex) => (
          <div key={rd.round} className="flex-1 flex flex-col">
            {/* Round Title Header */}
            <div className="text-center mb-6 pb-2 border-b border-cyber-border">
              <div className="text-[10px] font-mono text-cyber-red tracking-widest uppercase">
                // Stage {rd.round}
              </div>
              <div className="text-sm font-black uppercase text-white tracking-wider">
                {rd.name}
              </div>
            </div>

            {/* Matches Column */}
            <div className="flex flex-col justify-around flex-1 gap-6">
              {rd.matches.map((m) => {
                const isFinished = m.status === "finished";
                const p1Won = m.player1Result === "win";
                const p2Won = m.player2Result === "win";

                const isP1User = currentUser && m.player1Id === currentUser.id;
                const isP2User = currentUser && m.player2Id === currentUser.id;
                const isMyMatch = isP1User || isP2User;

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch && onSelectMatch(m)}
                    className={`bg-cyber-card border transition-all p-3 cyber-cut-br relative shadow-cyber-card cursor-pointer group hover:scale-[1.02] ${
                      isMyMatch
                        ? "border-cyber-cyan shadow-neon-cyan/20"
                        : "border-cyber-border hover:border-cyber-border-bright"
                    }`}
                  >
                    {/* Top Player (White) */}
                    <div
                      className={`flex items-center justify-between p-2 rounded transition-colors ${
                        p1Won
                          ? "bg-emerald-950/40 text-emerald-300 font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block shrink-0" />
                        <span className="text-xs truncate">
                          {m.player1?.nickname || m.player1?.name || "TBD (待定)"}
                        </span>
                      </div>
                      <span className="font-mono text-xs ml-2">
                        {isFinished ? (p1Won ? "1.0" : "0.0") : "-"}
                      </span>
                    </div>

                    <div className="h-px bg-cyber-border/60 my-1" />

                    {/* Bottom Player (Black) */}
                    <div
                      className={`flex items-center justify-between p-2 rounded transition-colors ${
                        p2Won
                          ? "bg-emerald-950/40 text-emerald-300 font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600 inline-block shrink-0" />
                        <span className="text-xs truncate">
                          {m.player2?.nickname ||
                            m.player2?.name ||
                            (m.player2Id ? "TBD (待定)" : "輪空 (BYE)")}
                        </span>
                      </div>
                      <span className="font-mono text-xs ml-2">
                        {isFinished ? (p2Won ? "1.0" : "0.0") : "-"}
                      </span>
                    </div>

                    {/* Match Action Indicator */}
                    {!isFinished && (
                      <div className="mt-1 pt-1 text-center">
                        <span className="text-[10px] font-mono text-amber-400 tracking-wider">
                          ● 進行中 (點擊查看/回報)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

