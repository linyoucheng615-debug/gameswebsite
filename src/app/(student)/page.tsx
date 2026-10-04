"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function StudentHomePage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = studentNumber.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg("請輸入學號 (例如：S101)");
      return;
    }
    setErrorMsg(null);
    router.push(`/portal/${trimmed}`);
  }

  function handleQuickSelect(num: string) {
    setStudentNumber(num);
    router.push(`/portal/${num}`);
  }

  return (
    <div className="min-h-[calc(100vh-130px)] flex flex-col justify-center items-center px-4 py-8 bg-slate-50">
      {/* 畫面正中央：極簡乾淨白底卡片 */}
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6 text-center my-auto">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>

          <p className="text-sm sm:text-base font-bold text-slate-700 font-sans">
            查看歷史成績，考高分增強本週戰力
          </p>
        </div>

        {/* 學號輸入表單 */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label htmlFor="student-input" className="block text-xs font-semibold text-slate-500 mb-1.5 text-left">
              請輸入學生學號
            </label>
            <input
              id="student-input"
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="例如：S101"
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 text-center text-slate-900 text-xl font-mono py-3 px-4 rounded-xl placeholder:text-slate-400 uppercase tracking-widest transition-all font-bold"
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base tracking-wide rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>進入看板</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 快速示範選取 */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 flex-wrap text-xs text-slate-400">
          <span className="text-slate-500 font-medium">快速體驗：</span>
          {["S101", "S102", "S104", "S109"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleQuickSelect(num)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 font-mono text-xs font-semibold transition-colors cursor-pointer"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
