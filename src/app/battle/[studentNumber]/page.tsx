"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Swords,
  Shield,
  Trophy,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
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

  // 動畫播放階段控制 (0: 準備, 1: 登場, 2: 護盾充能, 3: 衝撞扣血, 4: 結算)
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
      } catch (err) {
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

  // 動畫排程播放器 (約 6 秒)
  function startBattleAnimation(log: BattleLog) {
    setIsPlaying(true);
    setAnimStage(1);
    setHpA(100);
    setHpB(100);
    setIsShaking(false);
    setShowDamage(false);

    // 0 ~ 1.6s: 登場
    // 1.6s ~ 3.2s: 作業護盾 Buff 充能
    const timer1 = setTimeout(() => {
      setAnimStage(2);
    }, 1600);

    // 3.2s ~ 4.8s: 衝撞、畫面震動、扣血飄字
    const timer2 = setTimeout(() => {
      setAnimStage(3);
      setIsShaking(true);
      setShowDamage(true);
      // 血條扣減
      setHpA(log.playerA.finalHp);
      setHpB(log.playerB.finalHp);
    }, 3200);

    // 停止震動
    const timerShake = setTimeout(() => {
      setIsShaking(false);
    }, 3800);

    // 4.8s+: 結算勝負
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
        <div className="text-cyber-cyan font-mono text-xs tracking-widest uppercase">
          // 正在載入 {studentNumber} 像素戰鬥日誌...
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-cyber-card border border-red-500/40 p-8 rounded-lg text-center space-y-5 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">查無學生資料</h2>
          <p className="text-xs text-slate-300">{errorMsg}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-cyan text-black font-bold text-xs rounded hover:bg-cyber-cyan/80 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首頁重新輸入</span>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* 頂部學生身分列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-cyber-card border border-cyber-border rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-cyber-darkest border border-cyber-border-bright flex items-center justify-center text-2xl shadow-inner">
            {myAvatar.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{student.name} 的專屬戰鬥室</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40">
                {student.studentNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>職業：{myAvatar.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Lock className="w-3 h-3" />
                個人專屬隱私隔離
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 self-start sm:self-auto transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>切換學號</span>
        </Link>
      </div>

      {/* 2D 像素戰鬥舞台區 */}
      {currentMatch && matchLog ? (
        <div
          className={`relative bg-black border-2 border-cyber-border-bright rounded-xl overflow-hidden shadow-2xl transition-transform ${
            isShaking ? "animate-battle-shake border-red-500" : ""
          }`}
          style={{ minHeight: "420px" }}
        >
          {/* 像素掃描線背景與競技場風格 */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-zinc-900 to-black pointer-events-none" />
          <div className="absolute inset-0 bg-grid-tech opacity-30 pointer-events-none" />

          {/* 頂部週次標題與重播按鈕 */}
          <div className="relative z-10 p-4 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                第 {currentMatch.weekNumber} 週對決
              </span>
              <span className="text-slate-300 font-bold truncate max-w-xs sm:max-w-md">
                {currentMatch.weekTitle}
              </span>
            </div>

            <button
              onClick={() => startBattleAnimation(matchLog)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-700 hover:border-cyber-cyan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新播放動畫</span>
            </button>
          </div>

          {/* 戰鬥中央舞台 */}
          <div className="relative z-10 px-4 sm:px-12 py-8 flex flex-col justify-between" style={{ minHeight: "340px" }}>
            {/* 雙方血條與資訊列 */}
            <div className="grid grid-cols-2 gap-6 sm:gap-12">
              {/* 左方：我的戰力與血條 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <div className="flex items-center gap-1 text-white">
                    <span>{student.name}</span>
                    <span className="text-[10px] text-cyber-cyan">({student.studentNumber})</span>
                  </div>
                  <span className="text-emerald-400 font-mono">{myHp} / 100 HP</span>
                </div>

                {/* HP 條 */}
                <div className="w-full h-3.5 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700 p-0.5">
                  <div
                    className={`h-full transition-all duration-700 rounded-sm ${
                      myHp > 50 ? "bg-emerald-500" : myHp > 20 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(0, myHp)}%` }}
                  />
                </div>

                {/* 戰力拆解標籤 */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>卷面: {myFighter?.rawScore}</span>
                  {myFighter?.buff ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Shield className="w-3 h-3" />
                      +5護盾
                    </span>
                  ) : (
                    <span className="text-slate-500">+0</span>
                  )}
                  <span className="text-white font-bold font-mono">
                    = 戰力 {myFighter?.effectivePower}
                  </span>
                </div>
              </div>

              {/* 右方：對手戰力與血條 */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between text-xs font-mono font-bold flex-row-reverse">
                  <div className="flex items-center gap-1 text-white">
                    <span>{currentMatch.opponentName}</span>
                    <span className="text-[10px] text-amber-400">
                      {opponentFighter?.isBot ? "[替身機器人]" : `(${opponentFighter?.studentNumber})`}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono">{opponentHp} / 100 HP</span>
                </div>

                {/* HP 條 (反向填滿) */}
                <div className="w-full h-3.5 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700 p-0.5 flex justify-end">
                  <div
                    className={`h-full transition-all duration-700 rounded-sm ${
                      opponentHp > 50
                        ? "bg-emerald-500"
                        : opponentHp > 20
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(0, opponentHp)}%` }}
                  />
                </div>

                {/* 戰力拆解標籤 */}
                <div className="flex items-center justify-end gap-2 text-[11px] text-slate-400">
                  <span className="text-white font-bold font-mono">
                    戰力 {opponentFighter?.effectivePower} =
                  </span>
                  {opponentFighter?.buff ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Shield className="w-3 h-3" />
                      +5護盾
                    </span>
                  ) : (
                    <span className="text-slate-500">+0</span>
                  )}
                  <span>卷面: {opponentFighter?.rawScore}</span>
                </div>
              </div>
            </div>

            {/* 角色戰鬥立體對決區 */}
            <div className="relative my-8 flex items-center justify-between px-6 sm:px-20">
              {/* 左方英雄角色 */}
              <div
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  animStage === 3 ? "animate-hero-dash-left" : ""
                } ${animStage === 4 && isMyLoss ? "opacity-40 grayscale translate-y-4" : ""}`}
              >
                {/* 護盾特效光環 */}
                {animStage >= 2 && myFighter?.buff ? (
                  <div className="absolute -inset-4 rounded-full border-2 border-amber-400 animate-shield-pulse pointer-events-none" />
                ) : null}

                {/* 飄字傷害 */}
                {showDamage && (
                  <div className="absolute -top-10 text-red-400 font-black text-2xl font-mono animate-floatDamage pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    -{myDamage} HP
                  </div>
                )}

                {/* 角色外觀主體 */}
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl bg-gradient-to-br ${myAvatar.bgGradient} border-2 ${myAvatar.border} shadow-2xl transition-transform ${
                    animStage === 4 && isMyWin ? "scale-110 animate-bounce" : ""
                  }`}
                >
                  {myAvatar.emoji}
                </div>

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white">{student.name}</span>
                  {animStage >= 2 && myFighter?.buff ? (
                    <span className="block text-[10px] text-amber-300 font-bold animate-pulse">
                      🛡️ 護盾充能 +5
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 中間特效文字 */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                {animStage === 1 && (
                  <div className="text-xs font-mono font-bold text-cyber-cyan tracking-widest animate-pulse">
                    READY...
                  </div>
                )}
                {animStage === 2 && (
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-fadeIn">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>作業護盾充能中</span>
                  </div>
                )}
                {animStage === 3 && (
                  <div className="text-base font-black text-rose-500 tracking-wider animate-bounce">
                    💥 CLASH!!
                  </div>
                )}
                {animStage === 4 && (
                  <div className="animate-fadeIn">
                    {isMyWin && (
                      <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-lg shadow-neon-cyan">
                        <div className="text-xl font-black text-emerald-400 tracking-wider">
                          VICTORY 勝利！
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          恭喜戰力壓制，拿下本週勝利！
                        </div>
                      </div>
                    )}
                    {isMyLoss && (
                      <div className="p-3 bg-red-950/90 border border-red-500 rounded-lg shadow-neon-red">
                        <div className="text-xl font-black text-red-400 tracking-wider">
                          DEFEAT 惜敗
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          差一點點！下週補齊作業再戰！
                        </div>
                      </div>
                    )}
                    {isMyDraw && (
                      <div className="p-3 bg-amber-950/90 border border-amber-500 rounded-lg shadow-neon-gold">
                        <div className="text-xl font-black text-amber-400 tracking-wider">
                          DRAW 平局！
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          實力旗鼓相當，握手言和！
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 右方對手角色 */}
              <div
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  animStage === 3 ? "animate-hero-dash-right" : ""
                } ${animStage === 4 && isMyWin ? "opacity-40 grayscale translate-y-4" : ""}`}
              >
                {/* 護盾特效光環 */}
                {animStage >= 2 && opponentFighter?.buff ? (
                  <div className="absolute -inset-4 rounded-full border-2 border-amber-400 animate-shield-pulse pointer-events-none" />
                ) : null}

                {/* 飄字傷害 */}
                {showDamage && (
                  <div className="absolute -top-10 text-red-400 font-black text-2xl font-mono animate-floatDamage pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    -{opponentDamage} HP
                  </div>
                )}

                {/* 角色外觀主體 */}
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl bg-gradient-to-br ${opponentAvatar.bgGradient} border-2 ${opponentAvatar.border} shadow-2xl transition-transform ${
                    animStage === 4 && isMyLoss ? "scale-110 animate-bounce" : ""
                  }`}
                >
                  {opponentFighter?.isBot ? "🤖" : opponentAvatar.emoji}
                </div>

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white">
                    {currentMatch.opponentName}
                  </span>
                  {animStage >= 2 && opponentFighter?.buff ? (
                    <span className="block text-[10px] text-amber-300 font-bold animate-pulse">
                      🛡️ 護盾充能 +5
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 底部說明文字 */}
            <div className="text-center text-xs text-slate-400 font-mono pt-2 border-t border-zinc-800">
              {matchLog.summary}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-cyber-card border border-cyber-border rounded-xl text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
          <h2 className="text-lg font-bold text-white">本週週考對戰準備中</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            老師目前正在為全班登記作業與成績批改。待結算完成後，將在此自動播放您的專屬
            2D 像素戰鬥動畫！
          </p>
        </div>
      )}

      {/* 個人數據面板 (隱私隔離) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 個人歷史戰報統計 */}
        <div className="bg-cyber-card border border-cyber-border p-5 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-cyber-border/60 pb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>個人累積戰報統計</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-cyber-darkest rounded border border-emerald-500/30">
              <div className="text-xs text-emerald-400 font-bold">勝場</div>
              <div className="text-xl font-black text-white font-mono mt-1">
                {stats.wins}
              </div>
            </div>

            <div className="p-3 bg-cyber-darkest rounded border border-amber-500/30">
              <div className="text-xs text-amber-400 font-bold">平手</div>
              <div className="text-xl font-black text-white font-mono mt-1">
                {stats.draws}
              </div>
            </div>

            <div className="p-3 bg-cyber-darkest rounded border border-red-500/30">
              <div className="text-xs text-red-400 font-bold">惜敗</div>
              <div className="text-xl font-black text-white font-mono mt-1">
                {stats.losses}
              </div>
            </div>
          </div>

          <div className="p-3 bg-cyber-darkest rounded border border-cyber-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">總出戰場次：</span>
              <span className="font-mono font-bold text-white">{stats.totalMatches} 場</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">個人總勝率：</span>
              <span className="font-mono font-bold text-cyber-cyan">{stats.winRate}%</span>
            </div>

            {/* 進度條 */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-cyan to-emerald-400"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 rounded border border-zinc-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-cyber-cyan shrink-0 mt-0.5" />
            <span>
              隱私隔離：您的成績與戰況僅限以個人學號登入查看，全班無公開排行榜，請安心挑戰自我！
            </span>
          </div>
        </div>

        {/* 歷次週考個人成績與戰力折線圖 */}
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border/60 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-cyber-cyan" />
              <span>歷次週考成績與戰力走勢圖</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block" />
                原始卷面分數
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block" />
                有效戰力 (+5 護盾)
              </span>
            </div>
          </div>

          {historyScores.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              尚未有歷次週考成績紀錄。完成本週結算後將即時在此繪製成長趨勢圖！
            </div>
          ) : (
            <div className="space-y-4">
              {/* SVG 互動折線圖 */}
              <div className="w-full bg-cyber-darkest/90 border border-cyber-border-bright rounded p-4 overflow-x-auto">
                <svg
                  viewBox="0 0 500 180"
                  className="w-full h-44 overflow-visible font-mono text-[10px]"
                >
                  {/* 背景水平格線 */}
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y = 160 - (val / 100) * 140;
                    return (
                      <g key={val}>
                        <line
                          x1="35"
                          y1={y}
                          x2="490"
                          y2={y}
                          stroke="#27272a"
                          strokeDasharray="2,2"
                        />
                        <text x="5" y={y + 3} fill="#71717a">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* 繪製折線點 */}
                  {historyScores.length > 0 && (
                    <>
                      {/* 原始卷面折線 (灰白) */}
                      <polyline
                        fill="none"
                        stroke="#94a3b8"
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

                      {/* 有效戰力折線 (金黃) */}
                      <polyline
                        fill="none"
                        stroke="#fbbf24"
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
                            {/* 原始分數點 */}
                            <circle cx={x} cy={yRaw} r="3.5" fill="#94a3b8" />
                            {/* 有效戰力點 */}
                            <circle
                              cx={x}
                              cy={yPower}
                              r="5"
                              fill="#fbbf24"
                              stroke="#000"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={yPower - 8}
                              textAnchor="middle"
                              fill="#fbbf24"
                              fontWeight="bold"
                            >
                              {item.effectivePower}
                            </text>
                            {/* X 軸標籤 */}
                            <text x={x} y="175" textAnchor="middle" fill="#a1a1aa">
                              W{item.weekNumber}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>

              {/* 歷次明細卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {historyScores.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 bg-cyber-darkest border border-cyber-border rounded flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">第 {h.weekNumber} 週</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {h.weekTitle}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-amber-300 font-mono font-bold">
                        戰力 {h.effectivePower} 分
                      </div>
                      <div className="text-[10px] text-slate-500">
                        原始卷面 {h.rawScore} 分 {h.hasBuff && "(+5 護盾)"}
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

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
