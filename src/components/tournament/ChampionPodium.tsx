"use client";

import { Crown, Trophy, Medal, Sparkles, Award } from "lucide-react";
import { TournamentParticipant } from "@/types";

interface ChampionPodiumProps {
  participants: (TournamentParticipant & {
    user: { id: string; studentId: string; name: string; nickname: string };
  })[];
  tournamentName: string;
}

export default function ChampionPodium({
  participants,
  tournamentName,
}: ChampionPodiumProps) {
  // Sort participants by score descending, seed ascending
  const sorted = [...participants].sort((a, b) => {
    if (b.currentScore !== a.currentScore) {
      return b.currentScore - a.currentScore;
    }
    return a.seed - b.seed;
  });

  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  if (!first) return null;

  return (
    <div className="w-full bg-gradient-to-b from-amber-500/10 via-cyber-card to-cyber-darkest border border-amber-500/40 p-6 sm:p-8 cyber-cut-corner shadow-cyber-card mb-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase rounded-full shadow-neon-gold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Hall of Fame // 榮譽頒獎殿堂
        </div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
          恭喜優勝者・榮登冠軍王座
        </h2>
        <p className="text-xs text-cyber-muted font-mono mt-1">
          {tournamentName} 全場賽事圓滿結束
        </p>
      </div>

      {/* Podium Grid: 2nd, 1st, 3rd */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end max-w-4xl mx-auto relative z-10">
        {/* 2nd Place (Silver) */}
        {second && (
          <div className="order-2 md:order-1 bg-cyber-darkest/90 border border-slate-400/40 p-5 cyber-cut-tl text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-400/20 border border-slate-300/50 rounded-full flex items-center justify-center mb-3 shadow-md">
              <Medal className="w-6 h-6 text-slate-200" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              2nd Place // 亞軍
            </span>
            <div className="font-bold text-lg text-slate-100 mt-1 truncate max-w-full">
              {second.user.nickname}
            </div>
            <div className="text-xs text-slate-500 font-mono mb-3">
              {second.user.name} · {second.user.studentId}
            </div>
            <div className="px-3 py-1 bg-slate-800/80 border border-slate-600/40 rounded text-xs font-mono text-slate-200 font-bold">
              積分：{second.currentScore.toFixed(1)} PTS
            </div>
          </div>
        )}

        {/* 1st Place (Gold Champion) */}
        <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 to-cyber-darkest border-2 border-amber-400 p-6 sm:p-7 cyber-cut-corner text-center flex flex-col items-center shadow-neon-gold scale-100 md:scale-105 transform">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-3 shadow-neon-gold">
            <Crown className="w-9 h-9 text-cyber-darkest" />
          </div>
          <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-black flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Grand Champion // 總冠軍
          </span>
          <div className="font-black text-2xl text-white mt-1 truncate max-w-full text-glow-gold">
            {first.user.nickname}
          </div>
          <div className="text-xs text-slate-400 font-mono mb-4">
            {first.user.name} · {first.user.studentId}
          </div>
          <div className="px-4 py-1.5 bg-amber-500/30 border border-amber-400/60 rounded-full text-sm font-mono text-amber-300 font-black tracking-wider">
            總積分：{first.currentScore.toFixed(1)} PTS
          </div>
        </div>

        {/* 3rd Place (Bronze) */}
        {third && (
          <div className="order-3 bg-cyber-darkest/90 border border-amber-700/40 p-5 cyber-cut-br text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-amber-700/20 border border-amber-600/50 rounded-full flex items-center justify-center mb-3 shadow-md">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
              3rd Place // 季軍
            </span>
            <div className="font-bold text-lg text-slate-100 mt-1 truncate max-w-full">
              {third.user.nickname}
            </div>
            <div className="text-xs text-slate-500 font-mono mb-3">
              {third.user.name} · {third.user.studentId}
            </div>
            <div className="px-3 py-1 bg-slate-800/80 border border-slate-600/40 rounded text-xs font-mono text-slate-300 font-bold">
              積分：{third.currentScore.toFixed(1)} PTS
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

