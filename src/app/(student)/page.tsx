"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

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
    router.push(`/student/${trimmed}`);
  }

  function handleQuickSelect(num: string) {
    setStudentNumber(num);
    router.push(`/student/${num}`);
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-8">
      {/* 畫面正中央：極簡遊戲大廳入口 */}
      <div className="w-full max-w-md text-center space-y-7 my-auto">
        {/* 遊戲標題 */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] text-amber-400 font-pixel shadow-sm mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SEASON 1 • 冒險者集結</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-wider flex items-center justify-center gap-2.5">
            <span>⚔️</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              數學戰力擂台
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans tracking-wide">
            小六週考遊戲化冒險者對決
          </p>
        </div>

        {/* 學號輸入與進入大廳按鈕 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="請輸入學號 (例：S101)"
              className="w-full bg-[#0d1322] border-2 border-slate-700 focus:border-amber-400 focus:outline-none text-center text-white text-lg sm:text-xl font-mono py-3.5 px-4 rounded-xl shadow-inner placeholder:text-slate-500 uppercase tracking-widest transition-colors"
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          )}

          {/* 醒目的黃色按鈕 */}
          <button
            type="submit"
            className="w-full py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-black text-base sm:text-lg tracking-wider rounded-xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>進入大廳</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        {/* 快速示範選取 (方便快速測試) */}
        <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500">
          <span>快速體驗：</span>
          {["S101", "S102", "S104", "S109"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleQuickSelect(num)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-400/50 font-mono transition-colors"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
