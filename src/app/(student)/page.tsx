"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, GraduationCap } from "lucide-react";

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
    <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center items-center px-4 py-8 bg-slate-50">
      {/* 畫面正中央：現代簡潔 SaaS 登入卡片 */}
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6 text-center my-auto">
        {/* 平台標題與徽章 */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>國英數週考 • 親師生透明看板</span>
          </div>

          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            週考成績平台
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            國英數學力成長曲線 • 作業護盾 • 自主修練推演
          </p>
        </div>

        {/* 學號輸入表單 */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label htmlFor="student-input" className="block text-xs font-bold text-slate-700 mb-1.5 text-left">
              請輸入學生學號
            </label>
            <input
              id="student-input"
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="例如：S101"
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 text-center text-slate-900 text-lg sm:text-xl font-mono py-3 px-4 rounded-xl placeholder:text-slate-400 uppercase tracking-widest transition-all font-semibold"
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          {/* 醒目的進入按鈕 */}
          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base tracking-wide rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>進入學力看板</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 快速示範選取 */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 flex-wrap text-xs text-slate-400">
          <span className="text-slate-500 font-medium">快速測試：</span>
          {["S101", "S102", "S104", "S109"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleQuickSelect(num)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 font-mono text-xs font-semibold transition-colors"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
