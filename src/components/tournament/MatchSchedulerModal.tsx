"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  Zap,
  Check,
  X,
  Send,
  CalendarCheck,
} from "lucide-react";
import { Match, UserProfile, TimeSlotOption } from "@/types";
import {
  getNextWeekTimeSlots,
  parseSlots,
  analyzeMatchSlots,
  formatSlotLabel,
  PERIOD_CONFIG,
  PERIOD_KEYS,
} from "@/lib/tournament/scheduleHelper";

interface MatchSchedulerModalProps {
  match: Match;
  currentUser: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MatchSchedulerModal({
  match,
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}: MatchSchedulerModalProps) {
  const allSlots = useMemo(() => getNextWeekTimeSlots(), []);

  const isP1 = currentUser?.id === match.player1Id;
  const isP2 = currentUser?.id === match.player2Id;
  const isParticipant = isP1 || isP2;

  // 決定當前使用者對應的 slots 初始化
  const initialMySlots = useMemo(() => {
    if (isP1) return parseSlots(match.player1Slots);
    if (isP2) return parseSlots(match.player2Slots);
    return [];
  }, [isP1, isP2, match.player1Slots, match.player2Slots]);

  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialMySlots);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0); // 0~6
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // 電腦交集分析
  const analysis = useMemo(
    () => analyzeMatchSlots(match.player1Slots, match.player2Slots, allSlots),
    [match.player1Slots, match.player2Slots, allSlots]
  );

  // 依日期分組的 7 天
  const days = useMemo(() => {
    const daysMap = new Map<string, TimeSlotOption[]>();
    for (const slot of allSlots) {
      if (!daysMap.has(slot.dateStr)) {
        daysMap.set(slot.dateStr, []);
      }
      daysMap.get(slot.dateStr)!.push(slot);
    }
    return Array.from(daysMap.entries()).map(([dateStr, slots]) => ({
      dateStr,
      dayLabel: slots[0].dayLabel,
      dayName: slots[0].dayName,
      isWeekend: slots[0].isWeekend,
      slots,
    }));
  }, [allSlots]);

  if (!isOpen) return null;

  function toggleSlot(slotId: string) {
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  }

  // 捷徑操作
  function applyPreset(type: "weekday_evening" | "weekend_all" | "all_evening" | "clear") {
    if (type === "clear") {
      setSelectedSlots([]);
      return;
    }

    if (type === "weekday_evening") {
      const targetIds = allSlots
        .filter((s) => !s.isWeekend && (s.period === "evening" || s.period === "night"))
        .map((s) => s.id);
      setSelectedSlots((prev) => Array.from(new Set([...prev, ...targetIds])));
      return;
    }

    if (type === "weekend_all") {
      const targetIds = allSlots.filter((s) => s.isWeekend).map((s) => s.id);
      setSelectedSlots((prev) => Array.from(new Set([...prev, ...targetIds])));
      return;
    }

    if (type === "all_evening") {
      const targetIds = allSlots
        .filter((s) => s.period === "evening" || s.period === "night")
        .map((s) => s.id);
      setSelectedSlots((prev) => Array.from(new Set([...prev, ...targetIds])));
      return;
    }
  }

  // 儲存空檔時段
  async function handleSaveSlots() {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/matches/${match.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_slots",
          slots: selectedSlots,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "儲存時段失敗");

      setFeedback({ type: "success", text: resData.message || "可約戰時段已更新！" });
      onSuccess();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "更新失敗" });
    } finally {
      setLoading(false);
    }
  }

  // 確認敲定某個約戰時段
  async function handleConfirmTime(timeLabel: string) {
    if (!confirm(`確定將對局約戰時間敲定為：\n「${timeLabel}」嗎？`)) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/matches/${match.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_time",
          scheduledTime: timeLabel,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "確認約戰時間失敗");

      setFeedback({ type: "success", text: `約戰時間已敲定：${timeLabel}` });
      onSuccess();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "確認約戰時間失敗" });
    } finally {
      setLoading(false);
    }
  }

  // 清除/重設約戰時段
  async function handleClearTime() {
    if (!confirm("確定要取消目前預定的約戰時間嗎？雙方可重新協調。")) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/matches/${match.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_time" }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "重設約戰時間失敗");

      setFeedback({ type: "success", text: "已取消預定開戰時間" });
      onSuccess();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "操作失敗" });
    } finally {
      setLoading(false);
    }
  }

  const p1Nickname = match.player1?.nickname || match.player1?.name || "選手 1";
  const p2Nickname = match.player2?.nickname || match.player2?.name || "選手 2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-cyber-card border border-cyber-border-bright cyber-cut-corner shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 sm:px-7 py-4 border-b border-cyber-border flex items-center justify-between bg-cyber-darkest/60 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyber-cyan font-bold uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              <span>Match Scheduling Matrix // 下週賽程約戰協調</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide mt-0.5">
              {match.stage === "playoff" ? "複賽淘汰戰" : `第 ${match.round} 輪對局`}
              <span className="text-slate-400 font-normal text-sm ml-2">
                ({p1Nickname} VS {p2Nickname})
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white border border-transparent hover:border-cyber-border transition-colors cyber-cut-br"
            title="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1">
          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`p-3 text-xs font-semibold flex items-center gap-2.5 cyber-cut-br border ${
                feedback.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
                  : "bg-red-950/60 border-cyber-red/60 text-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Current Confirmed Match Time Banner */}
          {match.scheduledTime && (
            <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-cyber-surface to-cyber-card border border-emerald-500/60 cyber-cut-br shadow-neon-green/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0 shadow-neon-green">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                    // Confirmed Battle Time 已敲定開戰時段
                  </div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {match.scheduledTime}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearTime}
                disabled={loading}
                className="px-3 py-1.5 border border-slate-700 hover:border-cyber-red text-slate-300 hover:text-cyber-red text-xs font-mono font-bold transition-all cyber-cut-br shrink-0"
              >
                重設/重新協調
              </button>
            </div>
          )}

          {/* Section 1: Computer Smart Overlap Analysis (電腦智慧比對推薦) */}
          <div className="bg-cyber-darkest/70 border border-cyber-border p-4 sm:p-5 cyber-cut-br">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyber-gold" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  電腦自動比對雙方空檔時段
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className={analysis.player1Submitted ? "text-cyan-400" : "text-slate-500"}>
                  {p1Nickname}: {analysis.player1Submitted ? `已選 ${analysis.player1SlotDetails.length} 時段` : "尚未填寫"}
                </span>
                <span className="text-slate-600">|</span>
                <span className={analysis.player2Submitted ? "text-rose-400" : "text-slate-500"}>
                  {p2Nickname}: {analysis.player2Submitted ? `已選 ${analysis.player2SlotDetails.length} 時段` : "尚未填寫"}
                </span>
              </div>
            </div>

            {/* Case 1: Both submitted & Has Overlapping Common Slots */}
            {analysis.hasOverlap ? (
              <div className="space-y-3">
                <div className="p-3 bg-cyan-950/40 border border-cyber-cyan/50 text-cyan-200 text-xs flex items-center justify-between flex-wrap gap-2 cyber-cut-br">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyber-cyan shrink-0" />
                    <span>
                      <strong>最佳約戰推薦！</strong> 電腦比對發現雙方共有{" "}
                      <span className="text-white font-black text-sm px-1.5 py-0.5 bg-cyber-cyan/20 border border-cyber-cyan/40 rounded">
                        {analysis.commonSlots.length}
                      </span>{" "}
                      個共同空檔時段：
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysis.commonSlots.map((slot) => {
                    const label = formatSlotLabel(slot);
                    return (
                      <div
                        key={slot.id}
                        className="p-3 bg-cyber-card border border-cyber-cyan/40 hover:border-cyber-cyan transition-all flex items-center justify-between gap-2 cyber-cut-br group"
                      >
                        <div className="text-xs">
                          <div className="font-bold text-white flex items-center gap-1">
                            <span>{PERIOD_CONFIG[slot.period].icon}</span>
                            <span>{slot.dayLabel}</span>
                          </div>
                          <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                            {PERIOD_CONFIG[slot.period].label} {PERIOD_CONFIG[slot.period].timeRange}
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmTime(label)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-gradient-to-r from-cyber-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-cyber-darkest font-black text-[11px] uppercase cyber-cut-corner shadow-neon-cyan transition-all shrink-0 active:scale-95"
                        >
                          敲定此時段
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : analysis.bothSubmitted ? (
              /* Case 2: Both submitted but NO overlap */
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs space-y-2 cyber-cut-br">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>目前雙方尚無重疊空檔時段，請參考彼此偏好並加選時段：</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                  <div className="p-2.5 bg-cyber-darkest/80 border border-cyan-500/30 rounded">
                    <span className="text-cyan-400 font-bold block mb-1">
                      {p1Nickname} 的空檔 ({analysis.player1SlotDetails.length})：
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.player1SlotDetails.map((s) => (
                        <span key={s.id} className="px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded text-[10px]">
                          {s.dayName} {PERIOD_CONFIG[s.period].label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 bg-cyber-darkest/80 border border-rose-500/30 rounded">
                    <span className="text-rose-400 font-bold block mb-1">
                      {p2Nickname} 的空檔 ({analysis.player2SlotDetails.length})：
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {analysis.player2SlotDetails.map((s) => (
                        <span key={s.id} className="px-1.5 py-0.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded text-[10px]">
                          {s.dayName} {PERIOD_CONFIG[s.period].label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : analysis.player1Submitted || analysis.player2Submitted ? (
              /* Case 3: One player submitted, waiting for other */
              <div className="p-3 bg-cyber-surface border border-cyber-border text-slate-300 text-xs flex items-center justify-between flex-wrap gap-2 cyber-cut-br">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyber-cyan shrink-0 animate-pulse" />
                  <span>
                    已有一方登記空檔！
                    {analysis.player1Submitted ? (
                      <span className="text-cyan-300 ml-1 font-semibold">
                        {p1Nickname} 已提交 {analysis.player1SlotDetails.length} 個時段，等待 {p2Nickname} 勾選...
                      </span>
                    ) : (
                      <span className="text-rose-300 ml-1 font-semibold">
                        {p2Nickname} 已提交 {analysis.player2SlotDetails.length} 個時段，等待 {p1Nickname} 勾選...
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              /* Case 4: Neither submitted */
              <div className="text-xs text-slate-400 font-mono py-1">
                // 尚未有選手登記下週空檔。請於下方勾選您下週可以對局的時間並點選「儲存我的下週空檔」。
              </div>
            )}
          </div>

          {/* Section 2: Availability Selector for Current User */}
          {isParticipant ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-border/80 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-cyber-red rounded-full shadow-neon-red" />
                    選擇您下週可以約戰的時段
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    （已選擇 <strong className="text-cyber-cyan">{selectedSlots.length}</strong> 個時段）
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => applyPreset("weekday_evening")}
                    className="px-2.5 py-1 bg-cyber-surface hover:bg-cyber-darkest border border-cyber-border hover:border-cyber-cyan text-slate-300 hover:text-cyber-cyan text-[11px] font-mono transition-all cyber-cut-br"
                  >
                    ⚡ 平日晚間
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("weekend_all")}
                    className="px-2.5 py-1 bg-cyber-surface hover:bg-cyber-darkest border border-cyber-border hover:border-cyber-gold text-slate-300 hover:text-cyber-gold text-[11px] font-mono transition-all cyber-cut-br"
                  >
                    🎮 週末全天
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("all_evening")}
                    className="px-2.5 py-1 bg-cyber-surface hover:bg-cyber-darkest border border-cyber-border text-slate-300 hover:text-white text-[11px] font-mono transition-all cyber-cut-br"
                  >
                    🌙 全週晚間
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("clear")}
                    className="px-2 py-1 text-slate-500 hover:text-rose-400 text-[11px] font-mono transition-all"
                    title="清空所有選取"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* Day Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {days.map((day, idx) => {
                  const daySlots = day.slots.map((s) => s.id);
                  const selectedCountInDay = daySlots.filter((id) => selectedSlots.includes(id)).length;
                  const isActive = activeDayIndex === idx;

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setActiveDayIndex(idx)}
                      className={`px-3 py-2 text-xs font-mono font-bold transition-all cyber-cut-br shrink-0 flex flex-col items-center min-w-[76px] ${
                        isActive
                          ? "bg-cyber-surface border border-cyber-cyan text-cyber-cyan shadow-neon-cyan/20"
                          : "bg-cyber-card border border-cyber-border text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 uppercase">{day.dayName}</span>
                      <span className="text-sm font-black">{day.dateStr.slice(5)}</span>
                      {selectedCountInDay > 0 && (
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-neon-cyan" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Time Slots Grid for Active Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {days[activeDayIndex]?.slots.map((slot) => {
                  const isChecked = selectedSlots.includes(slot.id);
                  const pConfig = PERIOD_CONFIG[slot.period];

                  return (
                    <div
                      key={slot.id}
                      onClick={() => toggleSlot(slot.id)}
                      className={`p-3.5 border transition-all cursor-pointer select-none cyber-cut-br flex items-center justify-between ${
                        isChecked
                          ? "bg-cyan-950/30 border-cyber-cyan text-white shadow-neon-cyan/15"
                          : "bg-cyber-card/60 border-cyber-border/70 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{pConfig.icon}</span>
                        <div>
                          <div className={`text-xs font-bold ${isChecked ? "text-cyber-cyan" : "text-white"}`}>
                            {pConfig.label}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {pConfig.timeRange}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-cyber-cyan border-cyber-cyan text-cyber-darkest font-bold"
                            : "border-slate-600 bg-cyber-darkest"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Slots Action */}
              <div className="pt-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSaveSlots}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyber-red to-rose-600 hover:from-cyber-red-hover hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider cyber-cut-corner shadow-neon-red transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "儲存中..." : "儲存我的下週空檔"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-cyber-surface border border-cyber-border text-center text-xs text-slate-400 font-mono cyber-cut-br">
              您非此對局之參賽選手，僅可查看雙方協調進度。
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3 border-t border-cyber-border bg-cyber-darkest/60 flex items-center justify-between text-xs font-mono text-slate-500 shrink-0">
          <span>// VERSUS ARENA TIME COORDINATOR</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-bold transition-all cyber-cut-br"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

