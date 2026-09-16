"use client";

import { useState } from "react";
import {
  Trophy,
  Swords,
  Award,
  Crown,
  FastForward,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Match, UserProfile, TournamentParticipant } from "@/types";

interface BracketViewProps {
  matches: Match[];
  currentUser: UserProfile | null;
  format?: string;
  participants?: TournamentParticipant[];
  topCut?: number;
  currentRound?: number;
  totalRounds?: number;
  onSelectMatch?: (match: Match) => void;
}

export default function BracketView({
  matches,
  currentUser,
  format = "swiss",
  participants = [],
  topCut = 4,
  currentRound = 1,
  totalRounds = 3,
  onSelectMatch,
}: BracketViewProps) {
  // Separate preliminary (Swiss/Group) matches and playoff (elimination) matches
  const playoffMatches = matches.filter(
    (m) => m.stage === "playoff" || m.bracketPosition !== null
  );
  const preliminaryMatches = matches.filter((m) => m.stage === "preliminary");

  // Determine default view: if format is single_elimination or only playoff exists, default to playoff.
  // If Swiss format, default to "swiss" progression tree, but allow toggling if playoff exists.
  const hasPlayoff = playoffMatches.length > 0;
  const [activeStageView, setActiveStageView] = useState<"swiss" | "playoff">(
    format === "single_elimination" || (!preliminaryMatches.length && hasPlayoff)
      ? "playoff"
      : "swiss"
  );

  // If no matches at all
  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-cyber-card border border-cyber-border p-8 cyber-cut-br">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">賽事尚未啟動排程</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          當主辦人點擊「啟動比賽」後，系統將自動為選手進行配對，並在此處即時繪製全景對決進程樹狀圖。
        </p>
      </div>
    );
  }

  // Sorted participants for the qualifying safe zone
  const sortedParticipants = [...participants].sort((a, b) => {
    if (b.currentScore !== a.currentScore) {
      return b.currentScore - a.currentScore;
    }
    return a.seed - b.seed;
  });

  return (
    <div className="space-y-6">
      {/* Stage View Switcher (for Swiss tournaments that also have Playoff bracket) */}
      {format === "swiss" && hasPlayoff && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-cyber-card border border-cyber-border-bright cyber-cut-br">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyber-cyan" />
            <span className="text-xs font-mono text-slate-300 font-bold">視角切換：</span>
            <div className="inline-flex rounded border border-cyber-border bg-cyber-darkest p-0.5">
              <button
                onClick={() => setActiveStageView("swiss")}
                className={`px-3 py-1 text-xs font-bold cyber-cut-corner transition-all flex items-center gap-1.5 ${
                  activeStageView === "swiss"
                    ? "bg-cyber-cyan text-cyber-darkest shadow-neon-cyan font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FastForward className="w-3 h-3" />
                瑞士制輪次對決進程
              </button>
              <button
                onClick={() => setActiveStageView("playoff")}
                className={`px-3 py-1 text-xs font-bold cyber-cut-corner transition-all flex items-center gap-1.5 ${
                  activeStageView === "playoff"
                    ? "bg-cyber-red text-white shadow-neon-red font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Award className="w-3 h-3" />
                季後淘汰總決賽樹狀圖
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-cyber-cyan flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>雙階段無縫連動中</span>
          </div>
        </div>
      )}

      {/* SWISS PROGRESSION VIEW */}
      {format === "swiss" && activeStageView === "swiss" && (
        <div className="space-y-4">
          {/* Swiss Explanation Banner */}
          <div className="p-4 bg-cyber-card/90 border border-cyber-cyan/40 cyber-cut-br text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-cyber-cyan/15 text-cyber-cyan mt-0.5">
                <FastForward className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-white block mb-0.5">
                  瑞士制動態同分池對決樹狀進程 (Swiss Progression Tree)
                </span>
                <p className="text-cyber-muted text-[11px] leading-relaxed">
                  每輪系統自動將相同（或最相近）積分選手進行配對。各輪勝者挺進更高分池（1.0 分），敗者進入敗部池（0.0 分）。
                  完賽後總積分排名前 <strong className="text-amber-400">{topCut} 強</strong> 選手將取得季後淘汰複賽席位！
                </p>
              </div>
            </div>

            {hasPlayoff && (
              <button
                onClick={() => setActiveStageView("playoff")}
                className="px-3 py-1.5 bg-cyber-surface border border-cyber-red/60 text-cyber-red hover:bg-cyber-red/10 text-xs font-bold cyber-cut-corner shrink-0 flex items-center gap-1 self-start sm:self-center"
              >
                查看季後賽樹狀圖 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Horizontal Swiss Rounds Progression Columns */}
          <div className="w-full overflow-x-auto pb-6">
            <div className="flex items-start gap-6 min-w-[850px] py-2">
              {/* Group preliminary matches by round */}
              {(() => {
                const roundNumbers = Array.from(
                  new Set(preliminaryMatches.map((m) => m.round))
                ).sort((a, b) => a - b);

                if (roundNumbers.length === 0) {
                  return (
                    <div className="w-full text-center py-12 text-xs font-mono text-slate-500">
                      尚未產生初賽輪次對局
                    </div>
                  );
                }

                return roundNumbers.map((rd, rdIndex) => {
                  const rdMatches = preliminaryMatches
                    .filter((m) => m.round === rd)
                    .sort((a, b) => a.id.localeCompare(b.id));

                  const finishedCount = rdMatches.filter((m) => m.status === "finished").length;
                  const isRdFinished = finishedCount === rdMatches.length && rdMatches.length > 0;

                  return (
                    <div key={rd} className="flex items-start">
                      {/* Round Column Container */}
                      <div className="w-72 flex-shrink-0 flex flex-col">
                        {/* Round Header */}
                        <div className="text-center mb-4 p-2.5 bg-cyber-darkest border border-cyber-border cyber-cut-corner">
                          <div className="text-[10px] font-mono text-cyber-cyan tracking-widest uppercase font-bold flex items-center justify-center gap-1">
                            <span>// ROUND {rd}</span>
                            {isRdFinished ? (
                              <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded">
                                全賽畢
                              </span>
                            ) : (
                              <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded">
                                進行中
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-black uppercase text-white mt-0.5">
                            第 {rd} 輪積分對抗
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            進度：{finishedCount} / {rdMatches.length} 場完賽
                          </div>
                        </div>

                        {/* Matches in this round */}
                        <div className="space-y-3.5">
                          {rdMatches.map((m, mIdx) => {
                            const isFinished = m.status === "finished";
                            const p1Won = m.player1Result === "win";
                            const p2Won = m.player2Result === "win";
                            const isDraw = m.player1Result === "draw";

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
                                {/* Table number & scheduled time */}
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-cyber-border/40">
                                  <span className="font-bold text-cyber-cyan">#桌次 {mIdx + 1}</span>
                                  {m.scheduledTime ? (
                                    <span className="text-purple-400 flex items-center gap-0.5 truncate max-w-[130px]" title={m.scheduledTime}>
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                      {m.scheduledTime.split(" ")[0]}
                                    </span>
                                  ) : isFinished ? (
                                    <span className="text-emerald-400 font-bold">✓ 完賽</span>
                                  ) : (
                                    <span className="text-amber-400 font-bold">● 待約戰</span>
                                  )}
                                </div>

                                {/* Player 1 (Blue) */}
                                <div
                                  className={`flex items-center justify-between p-1.5 rounded transition-colors ${
                                    p1Won
                                      ? "bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-500/40"
                                      : "text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-cyan shrink-0" />
                                    <span className="text-xs truncate">
                                      {m.player1?.nickname || m.player1?.name || "TBD (待定)"}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs ml-2">
                                    {isFinished ? (p1Won ? "1.0" : isDraw ? "0.5" : "0.0") : "-"}
                                  </span>
                                </div>

                                <div className="h-px bg-cyber-border/40 my-1" />

                                {/* Player 2 (Red) */}
                                <div
                                  className={`flex items-center justify-between p-1.5 rounded transition-colors ${
                                    p2Won
                                      ? "bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-500/40"
                                      : "text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-neon-red shrink-0" />
                                    <span className="text-xs truncate">
                                      {m.player2?.nickname ||
                                        m.player2?.name ||
                                        (m.player2Id ? "TBD (待定)" : "輪空 (BYE)")}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs ml-2">
                                    {isFinished ? (p2Won ? "1.0" : isDraw ? "0.5" : "0.0") : "-"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Visual Flow Connector Arrow between rounds */}
                      {rdIndex < roundNumbers.length - 1 && (
                        <div className="flex flex-col items-center justify-center self-center px-3 text-cyber-cyan/50 font-mono text-xs">
                          <div className="flex items-center gap-1 animate-pulse">
                            <span className="hidden sm:inline text-[9px] tracking-widest text-slate-500 uppercase">晉級池</span>
                            <ChevronRight className="w-5 h-5 text-cyber-cyan" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Final Progression Column: Qualifying Safe Zone (Top Cut Threshold) */}
              <div className="flex items-start">
                <div className="flex flex-col items-center justify-center self-center px-3 text-amber-400/50 font-mono text-xs">
                  <div className="flex items-center gap-1 animate-pulse">
                    <span className="hidden sm:inline text-[9px] tracking-widest text-amber-500 uppercase">出線</span>
                    <ChevronRight className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                <div className="w-72 flex-shrink-0 flex flex-col">
                  {/* Header */}
                  <div className="text-center mb-4 p-2.5 bg-gradient-to-r from-amber-500/20 via-cyber-card to-cyber-darkest border border-amber-500/60 cyber-cut-corner shadow-neon-gold/10">
                    <div className="text-[10px] font-mono text-amber-400 tracking-widest uppercase font-bold flex items-center justify-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>// TOP {topCut} QUALIFIERS</span>
                    </div>
                    <div className="text-sm font-black uppercase text-white mt-0.5">
                      季後賽出線名額榜
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      前 {topCut} 名享有淘汰複賽種子序
                    </div>
                  </div>

                  {/* Leaderboard Cards */}
                  <div className="space-y-2">
                    {sortedParticipants.slice(0, Math.max(topCut, 4)).map((p, pIdx) => {
                      const isInsideCut = pIdx < topCut;
                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded border transition-all flex items-center justify-between text-xs font-mono ${
                            isInsideCut
                              ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                              : "bg-cyber-darkest/60 border-cyber-border/60 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                pIdx === 0
                                  ? "bg-amber-500 text-black shadow-neon-gold"
                                  : pIdx === 1
                                  ? "bg-slate-300 text-black"
                                  : pIdx === 2
                                  ? "bg-amber-700 text-white"
                                  : isInsideCut
                                  ? "bg-cyber-cyan/30 text-cyber-cyan"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {pIdx + 1}
                            </span>
                            <span className="text-white font-bold truncate">
                              {p.user?.nickname || p.user?.name || `選手 #${p.seed}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-cyber-cyan">
                              {p.currentScore.toFixed(1)} 分
                            </span>
                            {isInsideCut && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                                晉級
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Playoff CTA button if playoff exists */}
                  {hasPlayoff && (
                    <button
                      onClick={() => setActiveStageView("playoff")}
                      className="mt-4 w-full py-2 bg-gradient-to-r from-cyber-red to-rose-600 hover:brightness-110 text-white text-xs font-bold cyber-cut-corner shadow-neon-red transition-all flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      進入單淘汰決賽樹狀圖
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYOFF / SINGLE ELIMINATION BRACKET VIEW */}
      {(format === "single_elimination" || activeStageView === "playoff") && (() => {
        const bracketMatches = playoffMatches.length > 0 ? playoffMatches : matches;

        if (bracketMatches.length === 0) {
          return (
            <div className="text-center py-16 bg-cyber-card border border-cyber-border p-8 cyber-cut-br">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">尚未進入淘汰賽階段</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                初賽階段進行中，當主辦人啟動「單淘汰複賽 (Top {topCut})」後，系統將自動生成標準二元樹狀晉級圖。
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
            roundName = "冠軍總決賽 (Finals)";
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
              {rounds.map((rd) => (
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
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-neon-cyan inline-block shrink-0" />
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
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-neon-red inline-block shrink-0" />
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
      })()}
    </div>
  );
}
