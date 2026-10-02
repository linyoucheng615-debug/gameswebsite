"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, CheckCircle2, AlertCircle, Clock, BookOpen } from "lucide-react";
import { AcademicWeek } from "@/types";

export default function AdminWeeksPage() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [weekNumber, setWeekNumber] = useState<number>(2);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("本週五 18:00 前");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeks();
  }, []);

  async function fetchWeeks() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/weeks");
      const data = await res.json();
      if (data.weeks) {
        setWeeks(data.weeks);
        // 推算下一個週次編號
        if (data.weeks.length > 0) {
          const maxNum = Math.max(...data.weeks.map((w: any) => w.weekNumber));
          setWeekNumber(maxNum + 1);
        }
      }
    } catch (err) {
      console.error("載入週次失敗:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWeek(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline.trim()) {
      setErrorMsg("請填妥單元名稱與補交期限");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          title: title.trim(),
          deadline: deadline.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "建立失敗");
        return;
      }

      setShowModal(false);
      setTitle("");
      fetchWeeks();
    } catch {
      setErrorMsg("連線失敗，請重試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      {/* 標題與新增按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono tracking-wider uppercase mb-1">
            <Calendar className="w-4 h-4" />
            <span>老師後台 • 週次進度排程</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            學期週次管理
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            設定每週數學教學單元名稱與補交期限，系統將自動為全班學生建置作業與週考對戰容器。
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black font-bold text-xs rounded cyber-cut-corner shadow-neon-cyan transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>開立新週次</span>
        </button>
      </div>

      {/* 週次列表卡片 */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">載入週次資料中...</div>
        ) : weeks.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">尚未建立任何週次</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {weeks.map((w) => (
              <div
                key={w.id}
                className="bg-cyber-card border border-cyber-border-bright p-5 rounded-lg hover:border-cyber-cyan transition-all relative overflow-hidden group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-500/40">
                    第 {w.weekNumber} 週
                  </span>

                  {w.isSettled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      已結算
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      進行中
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-2 line-clamp-1">
                  {w.title}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-400 border-t border-cyber-border/40 pt-3">
                  <div className="flex items-center justify-between">
                    <span>補交期限：</span>
                    <span className="text-amber-300 font-mono font-bold">{w.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>作業登記者：</span>
                    <span className="font-mono text-white">
                      {w._count?.homeworkRecords || 0} 位學生
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>對戰組數：</span>
                    <span className="font-mono text-white">
                      {w._count?.battleMatches || 0} 組
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyber-border/40 flex items-center justify-between">
                  <a
                    href={`/admin/homework`}
                    className="text-xs text-cyber-cyan hover:underline font-bold"
                  >
                    前往作業勾選 →
                  </a>
                  <a
                    href={`/admin/settle`}
                    className="text-xs text-amber-400 hover:underline font-bold"
                  >
                    前往週考結算 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增週次彈窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-cyber-card border border-cyber-border-bright p-6 rounded-lg shadow-2xl relative cyber-cut-corner">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyber-cyan" />
              <span>開立新學期週次</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-red-950/70 border border-red-500 text-red-200 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateWeek} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  週次編號 (數字)
                </label>
                <input
                  type="number"
                  min={1}
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full bg-cyber-darkest border border-cyber-border text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-cyber-cyan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  當週單元名稱
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：小六數學：圓周率與扇形面積"
                  className="w-full bg-cyber-darkest border border-cyber-border text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-cyber-cyan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  補交期限文字 (套版使用)
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="例：本週五 18:00 前"
                  className="w-full bg-cyber-darkest border border-cyber-border text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-cyber-cyan"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black font-bold text-xs rounded transition-all"
                >
                  {submitting ? "建立中..." : "確認建立"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
