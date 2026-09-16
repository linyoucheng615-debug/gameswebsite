"use client";

import { Crown, Medal, User, Award } from "lucide-react";
import { TournamentParticipant } from "@/types";

interface StandingsTableProps {
  participants: TournamentParticipant[];
  topCut?: number;
  format?: string;
}

export default function StandingsTable({
  participants,
  topCut = 4,
  format,
}: StandingsTableProps) {
  // Sort participants by currentScore descending, then seed ascending
  const sorted = [...participants].sort((a, b) => {
    if (b.currentScore !== a.currentScore) {
      return b.currentScore - a.currentScore;
    }
    return a.seed - b.seed;
  });

  // Group by groupName if round_robin
  const hasGroups = format === "round_robin" && sorted.some((p) => p.groupName);
  const groups = hasGroups
    ? Array.from(new Set(sorted.map((p) => p.groupName).filter(Boolean))) as string[]
    : [];

  function renderTable(list: TournamentParticipant[], showCutLine = true) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-cyber-border/80 bg-cyber-darkest/80 font-mono text-xs text-cyber-muted uppercase tracking-wider">
              <th className="py-3.5 px-4 w-16 text-center">排名</th>
              <th className="py-3.5 px-4">參賽選手</th>
              <th className="py-3.5 px-4 text-center">種子序</th>
              <th className="py-3.5 px-4 text-right">累計積分</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border/30">
            {list.map((p, idx) => {
              const rank = idx + 1;
              const isQualified = rank <= topCut;
              const isCutThreshold = rank === topCut && idx < list.length - 1 && showCutLine;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-white/[0.02] transition-colors relative ${
                    isQualified ? "bg-cyber-cyan/[0.02]" : ""
                  }`}
                >
                  {/* Rank Column with Medals */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold">
                    {rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-full font-black text-xs shadow-neon-gold">
                        1
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-300/20 text-slate-200 border border-slate-300/50 rounded-full font-bold text-xs">
                        2
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-700/20 text-amber-600 border border-amber-700/50 rounded-full font-bold text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">#{rank}</span>
                    )}
                  </td>

                  {/* Player Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-white tracking-wide">
                        {p.user?.nickname || "Unknown Player"}
                      </div>
                      {isQualified && (
                        <span className="text-[10px] bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan px-1.5 py-0.2 rounded font-mono font-semibold">
                          TOP {topCut}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {p.user?.name} · {p.user?.studentId}
                    </div>
                  </td>

                  {/* Seed */}
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                    #{p.seed}
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono text-base font-black text-cyber-cyan tracking-wider">
                      {p.currentScore.toFixed(1)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">PTS</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Top Cut Divider Indicator */}
        {showCutLine && list.length > topCut && (
          <div className="py-2.5 px-4 bg-cyber-red/10 border-y border-dashed border-cyber-red/40 flex items-center justify-between text-[11px] font-mono text-cyber-red">
            <span className="flex items-center gap-1.5 font-bold">
              <Award className="w-3.5 h-3.5" /> ▲ 以上選手晉級單敗淘汰複賽 (Top {topCut} Cut-off)
            </span>
            <span className="text-[10px] uppercase tracking-wider">Playoff Threshold</span>
          </div>
        )}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-12 bg-cyber-card border border-cyber-border p-6 cyber-cut-br">
        <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">目前尚無參賽選手報名</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasGroups ? (
        groups.map((groupName) => {
          const groupParticipants = sorted.filter((p) => p.groupName === groupName);
          return (
            <div
              key={groupName}
              className="bg-cyber-card border border-cyber-border overflow-hidden cyber-cut-br shadow-cyber-card"
            >
              <div className="px-5 py-3 border-b border-cyber-border bg-cyber-surface flex items-center justify-between">
                <h3 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyber-cyan rounded-full shadow-neon-cyan" />
                  {groupName} 循環積分榜
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  共 {groupParticipants.length} 人
                </span>
              </div>
              {renderTable(groupParticipants, false)}
            </div>
          );
        })
      ) : (
        <div className="bg-cyber-card border border-cyber-border overflow-hidden cyber-cut-br shadow-cyber-card">
          <div className="px-5 py-3 border-b border-cyber-border bg-cyber-surface flex items-center justify-between">
            <h3 className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-cyber-gold" />
              錦標賽總體積分排行榜
            </h3>
            <span className="text-xs font-mono text-slate-400">
              前 {topCut} 名晉級複賽
            </span>
          </div>
          {renderTable(sorted, true)}
        </div>
      )}
    </div>
  );
}

