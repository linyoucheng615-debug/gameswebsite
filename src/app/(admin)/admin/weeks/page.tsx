"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, CheckCircle2, Clock, ArrowRight, AlertCircle } from "lucide-react";

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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* 標題與新增按鈕 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            <Calendar className="w-4 h-4" />
            <span>學期排程設定</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            週次進度管理
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            開立每週單元與設定作業補交期限。系統會自動為全班 30 位學生配置作業登記與週考容器。
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>開立新週次</span>
        </button>
      </div>

      {/* 週次卡片列表 */}
      <div>
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm">載入週次排程中...</div>
        ) : weeks.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
            尚未建立任何週次
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {weeks.map((w) => (
              <div
                key={w.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                      第 {w.weekNumber} 週
                    </span>

                    {w.isSettled ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已結算
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        進行中
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {w.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>補交期限：</span>
                      <strong className="text-slate-700 font-medium">{w.deadline}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>作業登記數：</span>
                      <span>{w._count?.homeworkRecords || 0} 人</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>對戰組數：</span>
                      <span>{w._count?.battleMatches || 0} 組</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <Link
                    href={`/admin/homework`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    登記作業 →
                  </Link>
                  <Link
                    href={`/admin/settle`}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    週考結算 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 開立新週次彈窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-lg shadow-xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>開立新學期週次</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateWeek} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  週次編號
                </label>
                <input
                  type="number"
                  min={1}
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  當週單元名稱
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：小六數學：圓周率與扇形面積"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  補交期限文字 (家長通知套版用)
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="例：本週五 18:00 前"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all"
                >
                  {submitting ? "建立中..." : "確認開立"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
