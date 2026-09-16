"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Swords,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { Match, UserProfile } from "@/types";
import QuickReportModal from "./QuickReportModal";
import MatchSchedulerModal from "./MatchSchedulerModal";
import { analyzeMatchSlots } from "@/lib/tournament/scheduleHelper";

interface MatchCardProps {
  match: Match;
  currentUser: UserProfile | null;
  onRefresh: () => void;
}

export default function MatchCard({
  match,
  currentUser,
  onRefresh,
}: MatchCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const isP1 = currentUser && match.player1Id === currentUser.id;
  const isP2 = currentUser && match.player2Id === currentUser.id;
  const isParticipant = isP1 || isP2;
  const isAdmin = currentUser?.role === "admin";
  const isFinished = match.status === "finished";

  const p1Won = match.player1Result === "win";
  const p2Won = match.player2Result === "win";
  const isDraw = match.player1Result === "draw";

  // 電腦交集分析
  const analysis = useMemo(
    () => analyzeMatchSlots(match.player1Slots, match.player2Slots),
    [match.player1Slots, match.player2Slots]
  );

  return (
    <>
      <div className="bg-cyber-card border border-cyber-border hover:border-cyber-border-bright transition-all p-4 sm:p-5 cyber-cut-br shadow-cyber-card relative flex flex-col justify-between group">
        {/* Top Card Info Bar */}
        <div className="flex items-center justify-between text-xs font-mono mb-3 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyber-darkest border border-cyber-border text-cyber-cyan text-[11px] font-bold">
              {match.stage === "playoff" ? "複賽淘汰" : `R${match.round}`}
            </span>
            {match.groupName && (
              <span className="px-2 py-0.5 bg-cyber-surface border border-cyber-border-bright text-cyber-gold text-[11px]">
                {match.groupName}
              </span>
            )}
          </div>

          <div>
            {isFinished ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 已確認完賽
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold animate-pulse">
                <Clock className="w-3.5 h-3.5" /> 進行中
              </span>
            )}
          </div>
        </div>

        {/* Players Versus Row */}
        <div className="grid grid-cols-5 items-center gap-2 my-2 py-2 border-y border-cyber-border/50">
          {/* Player 1 (Blue Side) */}
          <div className="col-span-2 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan inline-block shadow-neon-cyan" title="藍方 (選手 1)" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">藍方 (P1)</span>
              {isP1 && (
                <span className="text-[9px] bg-cyber-cyan text-cyber-darkest px-1 rounded font-bold">
                  您
                </span>
              )}
            </div>
            <div className={`font-bold text-sm truncate ${p1Won ? "text-emerald-400" : "text-white"}`}>
              {match.player1?.nickname || match.player1?.name || "選手 1"}
            </div>
            {match.player1?.studentId && (
              <div className="text-[10px] font-mono text-slate-500">
                {match.player1.studentId}
              </div>
            )}
          </div>

          {/* Center VS and Score Badge */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="flex items-center gap-1.5 text-xs font-mono font-black">
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    p1Won ? "bg-emerald-500 text-black" : isDraw ? "bg-slate-600 text-white" : "bg-red-950 text-red-400"
                  }`}
                >
                  {p1Won ? "1.0" : isDraw ? "0.5" : "0.0"}
                </span>
                <span className="text-slate-500">-</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    p2Won ? "bg-emerald-500 text-black" : isDraw ? "bg-slate-600 text-white" : "bg-red-950 text-red-400"
                  }`}
                >
                  {p2Won ? "1.0" : isDraw ? "0.5" : "0.0"}
                </span>
              </div>
            ) : (
              <div className="text-xs font-mono font-black text-cyber-red italic px-2 py-1 bg-cyber-darkest border border-cyber-border cyber-cut-corner">
                VS
              </div>
            )}
          </div>

          {/* Player 2 (Red Side) */}
          <div className="col-span-2 flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5 mb-1">
              {isP2 && (
                <span className="text-[9px] bg-cyber-cyan text-cyber-darkest px-1 rounded font-bold">
                  您
                </span>
              )}
              <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">紅方 (P2)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-red inline-block shadow-neon-red" title="紅方 (選手 2)" />
            </div>
            <div className={`font-bold text-sm truncate ${p2Won ? "text-emerald-400" : "text-white"}`}>
              {match.player2?.nickname || match.player2?.name || (match.player2Id ? "選手 2" : "輪空 (BYE)")}
            </div>
            {match.player2?.studentId && (
              <div className="text-[10px] font-mono text-slate-500">
                {match.player2.studentId}
              </div>
            )}
          </div>
        </div>

        {/* Match Scheduling Section (約戰時間協調區塊) */}
        {!isFinished && match.player2Id && (
          <div className="my-2.5 p-2.5 bg-cyber-darkest/70 border border-cyber-border/70 cyber-cut-br">
            {match.scheduledTime ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs truncate">
                  <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-mono text-slate-400">約戰：</span>
                  <span className="text-xs font-bold text-emerald-300 truncate" title={match.scheduledTime}>
                    {match.scheduledTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className="text-[11px] font-mono text-cyber-cyan hover:underline shrink-0"
                >
                  調整
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs truncate">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {analysis.hasOverlap ? (
                    <span className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1 truncate">
                      <Sparkles className="w-3 h-3 text-cyber-gold shrink-0" />
                      電腦發現 {analysis.commonSlots.length} 個共同空檔！
                    </span>
                  ) : analysis.bothSubmitted ? (
                    <span className="text-[11px] font-mono text-amber-400 truncate">
                      雙方時間暫無交集，協調中
                    </span>
                  ) : analysis.player1Submitted || analysis.player2Submitted ? (
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      已有 1 方提交，等待對手...
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      尚未約定開戰時段
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className={`px-2.5 py-1 text-[11px] font-bold font-mono transition-all cyber-cut-br flex items-center gap-1 shrink-0 ${
                    analysis.hasOverlap
                      ? "bg-gradient-to-r from-cyber-cyan to-blue-500 text-cyber-darkest font-black shadow-neon-cyan active:scale-95"
                      : "bg-cyber-surface hover:bg-cyber-card border border-cyber-border hover:border-cyber-cyan text-slate-300 hover:text-white"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{analysis.hasOverlap ? "查看共同時段" : "約戰協調"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Area */}
        <div className="mt-2 pt-2 flex items-center justify-between">
          <div className="text-[10px] font-mono text-slate-500 truncate">
            {match.reportedBy && (
              <span>回報者：{match.reporter?.nickname || "系統/管理員"}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Player Report Button */}
            {!isFinished && isParticipant && currentUser && (
              <button
                onClick={() => setModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyber-red to-rose-600 hover:from-cyber-red-hover hover:to-rose-500 text-white font-bold text-xs uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Swords className="w-3.5 h-3.5" />
                登記比分
              </button>
            )}

            {/* Admin / Organizer Override Button */}
            {isAdmin && (
              <button
                onClick={() => setModalOpen(true)}
                className="p-1.5 border border-slate-700 hover:border-cyber-red text-slate-400 hover:text-cyber-red transition-colors cyber-cut-corner"
                title="管理員覆寫/修改比分"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {currentUser && (
        <QuickReportModal
          match={match}
          currentUser={currentUser}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Match Scheduling Modal */}
      <MatchSchedulerModal
        match={match}
        currentUser={currentUser}
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={() => {
          setScheduleModalOpen(false);
          onRefresh();
        }}
      />
    </>
  );
}
