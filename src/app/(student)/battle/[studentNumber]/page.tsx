"use client";

import { useEffect, useState, useRef } from "react";
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
  Volume2,
  VolumeX,
  Flame,
  Zap,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";
import { retroAudio } from "@/lib/audioEngine";
import { StudentBattleViewData, BattleLog, BattleStep } from "@/types";

export default function StudentBattlePage() {
  const params = useParams();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [data, setData] = useState<StudentBattleViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 戰鬥狀態控制
  const [currentRound, setCurrentRound] = useState<number>(0); // 0: 準備, 1: 試探交鋒, 2: 護盾防禦, 3: 職業奧義, 4: 結算
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x 或 2x
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 雙方即時血量與狀態
  const [hpA, setHpA] = useState<number>(100);
  const [hpB, setHpB] = useState<number>(100);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [clashFlash, setClashFlash] = useState<boolean>(false);

  // 護盾吸收動態顯示
  const [shieldAbsorbActiveA, setShieldAbsorbActiveA] = useState<boolean>(false);
  const [shieldAbsorbActiveB, setShieldAbsorbActiveB] = useState<boolean>(false);

  // 浮動傷害飄字
  const [floatDamageA, setFloatDamageA] = useState<number | null>(null);
  const [floatDamageB, setFloatDamageB] = useState<number | null>(null);

  // 職業大招 Banner
  const [activeSkillA, setActiveSkillA] = useState<string | null>(null);
  const [activeSkillB, setActiveSkillB] = useState<string | null>(null);

  // 戰況播報文字
  const [commentary, setCommentary] = useState<string>("雙方選手準備就緒...");

  // 學生互動集氣 (Cheer count & sparks)
  const [cheerCount, setCheerCount] = useState<number>(0);
  const [showCheerEffect, setShowCheerEffect] = useState<boolean>(false);

  const activeTimersRef = useRef<any[]>([]);

  function clearAllTimers() {
    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current = [];
  }

  // 載入資料
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
    return () => {
      clearAllTimers();
      retroAudio.stopBGM();
    };
  }, [studentNumber]);

  // 音效開關切換
  function toggleSound() {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    retroAudio.setMuted(!nextVal);
    if (nextVal && isPlaying) {
      retroAudio.startBGM();
    }
  }

  // 當資料載入完成，自動安排對戰演繹
  useEffect(() => {
    if (data?.currentMatch?.battleLog) {
      runMultiTurnBattle(data.currentMatch.battleLog, speedMultiplier);
    }
  }, [data]);

  // 學生點擊「集氣加油」互動按鈕
  function handleCheer() {
    setCheerCount((prev) => prev + 1);
    setShowCheerEffect(true);
    retroAudio.playMagic();
    setTimeout(() => setShowCheerEffect(false), 800);
  }

  // 多回合沉浸式戰鬥排程器
  function runMultiTurnBattle(log: BattleLog, speed: number = 1) {
    clearAllTimers();
    setIsPlaying(true);
    setCurrentRound(0);
    setHpA(100);
    setHpB(100);
    setFloatDamageA(null);
    setFloatDamageB(null);
    setShieldAbsorbActiveA(false);
    setShieldAbsorbActiveB(false);
    setActiveSkillA(null);
    setActiveSkillB(null);
    setIsShaking(false);
    setClashFlash(false);

    if (soundEnabled) {
      retroAudio.startBGM();
    }

    const baseUnit = 1000 / speed;

    const metaA = getAvatarMeta(log.playerA.avatarId);
    const metaB = getAvatarMeta(log.playerB.avatarId);

    // 回合 0: 登場 (0s)
    setCommentary(`【ROUND 0】${log.playerA.name} 與 ${log.playerB.name} 躍入對決擂台！`);

    // 回合 1: 試探交鋒 (1.6s)
    const t1 = setTimeout(() => {
      setCurrentRound(1);
      setCommentary(`【回合 1：試探交鋒】雙方展開兵刃突刺！`);
      retroAudio.playSlash();

      const r1 = log.steps.find((s) => s.round === 1);
      if (r1) {
        setFloatDamageA(r1.damageToA || 8);
        setFloatDamageB(r1.damageToB || 8);
        setHpA(r1.hpAfterA || 90);
        setHpB(r1.hpAfterB || 90);
      }
    }, 1.6 * baseUnit);

    // 回合 2: 作業護盾防禦回合 (3.4s) - 核心亮點：護盾實際吸收傷害！
    const t2 = setTimeout(() => {
      setCurrentRound(2);
      setFloatDamageA(null);
      setFloatDamageB(null);

      const r2 = log.steps.find((s) => s.round === 2);
      const hasShieldA = log.playerA.buff > 0;
      const hasShieldB = log.playerB.buff > 0;

      if (hasShieldA || hasShieldB) {
        setShieldAbsorbActiveA(hasShieldA);
        setShieldAbsorbActiveB(hasShieldB);
        retroAudio.playShieldBlock(); // 觸發清脆金屬護盾音效
        setCommentary(
          hasShieldA && hasShieldB
            ? `【回合 2：護盾防禦】雙方作業護盾金色屏障展開！各自吸收 5 點傷害！`
            : hasShieldA
            ? `【回合 2：護盾防禦】${log.playerA.name} 作業護盾激發！吸收 5 點致命傷害！`
            : `【回合 2：護盾防禦】${log.playerB.name} 作業護盾激發！吸收 5 點致命傷害！`
        );
      } else {
        setCommentary(`【回合 2：無護盾硬撼】雙方本週作業皆未齊，無護盾減傷，受到全額打擊！`);
        retroAudio.playHit();
      }

      if (r2) {
        setFloatDamageA(r2.damageToA ?? 10);
        setFloatDamageB(r2.damageToB ?? 10);
        setHpA(r2.hpAfterA ?? 75);
        setHpB(r2.hpAfterB ?? 75);
      } else {
        setFloatDamageA(10);
        setFloatDamageB(10);
        setHpA(75);
        setHpB(75);
      }
    }, 3.5 * baseUnit);

    // 回合 3: 職業奧義決戰 (5.4s) - 核心亮點：雙方職業技能爆發！
    const t3 = setTimeout(() => {
      setCurrentRound(3);
      setShieldAbsorbActiveA(false);
      setShieldAbsorbActiveB(false);
      setActiveSkillA(metaA.skillName);
      setActiveSkillB(metaB.skillName);

      setCommentary(
        `【回合 3：奧義決戰】${log.playerA.name} 施放【${metaA.skillName}】！${log.playerB.name} 爆發【${metaB.skillName}】！！`
      );

      retroAudio.playCrit(); // 暴擊重擊音效
      setIsShaking(true);
      setClashFlash(true);

      const r3 = log.steps.find((s) => s.round === 3);
      if (r3) {
        setFloatDamageA(r3.damageToA ?? 20);
        setFloatDamageB(r3.damageToB ?? 20);
      } else {
        setFloatDamageA(Math.max(15, 100 - log.playerA.finalHp));
        setFloatDamageB(Math.max(15, 100 - log.playerB.finalHp));
      }
      setHpA(log.playerA.finalHp);
      setHpB(log.playerB.finalHp);

      const tShake = setTimeout(() => {
        setIsShaking(false);
        setClashFlash(false);
      }, 0.6 * baseUnit);
      activeTimersRef.current.push(tShake);
    }, 5.5 * baseUnit);

    // 回合 4: 結算勝負 (7.5s)
    const t4 = setTimeout(() => {
      setCurrentRound(4);
      setIsPlaying(false);
      setActiveSkillA(null);
      setActiveSkillB(null);
      retroAudio.stopBGM();

      if (log.winner === "A") {
        setCommentary(`【戰鬥結算】${log.playerA.name} 憑藉強大戰力獲得勝利！`);
        retroAudio.playVictory();
      } else if (log.winner === "B") {
        setCommentary(`【戰鬥結算】${log.playerB.name} 憑藉強大戰力獲得勝利！`);
        retroAudio.playVictory();
      } else {
        setCommentary(`【戰鬥結算】雙方勢均力敵，戰成平手！`);
        retroAudio.playDefeat();
      }
    }, 7.5 * baseUnit);

    activeTimersRef.current.push(t1, t2, t3, t4);
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

  const myDamage = isPlayerA ? floatDamageA : floatDamageB;
  const opponentDamage = isPlayerA ? floatDamageB : floatDamageA;

  const myShieldAbsorb = isPlayerA ? shieldAbsorbActiveA : shieldAbsorbActiveB;
  const opponentShieldAbsorb = isPlayerA ? shieldAbsorbActiveB : shieldAbsorbActiveA;

  const myActiveSkill = isPlayerA ? activeSkillA : activeSkillB;
  const opponentActiveSkill = isPlayerA ? activeSkillB : activeSkillA;

  const myAvatar = getAvatarMeta(student.avatarId);
  const opponentAvatar = getAvatarMeta(currentMatch?.opponentAvatar);

  const isMyWin = currentMatch?.result === "win";
  const isMyLoss = currentMatch?.result === "loss";
  const isMyDraw = currentMatch?.result === "draw";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 頂部資訊列與聲音開關 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111827]/90 border border-slate-700/80 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-2xl shadow-inner">
            {myAvatar.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white">{student.name} 的專屬戰鬥室</h1>
              <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                {student.studentNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-sans">
              <span className="text-cyan-400 font-semibold">{myAvatar.name}</span>
              <span>({myAvatar.role})</span>
              <span>•</span>
              <span className="text-amber-300">奧義：{myAvatar.skillName}</span>
            </div>
          </div>
        </div>

        {/* 右側操作按鈕 (音效切換、倍速、切換學號) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 音效開關按鈕 */}
          <button
            type="button"
            onClick={toggleSound}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              soundEnabled
                ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/60 hover:bg-indigo-900"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="開關 8-bit BGM 與戰鬥音效"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono">{soundEnabled ? "音效 ON" : "靜音"}</span>
          </button>

          {/* 倍速切換 (1x / 2x) */}
          <button
            type="button"
            onClick={() => {
              const next = speedMultiplier === 1 ? 2 : 1;
              setSpeedMultiplier(next);
              if (matchLog) runMultiTurnBattle(matchLog, next);
            }}
            className="px-2.5 py-1.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 transition-colors"
          >
            {speedMultiplier}x 速
          </button>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-800 transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>切換</span>
          </Link>
        </div>
      </div>

      {/* 2D 像素戰鬥舞台 (16-bit Arcade Multi-Turn Fighting Arena) */}
      {currentMatch && matchLog ? (
        <div
          className={`relative bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#1e293b] border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl transition-transform ${
            isShaking ? "animate-battle-shake border-rose-500" : ""
          } ${clashFlash ? "brightness-125" : ""}`}
          style={{ minHeight: "460px" }}
        >
          {/* 頂部回合進度條與重播 */}
          <div className="relative z-10 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 bg-[#080d18]/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
                {currentRound === 0
                  ? "READY"
                  : currentRound <= 3
                  ? `ROUND ${currentRound} / 3`
                  : "KO!"}
              </span>
              <span className="text-slate-200 text-xs font-semibold truncate max-w-xs sm:max-w-md font-sans">
                {currentMatch.weekTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 互動點擊集氣加油按鈕 */}
              <button
                type="button"
                onClick={handleCheer}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-pixel text-[10px] rounded transition-all flex items-center gap-1 shadow-sm active:scale-95"
                title="點擊為自己的角色集氣加油！"
              >
                <Flame className="w-3 h-3 text-white fill-white" />
                <span>CHEER! {cheerCount > 0 && `(${cheerCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => runMultiTurnBattle(matchLog, speedMultiplier)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-pixel text-[10px] transition-all flex items-center gap-1 border border-slate-600 hover:border-amber-400"
              >
                <RotateCcw className="w-3 h-3" />
                <span>REPLAY</span>
              </button>
            </div>
          </div>

          {/* 戰鬥中央舞台 */}
          <div className="relative z-10 px-4 sm:px-10 py-6 flex flex-col justify-between" style={{ minHeight: "380px" }}>
            {/* 雙方厚邊框血條 + 護盾屏障條 */}
            <div className="grid grid-cols-2 gap-6 sm:gap-14">
              {/* 左方玩家狀態列 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{student.name}</span>
                    <span className="font-pixel text-[9px] text-sky-400">({student.studentNumber})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-sans">
                      {myAvatar.name}
                    </span>
                  </div>
                  <span className="font-pixel text-[10px] text-emerald-400">
                    {myHp} / 100 HP
                  </span>
                </div>

                {/* 厚邊框像素血條 */}
                <div className="w-full h-4 bg-[#450a0a] rounded-xs p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative overflow-hidden">
                  <div
                    className="h-full rounded-xs transition-all duration-500"
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
                      <Shield className="w-3 h-3 text-cyan-400" />
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

              {/* 右方對手狀態列 */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between text-xs flex-row-reverse">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{currentMatch.opponentName}</span>
                    <span className="font-pixel text-[9px] text-amber-400">
                      {opponentFighter?.isBot ? "[BOT]" : `(${opponentFighter?.studentNumber})`}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-sans">
                      {opponentAvatar.name}
                    </span>
                  </div>
                  <span className="font-pixel text-[10px] text-emerald-400">
                    {opponentHp} / 100 HP
                  </span>
                </div>

                {/* 厚邊框像素血條 (右側反向) */}
                <div className="w-full h-4 bg-[#450a0a] rounded-xs p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex justify-end relative overflow-hidden">
                  <div
                    className="h-full rounded-xs transition-all duration-500"
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
                      <Shield className="w-3 h-3 text-cyan-400" />
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
            <div className="relative my-6 flex items-center justify-between px-4 sm:px-14">
              {/* 左方選手容器 */}
              <div
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  currentRound === 1 || currentRound === 3 ? "animate-dash-left" : ""
                } ${currentRound === 4 && isMyLoss ? "opacity-30 grayscale translate-y-3" : ""}`}
              >
                {/* 職業大招施放 Banner */}
                {myActiveSkill && (
                  <div className="absolute -top-12 px-3 py-1 rounded bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 text-black font-pixel text-[9px] shadow-[0_0_15px_rgba(245,158,11,1)] flex items-center gap-1 animate-skill-pop z-30 font-bold whitespace-nowrap">
                    <span>{myAvatar.skillIcon}</span>
                    <span>【{myActiveSkill}】!!</span>
                  </div>
                )}

                {/* 護盾防禦吸收特效 (Round 2 觸發) */}
                {myShieldAbsorb && (
                  <div className="absolute -inset-4 rounded-full border-4 border-cyan-400 bg-cyan-400/20 animate-shield-absorb z-20 pointer-events-none flex items-center justify-center">
                    <span className="font-pixel text-[10px] text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-slate-900/90 px-2 py-0.5 rounded border border-amber-400 -mt-16">
                      🛡️ ABSORB 5!
                    </span>
                  </div>
                )}

                {/* 常駐護盾發光小徽章 */}
                {myFighter?.buff && currentRound < 4 ? (
                  <div className="absolute -top-6 px-1.5 py-0.2 rounded bg-sky-950 border border-sky-400 text-sky-300 font-pixel text-[8px] shadow-[0_0_10px_rgba(56,189,248,0.8)] flex items-center gap-1 z-10">
                    <Shield className="w-2.5 h-2.5 text-amber-400" />
                    <span>SHIELD</span>
                  </div>
                ) : null}

                {/* 浮動扣血飄字 */}
                {myDamage && myDamage > 0 && (
                  <div className="absolute -top-12 font-pixel text-lg sm:text-xl text-rose-400 animate-float-damage pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-30">
                    -{myDamage} HP
                  </div>
                )}

                {/* 角色外觀主體 */}
                <div
                  className={`w-24 h-24 rounded-xl flex items-center justify-center text-5xl bg-gradient-to-br ${myAvatar.bgGradient} border-2 ${myAvatar.border} shadow-xl relative z-10 transition-transform ${
                    currentRound === 4 && isMyWin ? "scale-110 animate-bounce" : ""
                  }`}
                >
                  {myAvatar.emoji}
                </div>

                {/* 站立微光基座 */}
                <div className="w-28 h-6 -mt-3 bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20 rounded-full blur-[2px] border border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white">{student.name}</span>
                </div>
              </div>

              {/* 中間對決動態指示器 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                {currentRound === 0 && (
                  <div className="font-pixel text-[11px] text-amber-400 tracking-widest animate-pulse">
                    READY...
                  </div>
                )}
                {currentRound === 1 && (
                  <div className="font-pixel text-xs text-sky-400 animate-bounce">
                    ⚔️ CLASH 1!
                  </div>
                )}
                {currentRound === 2 && (
                  <div className="font-pixel text-[10px] text-amber-300 animate-pulse flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SHIELD DEFENSE</span>
                  </div>
                )}
                {currentRound === 3 && (
                  <div className="font-pixel text-sm sm:text-base text-rose-400 animate-bounce">
                    💥 ULTIMATE!!
                  </div>
                )}

                {/* 學生點擊集氣加油飄字 */}
                {showCheerEffect && (
                  <div className="font-pixel text-[11px] text-amber-300 animate-cheer-spark pointer-events-none drop-shadow">
                    ⭐ CHEER UP! +PWR!
                  </div>
                )}

                {/* 結算彈窗：經典 16-bit Arcade 像素風格卡片 */}
                {currentRound === 4 && (
                  <div className="animate-fadeIn p-4 rounded-lg bg-[#0b0f19]/95 border-2 border-slate-400 shadow-2xl max-w-xs space-y-2">
                    {isMyWin && (
                      <div className="space-y-1">
                        <div className="font-pixel text-xl sm:text-2xl text-[#F59E0B] tracking-wider drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
                          VICTORY
                        </div>
                        <p className="text-xs text-slate-200 font-sans">
                          🏆 恭喜獲勝！有效戰力壓制勝出！
                        </p>
                      </div>
                    )}
                    {isMyLoss && (
                      <div className="space-y-1">
                        <div className="font-pixel text-xl sm:text-2xl text-[#E11D48] tracking-wider drop-shadow-[0_0_12px_rgba(225,29,72,0.8)]">
                          DEFEAT
                        </div>
                        <p className="text-xs text-slate-200 font-sans">
                          惜敗！下週務必完成作業領取護盾！
                        </p>
                      </div>
                    )}
                    {isMyDraw && (
                      <div className="space-y-1">
                        <div className="font-pixel text-xl sm:text-2xl text-amber-400 tracking-wider">
                          DRAW
                        </div>
                        <p className="text-xs text-slate-200 font-sans">
                          勢均力敵！雙方打出精彩平手！
                        </p>
                      </div>
                    )}

                    {/* 護盾效果回饋 */}
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 font-sans">
                      {myFighter?.buff ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-center">
                          <Shield className="w-3 h-3 text-cyan-400" />
                          作業護盾為您成功吸收 5 點傷害！
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1 justify-center">
                          <AlertCircle className="w-3 h-3" />
                          未繳齊作業：無護盾加成，承受全額傷害
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右方對手容器 */}
              <div
                className={`relative flex flex-col items-center transition-all duration-500 ${
                  currentRound === 1 || currentRound === 3 ? "animate-dash-right" : ""
                } ${currentRound === 4 && isMyWin ? "opacity-30 grayscale translate-y-3" : ""}`}
              >
                {/* 職業大招施放 Banner */}
                {opponentActiveSkill && (
                  <div className="absolute -top-12 px-3 py-1 rounded bg-gradient-to-r from-purple-500 via-rose-500 to-indigo-600 text-white font-pixel text-[9px] shadow-[0_0_15px_rgba(225,29,72,1)] flex items-center gap-1 animate-skill-pop z-30 font-bold whitespace-nowrap">
                    <span>{opponentAvatar.skillIcon}</span>
                    <span>【{opponentActiveSkill}】!!</span>
                  </div>
                )}

                {/* 護盾防禦吸收特效 (Round 2 觸發) */}
                {opponentShieldAbsorb && (
                  <div className="absolute -inset-4 rounded-full border-4 border-cyan-400 bg-cyan-400/20 animate-shield-absorb z-20 pointer-events-none flex items-center justify-center">
                    <span className="font-pixel text-[10px] text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-slate-900/90 px-2 py-0.5 rounded border border-amber-400 -mt-16">
                      🛡️ ABSORB 5!
                    </span>
                  </div>
                )}

                {/* 常駐護盾發光小徽章 */}
                {opponentFighter?.buff && currentRound < 4 ? (
                  <div className="absolute -top-6 px-1.5 py-0.2 rounded bg-sky-950 border border-sky-400 text-sky-300 font-pixel text-[8px] shadow-[0_0_10px_rgba(56,189,248,0.8)] flex items-center gap-1 z-10">
                    <Shield className="w-2.5 h-2.5 text-amber-400" />
                    <span>SHIELD</span>
                  </div>
                ) : null}

                {/* 浮動扣血飄字 */}
                {opponentDamage && opponentDamage > 0 && (
                  <div className="absolute -top-12 font-pixel text-lg sm:text-xl text-rose-400 animate-float-damage pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-30">
                    -{opponentDamage} HP
                  </div>
                )}

                {/* 角色外觀主體 */}
                <div
                  className={`w-24 h-24 rounded-xl flex items-center justify-center text-5xl bg-gradient-to-br ${opponentAvatar.bgGradient} border-2 ${opponentAvatar.border} shadow-xl relative z-10 transition-transform ${
                    currentRound === 4 && isMyLoss ? "scale-110 animate-bounce" : ""
                  }`}
                >
                  {opponentFighter?.isBot ? "🤖" : opponentAvatar.emoji}
                </div>

                {/* 站立微光基座 */}
                <div className="w-28 h-6 -mt-3 bg-gradient-to-r from-amber-500/20 via-orange-400/40 to-amber-500/20 rounded-full blur-[2px] border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white">
                    {currentMatch.opponentName}
                  </span>
                </div>
              </div>
            </div>

            {/* 底部即時戰鬥播報日誌 (Arcade Live Ticker) */}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-md text-center text-xs text-amber-300 font-sans tracking-wide">
              {commentary}
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
