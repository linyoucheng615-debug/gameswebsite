"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Swords,
  Shield,
  Zap,
  ClipboardCheck,
  Search,
  Lock,
  ArrowRight,
  Sparkles,
  Trophy,
  Copy,
  TrendingUp,
} from "lucide-react";

export default function Home() {
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
    { num: "S110", name: "鄭博文", desc: "中段班對抗" },
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
      {/* Hero 區塊 */}
      <div className="relative text-center space-y-6 pt-6 pb-4">
        {/* 發光裝飾背景 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-cyber-cyan/10 blur-3xl pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-card border border-cyber-border text-xs text-cyber-cyan font-mono shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>補習班小六 • 遊戲化週考對戰與作業管理系統</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase">
          寫作業獲得{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
            +5 護盾加成
          </span>
          <br className="hidden sm:inline" />
          相近實力{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyber-cyan via-teal-300 to-emerald-400">
            像素對決激戰
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-base text-slate-300">
          結合遊戲化 Buff 激勵、非即時 2D 像素戰鬥動畫與個人隱私成績追蹤。
          嚴格相鄰兩兩配對，場場勢均力敵；作業三態勾選與家長提醒一鍵產出！
        </p>

        {/* 學生學號輸入查詢框 */}
        <div className="max-w-md mx-auto mt-8">
          <form
            onSubmit={handleSearch}
            className="p-2 bg-cyber-card border-2 border-cyber-border-bright hover:border-cyber-cyan focus-within:border-cyber-cyan rounded-xl shadow-2xl transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5 text-cyber-cyan" />
              </div>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="請輸入學生學號 (例如 S101)"
                className="w-full bg-transparent text-white font-mono text-sm sm:text-base px-2 py-2 focus:outline-none uppercase placeholder:normal-case placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyber-cyan to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-black font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-neon-cyan"
              >
                <Swords className="w-4 h-4" />
                <span>進入對決</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <p className="text-xs text-red-400 mt-2 font-mono">{errorMsg}</p>
          )}

          {/* 快捷測試按鈕 */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-slate-400">快速示範帳號：</span>
            {demoStudents.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => handleQuickSelect(s.num)}
                className="px-2.5 py-1 text-[11px] font-mono bg-cyber-darkest hover:bg-slate-800 text-slate-300 border border-cyber-border rounded hover:border-cyber-cyan transition-colors"
              >
                <span className="font-bold text-cyber-cyan">{s.num}</span> {s.name}{" "}
                <span className="text-[9px] text-slate-500">({s.desc})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 核心特色卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 卡片 1 */}
        <div className="p-6 bg-cyber-card border border-cyber-border rounded-xl space-y-3 relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">作業護盾 Buff 激勵</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            作業按時繳齊者，週考自動觸發「作業護盾：有效戰力 +5
            分」！作業缺交或需訂正則無加成 (+0 分，不扣分)，藉由正向增強養成主動寫作業的好習慣。
          </p>
        </div>

        {/* 卡片 2 */}
        <div className="p-6 bg-cyber-card border border-cyber-border rounded-xl space-y-3 relative overflow-hidden group hover:border-cyber-cyan/60 transition-all">
          <div className="w-12 h-12 rounded-xl bg-cyber-cyan/20 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan text-xl">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">實力相近兩兩配對</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            系統依照全班最終有效戰力由高至低嚴格排序，第 1 vs 第 2、第 3 vs 第 4
            相鄰兩兩對決。若遇奇數自動派遣同分段「替身機器人」守門，場場勢均力敵！
          </p>
        </div>

        {/* 卡片 3 */}
        <div className="p-6 bg-cyber-card border border-cyber-border rounded-xl space-y-3 relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">學生個人隱私隔離</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            學生輸入學號僅可觀賞個人的 5~7
            秒沉浸式對戰動畫與個人歷次成績折線圖，嚴格不公開全班排名或他人戰果，免除比較焦慮。
          </p>
        </div>
      </div>

      {/* 老師後台快速入口 */}
      <div className="p-8 bg-gradient-to-r from-zinc-950 via-cyber-card to-zinc-950 border border-cyber-border-bright rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-cyber-cyan text-xs font-mono font-bold">
            <ClipboardCheck className="w-4 h-4" />
            <span>TEACHER CONTROL PANEL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            老師管理專區（作業勾選 • 家長通知 • 成績配對）
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            提供全班三態作業快速登記、模板 A 家長通知秒複製、文字批次貼上成績一鍵配對結算。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/homework"
            className="px-5 py-2.5 bg-cyber-darkest hover:bg-slate-800 text-white font-bold text-xs rounded-lg border border-cyber-border hover:border-cyber-cyan transition-all flex items-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>作業登記與家長通知</span>
          </Link>

          <Link
            href="/admin/settle"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-neon-red"
          >
            <Zap className="w-4 h-4" />
            <span>週考戰力結算</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
