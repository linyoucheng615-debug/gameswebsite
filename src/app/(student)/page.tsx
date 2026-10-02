"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Swords,
  Shield,
  Search,
  Lock,
  Sparkles,
  ArrowRight,
  Award,
} from "lucide-react";

export default function StudentHomePage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = studentNumber.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg("請輸入學號 (例：S101)");
      return;
    }
    setErrorMsg(null);
    router.push(`/battle/${trimmed}`);
  }

  function handleQuickSelect(num: string) {
    setStudentNumber(num);
    router.push(`/battle/${num}`);
  }

  const demoStudents = [
    { num: "S101", name: "王小明", desc: "榜首衝刺" },
    { num: "S102", name: "李依婷", desc: "全勤模範" },
    { num: "S103", name: "陳俊傑", desc: "暗影刺客" },
    { num: "S104", name: "林子晴", desc: "示範缺交 (+0)" },
    { num: "S109", name: "楊雅涵", desc: "需訂正 (+0)" },
    { num: "S110", name: "鄭博文", desc: "中段班對決" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Title & Hero Section */}
      <div className="text-center space-y-5 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-amber-400 font-pixel shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>PRESS START • 2026 EDITION</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight">
          週考遊戲化{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 font-pixel text-2xl sm:text-4xl block sm:inline mt-2 sm:mt-0">
            16-BIT BATTLE
          </span>
          <br />
          按時繳作業 • 領取{" "}
          <span className="text-sky-400 font-pixel text-2xl sm:text-4xl">
            +5 護盾
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          以有效戰力進行實力相近兩兩對決，每週生成 5~7 秒沉浸式戰鬥動畫。
          個人歷史戰報隱私保護，安心享受挑戰與突破！
        </p>

        {/* 學生學號輸入區 (Arcade Start Portal) */}
        <div className="max-w-md mx-auto mt-8">
          <form
            onSubmit={handleSearch}
            className="p-1.5 bg-slate-900 border-2 border-slate-700 focus-within:border-amber-400 rounded-xl shadow-2xl transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="請輸入學號 (例如 S101)"
                className="w-full bg-transparent text-white font-mono text-sm sm:text-base px-2 py-2 focus:outline-none uppercase placeholder:normal-case placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-pixel text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>START</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-400 mt-2 font-mono">{errorMsg}</p>
          )}

          {/* 快速示範選取 */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-slate-400 font-sans">示範學號：</span>
            {demoStudents.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => handleQuickSelect(s.num)}
                className="px-2.5 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded hover:border-amber-400 transition-colors"
              >
                <span className="font-bold text-amber-400">{s.num}</span> {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 核心特色卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-[#111827] border border-slate-700/80 rounded-xl space-y-2.5">
          <div className="w-10 h-10 rounded-lg bg-sky-950 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm font-sans">作業護盾 +5 戰力</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            按時完成作業即獲作業護盾，有效戰力直接加 5 分！藉由遊戲激勵養成認真作答好習慣。
          </p>
        </div>

        <div className="p-5 bg-[#111827] border border-slate-700/80 rounded-xl space-y-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Swords className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm font-sans">相近實力兩兩對決</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            依據最終有效戰力由高至低自動嚴格排序配對（1v2, 3v4 ...），場場實力旗鼓相當！
          </p>
        </div>

        <div className="p-5 bg-[#111827] border border-slate-700/80 rounded-xl space-y-2.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm font-sans">個人成績專屬隱私</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            學生僅能查看自己的對戰動畫與個人歷次成績折線圖，杜絕全班排名與他人比較壓力。
          </p>
        </div>
      </div>
    </div>
  );
}
