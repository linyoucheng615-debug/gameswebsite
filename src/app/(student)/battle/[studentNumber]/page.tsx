"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Shield,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  Lock,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";
import { StudentBattleViewData, BattleLog } from "@/types";

export default function StudentBattlePage() {
  const params = useParams();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [data, setData] = useState<StudentBattleViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 戰鬥動畫階段 (0: 準備, 1: 登場, 2: 護盾充能, 3: 衝撞扣血, 4: 結算)
  const [animStage, setAnimStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hpA, setHpA] = useState<number>(100);
  const [hpB, setHpB] = useState<number>(100);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showDamage, setShowDamage] = useState<boolean>(false);

  // 取得學生與對戰資料
  useEffect(() => {
    if (!studentNumber) return;

    async function fetchBattleData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/battle/${studentNumber}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || "查無此學號資料");
          return;
        }
        setData(json);
      } catch {
        setErrorMsg("連線至伺服器失敗，請稍後重試");
      } finally {
        setLoading(false);
      }
    }

    fetchBattleData();
  }, [studentNumber]);

  // 當資料載入且有對戰記錄時，自動啟動動畫
  useEffect(() => {
    if (data?.currentMatch?.battleLog) {
      startBattleAnimation(data.currentMatch.battleLog);
    }
  }, [data]);

  // 5~7 秒沉浸式 JRPG / Arcade 戰鬥動畫排程
  function startBattleAnimation(log: BattleLog) {
    setIsPlaying(true);
    setAnimStage(1);
    setHpA(100);
    setHpB(100);
    setIsShaking(false);
    setShowDamage(false);

    // 0 ~ 1.5s: 英雄登場
    // 1.5s ~ 3.2s: 作業護盾 Buff 充能
    const timer1 = setTimeout(() => {
      setAnimStage(2);
    }, 1500);

    // 3.2s ~ 4.8s: 雙方衝撞、畫面震動、扣血飄字
    const timer2 = setTimeout(() => {
      setAnimStage(3);
      setIsShaking(true);
      setShowDamage(true);
      setHpA(log.playerA.finalHp);
      setHpB(log.playerB.finalHp);
    }, 3200);

    // 震動停止
    const timerShake = setTimeout(() => {
      setIsShaking(false);
    }, 3700);

    // 4.8s+: 結算彈出 Arcade 像素卡片
    const timer3 = setTimeout(() => {
      setAnimStage(4);
      setIsPlaying(false);
    }, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timerShake);
      clearTimeout(timer3);
    };
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-pixel text-xs text-amber-400 tracking-widest">
          LOADING BATTLE DATA...
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111827] border-2 border-rose-500/60 p-8 rounded-lg text-center space-y-5 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">查無學生資料</h2>
          <p className="text-xs text-slate-300 font-sans">{errorMsg}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-pixel text-xs rounded transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO TITLE</span>
          </Link>
        </div>
      </div>
    );
  }

  const { student, currentMatch, historyScores, stats } = data;
  const matchLog = currentMatch?.battleLog;
  const isPlayerA = currentMatch?.isPlayerA ?? true;

  const myFighter = matchLog ? (isPlayerA ? matchLog.playerA : matchLog.playerB) : null;
  const opponentFighter = matchLog ? (isPlayerA ? matchLog.playerB : matchLog.playerA) : null;

  const myHp = isPlayerA ? hpA : hpB;
  const opponentHp = isPlayerA ? hpB : hpA;
  const myDamage = matchLog ? (isPlayerA ? matchLog.damageA : matchLog.damageB) : 0;
  const opponentDamage = matchLog ? (isPlayerA ? matchLog.damageB : matchLog.damageA) : 0;

  const myAvatar = getAvatarMeta(student.avatarId);
  const opponentAvatar = getAvatarMeta(currentMatch?.opponentAvatar);

  const isMyWin = currentMatch?.result === "win";
  const isMyLoss = currentMatch?.result === "loss";
  const isMyDraw = currentMatch?.result === "draw";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 頂部學生身分資訊列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#111827]/90 border border-slate-700/80 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-2xl shadow-inner">
            {myAvatar.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{student.name} 的專屬戰鬥室</h1>
              <span className="font-pixel text-[11px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                {student.studentNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>英雄職業：{myAvatar.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Lock className="w-3 h-3" />
                個人成績隱私保護中
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 self-start sm:self-auto transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>切換學號</span>
        </Link>
      </div>

      {/* 2D 像素戰鬥舞台 (16-bit Arcade Fighting Stage) */}
      {currentMatch && matchLog ? (
        <div
          className={`relative bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#1e293b] border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl transition-transform ${
            isShaking ? "animate-battle-shake border-rose-500" : ""
          }`}
          style={{ minHeight: "440px" }}
        >
          {/* 頂部資訊列：週次單元名稱與重播按鈕 */}
          <div className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-[#080d18]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
                WEEK {currentMatch.weekNumber}
              </span>
              <span className="text-slate-200 font-semibold truncate max-w-xs sm:max-w-md">
                {currentMatch.weekTitle}
              </span>
            </div>

            <button
              onClick={() => startBattleAnimation(matchLog)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-pixel text-[10px] transition-all flex items-center gap-1.5 border border-slate-600 hover:border-amber-400"
            >
              <RotateCcw className="w-3 h-3" />
              <span>REPLAY</span>
            </button>
          </div>

          {/* 戰鬥中央對決區 */}
          <div className="relative z-10 px-4 sm:px-12 py-6 flex flex-col justify-between" style={{ minHeight: "360px" }}>
            {/* 雙方厚邊框像素血條 (Chunky Pixel HP Bars) */}
            <div className="grid grid-cols-2 gap-6 sm:gap-14">
              {/* 左方血條：學生本體 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{student.name}</span>
                    <span className="font-pixel text-[9px] text-sky-400">({student.studentNumber})</span>
                  </div>
                  <span className="font-pixel text-[10px] text-emerald-400">
                    {myHp} / 100 HP
                  </span>
                </div>

                {/* 厚邊框像素血條容器 */}
                <div className="w-full h-4 bg-[#450a0a] rounded-sm p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                  <div
                    className="h-full rounded-xs transition-all duration-700 bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{
                      width: `${Math.max(0, myHp)}%`,
                      backgroundColor: myHp > 50 ? "#34d399" : myHp > 25 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>

                {/* 戰力拆解說明 */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>卷面:{myFighter?.rawScore}</span>
                  {myFighter?.buff ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Shield className="w-3 h-3" />
                      +5護盾
                    </span>
                  ) : (
                    <span className="text-slate-500">+0</span>
                  )}
                  <span className="font-pixel text-[9px] text-white">
                    PWR:{myFighter?.effectivePower}
                  </span>
                </div>
              </div>

              {/* 右方血條：對手 */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between text-xs flex-row-reverse">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{currentMatch.opponentName}</span>
                    <span className="font-pixel text-[9px] text-amber-400">
                      {opponentFighter?.isBot ? "[BOT]" : `(${opponentFighter?.studentNumber})`}
                    </span>
                  </div>
                  <span className="font-pixel text-[10px] text-emerald-400">
                    {opponentHp} / 100 HP
                  </span>
                </div>

                {/* 厚邊框像素血條容器 (反向填滿) */}
                <div className="w-full h-4 bg-[#450a0a] rounded-sm p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex justify-end">
                  <div
                    className="h-full rounded-xs transition-all duration-700 bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{
                      width: `${Math.max(0, opponentHp)}%`,
                      backgroundColor: opponentHp > 50 ? "#34d399" : opponentHp > 25 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>

                {/* 戰力拆解說明 */}
                <div className="flex items-center justify-end gap-2 text-[11px] text-slate-400 font-mono">
                  <span className="font-pixel text-[9px] text-white">
                    PWR:{opponentFighter?.effectivePower}
                  </span>
                  {opponentFighter?.buff ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Shield className="w-3 h-3" />
                      +5護盾
                    </span>
                  ) : (
                    <span className="text-slate-500">+0</span>
                  )}
                  <span>卷面:{opponentFighter?.rawScore}</span>
                </div>
              </div>
            </div>

            {/* 擂台中央角色與衝撞對決區 */}
            <div className="relative my-8 flex items-center justify-between px-6 sm:px-16">
              {/* 左側選手容器 + 站立基座 */}
              <div
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  animStage === 3 ? "animate-dash-left" : ""
                } ${animStage === 4 && isMyLoss ? "opacity-30 grayscale translate-y-3" : ""}`}
              >
                {/* 作業護盾頭頂微發光徽章 (Shield Icon) */}
                {animStage >= 2 && myFighter?.buff ? (
                  <div className="absolute -top-8 px-2 py-0.5 rounded bg-sky-950 border border-sky-400 text-sky-300 font-pixel text-[9px] shadow-[0_0_12px_rgba(56,189,248,0.9)] flex items-center gap-1 animate-bounce z-20">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>+5 SHIELD</span>
                  </div>
                ) : null}

                {/* 浮動扣血飄字 (Float Damage Number) */}
                {showDamage && (
                  <div className="absolute -top-12 font-pixel text-xl sm:text-2xl text-rose-400 animate-float-damage pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-30">
                    -{myDamage} HP
                  </div>
                )}

                {/* 角色外觀主體 */}
                <div
                  className={`w-24 h-24 rounded-xl flex items-center justify-center text-5xl bg-gradient-to-br ${myAvatar.bgGradient} border-2 ${myAvatar.border} shadow-xl relative z-10 transition-transform ${
                    animStage === 4 && isMyWin ? "scale-110 animate-bounce" : ""
                  }`}
                >
                  {myAvatar.emoji}
                </div>

                {/* 角色站立基座 (Floating Pedestal) */}
                <div className="w-28 h-6 -mt-3 bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20 rounded-full blur-[2px] border border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white">{student.name}</span>
                </div>
              </div>

              {/* 中間對決狀態標語 */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                {animStage === 1 && (
                  <div className="font-pixel text-[11px] text-amber-400 tracking-widest animate-pulse">
                    FIGHT!!
                  </div>
                )}
                {animStage === 2 && (
                  <div className="font-pixel text-[10px] text-sky-400 animate-fadeIn flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>BUFF CHARGING...</span>
                  </div>
                )}
                {animStage === 3 && (
                  <div className="font-pixel text-base text-rose-400 animate-bounce">
                    💥 CLASH!
                  </div>
                )}

                {/* 結算彈窗：經典 Arcade 像素風格卡片 */}
                {animStage === 4 && (
                  <div className="animate-fadeIn p-4 rounded-lg bg-[#0b0f19]/95 border-2 border-slate-400 shadow-2xl max-w-xs">
                    {isMyWin && (
                      <div className="space-y-1.5">
                        <div className="font-pixel text-lg sm:text-xl text-[#F59E0B] tracking-wider drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]">
                          VICTORY
                        </div>
                        <p className="text-xs text-slate-200 font-sans">
                          🎉 恭喜獲勝！有效戰力技高一籌！
                        </p>
                      </div>
                    )}
                    {isMyLoss && (
                      <div className="space-y-1.5">
                        <div className="font-pixel text-lg sm:text-xl text-[#E11D48] tracking-wider drop-shadow-[0_0_10px_rgba(225,29,72,0.7)]">
                          DEFEAT
                        </div>
                        <p className="text-xs text-slate-200 font-sans">
                          惜敗！下週務必完成作業領取護盾！
                        </p>
                      </div>
                    )}
                    {isMyDraw && (
                      <div className="space-y-1.5">
                        <div className="font-pixel text-lg sm:text-xl text-amber-400 tracking-wider">
                          DRAW
                        </div>
                        <p className="text-xs text-slate-200 font-sans">
                          勢均力敵！雙方打出精彩平手！
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 右側對手容器 + 站立基座 */}
              <div
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  animStage === 3 ? "animate-dash-right" : ""
                } ${animStage === 4 && isMyWin ? "opacity-30 grayscale translate-y-3" : ""}`}
              >
                {/* 作業護盾頭頂微發光徽章 (Shield Icon) */}
                {animStage >= 2 && opponentFighter?.buff ? (
                  <div className="absolute -top-8 px-2 py-0.5 rounded bg-sky-950 border border-sky-400 text-sky-300 font-pixel text-[9px] shadow-[0_0_12px_rgba(56,189,248,0.9)] flex items-center gap-1 animate-bounce z-20">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>+5 SHIELD</span>
                  </div>
                ) : null}

                {/* 浮動扣血飄字 (Float Damage Number) */}
                {showDamage && (
                  <div className="absolute -top-12 font-pixel text-xl sm:text-2xl text-rose-400 animate-float-damage pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-30">
                    -{opponentDamage} HP
                  </div>
                )}

                {/* 角色外觀主體 */}
                <div
                  className={`w-24 h-24 rounded-xl flex items-center justify-center text-5xl bg-gradient-to-br ${opponentAvatar.bgGradient} border-2 ${opponentAvatar.border} shadow-xl relative z-10 transition-transform ${
                    animStage === 4 && isMyLoss ? "scale-110 animate-bounce" : ""
                  }`}
                >
                  {opponentFighter?.isBot ? "🤖" : opponentAvatar.emoji}
                </div>

                {/* 角色站立基座 (Floating Pedestal) */}
                <div className="w-28 h-6 -mt-3 bg-gradient-to-r from-amber-500/20 via-orange-400/40 to-amber-500/20 rounded-full blur-[2px] border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white">
                    {currentMatch.opponentName}
                  </span>
                </div>
              </div>
            </div>

            {/* 底部摘要 */}
            <div className="text-center text-xs text-slate-400 font-sans pt-2 border-t border-slate-800">
              {matchLog.summary}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-[#111827] border border-slate-700 rounded-xl text-center space-y-3">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
          <h2 className="text-base font-bold text-white">本週週考對決準備中</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
            老師正在為全班進行作業檢核與週考批改。結算完成後，將在此自動呈現專屬您的 2D 像素戰鬥！
          </p>
        </div>
      )}

      {/* 下方個人數據與歷次折線圖 (隱私隔離) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 個人累積戰報 */}
        <div className="bg-[#111827] border border-slate-700 p-5 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <span>個人累積戰績統計</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 bg-slate-900 rounded border border-emerald-500/40">
              <div className="text-[11px] text-emerald-400 font-semibold">勝場</div>
              <div className="font-pixel text-base text-white mt-1">{stats.wins}</div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-amber-500/40">
              <div className="text-[11px] text-amber-400 font-semibold">平手</div>
              <div className="font-pixel text-base text-white mt-1">{stats.draws}</div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-rose-500/40">
              <div className="text-[11px] text-rose-400 font-semibold">惜敗</div>
              <div className="font-pixel text-base text-white mt-1">{stats.losses}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 rounded border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">總出戰數：</span>
              <span className="font-pixel text-[11px] text-white">{stats.totalMatches} 場</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">個人勝率：</span>
              <span className="font-pixel text-[11px] text-amber-400">{stats.winRate}%</span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 font-sans">
            <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>
              隱私說明：本頁面僅能查看個人的成績與動畫，無全班排名與比較，請享受對戰並突破自我！
            </span>
          </div>
        </div>

        {/* 歷次週考個人成績與戰力折線圖 */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-700 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>個人歷次成績與戰力走勢圖</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-sans">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block" />
                原始卷面
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block" />
                有效戰力 (+5護盾)
              </span>
            </div>
          </div>

          {historyScores.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-sans">
              尚未有歷次成績記錄。完成本週結算後將即時在此繪製您的進步曲線！
            </div>
          ) : (
            <div className="space-y-4">
              {/* SVG 折線圖 */}
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded p-4 overflow-x-auto">
                <svg
                  viewBox="0 0 500 180"
                  className="w-full h-44 overflow-visible font-mono text-[10px]"
                >
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y = 160 - (val / 100) * 140;
                    return (
                      <g key={val}>
                        <line
                          x1="35"
                          y1={y}
                          x2="490"
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="2,2"
                        />
                        <text x="5" y={y + 3} fill="#64748b">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* 原始成績折線 */}
                  <polyline
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    points={historyScores
                      .map((item, idx) => {
                        const x =
                          historyScores.length === 1
                            ? 260
                            : 50 + (idx / (historyScores.length - 1)) * 420;
                        const y = 160 - (item.rawScore / 100) * 140;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* 有效戰力折線 (金黃色) */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    points={historyScores
                      .map((item, idx) => {
                        const x =
                          historyScores.length === 1
                            ? 260
                            : 50 + (idx / (historyScores.length - 1)) * 420;
                        const y = 160 - (item.effectivePower / 100) * 140;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* 資料節點 */}
                  {historyScores.map((item, idx) => {
                    const x =
                      historyScores.length === 1
                        ? 260
                        : 50 + (idx / (historyScores.length - 1)) * 420;
                    const yRaw = 160 - (item.rawScore / 100) * 140;
                    const yPower = 160 - (item.effectivePower / 100) * 140;

                    return (
                      <g key={idx}>
                        <circle cx={x} cy={yRaw} r="3.5" fill="#94a3b8" />
                        <circle
                          cx={x}
                          cy={yPower}
                          r="5"
                          fill="#f59e0b"
                          stroke="#000"
                          strokeWidth="1.5"
                        />
                        <text
                          x={x}
                          y={yPower - 8}
                          textAnchor="middle"
                          fill="#f59e0b"
                          fontWeight="bold"
                        >
                          {item.effectivePower}
                        </text>
                        <text x={x} y="175" textAnchor="middle" fill="#94a3b8">
                          W{item.weekNumber}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* 歷次明細小卡 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                {historyScores.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">第 {h.weekNumber} 週</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {h.weekTitle}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-amber-400 font-pixel text-[11px]">
                        PWR {h.effectivePower}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        卷面 {h.rawScore} {h.hasBuff && "(+5護盾)"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
