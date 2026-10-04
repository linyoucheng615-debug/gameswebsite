"use client";

import { useEffect, useState, useRef } from "react";
import {
  Shield,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  X,
  FastForward,
  Trophy,
  Zap,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { retroAudio } from "@/lib/audioEngine";
import { StudentBattleViewData, BattleLog } from "@/types";
import PixelFighterSprite, {
  SkinGender,
  SkinClass,
  SkinColor,
  FighterAction,
} from "@/components/PixelFighterSprite";

interface BattleArenaPlayerProps {
  data: StudentBattleViewData;
  onClose?: () => void;
  autoStart?: boolean;
}

export default function BattleArenaPlayer({
  data,
  onClose,
  autoStart = true,
}: BattleArenaPlayerProps) {
  const { student, currentMatch } = data;

  // 取得對戰資料與腳本
  const battleLog: BattleLog | null = currentMatch?.battleLog || null;
  const fighterA = battleLog?.playerA;
  const fighterB = battleLog?.playerB;

  // 造型外觀
  const mySkin = currentMatch?.mySkin || fighterA?.skin || {
    gender: (student.skinGender as SkinGender) || "boy",
    charClass: (student.skinClass as SkinClass) || "warrior",
    color: (student.skinColor as SkinColor) || "blue",
  };

  const oppSkin = currentMatch?.opponentSkin || fighterB?.skin || {
    gender: "girl" as SkinGender,
    charClass: "mage" as SkinClass,
    color: "red" as SkinColor,
  };

  // 數值與狀態初始化 (0~5s)
  // HP = 週考三科平均成績
  const initialHpA = Math.min(100, Math.max(35, fighterA?.initialHp || currentMatch?.myStartingHp || 90));
  const initialHpB = Math.min(100, Math.max(35, fighterB?.initialHp || currentMatch?.opponentStartingHp || 85));

  const hasBuffA = fighterA?.buff ? fighterA.buff > 0 : (currentMatch?.myHasBuff ?? true);
  const hasBuffB = fighterB?.buff ? fighterB.buff > 0 : (currentMatch?.opponentHasBuff ?? false);

  const allChallengesCorrectA = fighterA?.challengeBonus ? fighterA.challengeBonus > 0 : true;
  const allChallengesCorrectB = fighterB?.challengeBonus ? fighterB.challengeBonus > 0 : false;

  const hasUltA = fighterA?.hasUltimate ?? true;
  const hasUltB = fighterB?.hasUltimate ?? false;

  const skillNameA = fighterA?.highestSkillName || "📐 幾何爆破";
  const skillNameB = fighterB?.highestSkillName || "🔤 語法雷擊";

  // 狀態管理
  // 階段 phase: 0 (0~5s 登場), 1 (5~15s R1普攻), 2 (15~25s R2學科絕技), 3 (25~35s R3逆轉奧義), 4 (35s+ 結算)
  const [phase, setPhase] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  // 雙方血量
  const [hpA, setHpA] = useState<number>(initialHpA);
  const [hpB, setHpB] = useState<number>(initialHpB);

  // 氣量槽 (0 ~ 3)
  const [energyA, setEnergyA] = useState<number>(hasBuffA ? 1 : 0);
  const [energyB, setEnergyB] = useState<number>(hasBuffB ? 1 : 0);

  // 角色精靈動作
  const [actionA, setActionA] = useState<FighterAction>("idle");
  const [actionB, setActionB] = useState<FighterAction>("idle");

  // 飄字與特效
  const [floatDamageA, setFloatDamageA] = useState<{ val: number; isCrit?: boolean } | null>(null);
  const [floatDamageB, setFloatDamageB] = useState<{ val: number; isCrit?: boolean } | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [superFlashDark, setSuperFlashDark] = useState<boolean>(false);
  const [activeBanner, setActiveBanner] = useState<{ title: string; subtitle: string; color: string } | null>(null);

  // 跑馬燈解說
  const [commentary, setCommentary] = useState<string>("雙方冒險者就位，35 秒戰鬥引擎啟動！");

  // 終局結果
  const [finalWinner, setFinalWinner] = useState<"A" | "B" | "DRAW" | null>(null);

  const activeTimersRef = useRef<any[]>([]);
  const intervalRef = useRef<any>(null);

  function clearAllTimers() {
    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearAllTimers();
      retroAudio.stopBGM();
    };
  }, []);

  function toggleSound() {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    retroAudio.setMuted(!nextVal);
    if (nextVal && isPlaying) {
      retroAudio.startBGM();
    }
  }

  // 啟動 35 秒戰鬥引擎
  function run35sBattle(speed: number = 1) {
    clearAllTimers();
    setIsPlaying(true);
    setPhase(0);
    setElapsedSeconds(0);
    setHpA(initialHpA);
    setHpB(initialHpB);
    setEnergyA(hasBuffA ? 1 : 0);
    setEnergyB(hasBuffB ? 1 : 0);
    setActionA("idle");
    setActionB("idle");
    setFloatDamageA(null);
    setFloatDamageB(null);
    setIsShaking(false);
    setSuperFlashDark(false);
    setActiveBanner(null);
    setFinalWinner(null);

    if (soundEnabled) {
      retroAudio.startBGM();
    }

    // 計算各回合預估扣血 (若有 battleLog steps 則參照其數值)
    const step1 = battleLog?.steps?.find((s) => s.type === "ROUND_1");
    const step2 = battleLog?.steps?.find((s) => s.type === "ROUND_2_SKILL");
    const step3 = battleLog?.steps?.find((s) => s.type === "ROUND_3_ULTIMATE");

    const r1_dmgA = step1?.damageToA ?? 16;
    const r1_dmgB = step1?.damageToB ?? 22;
    const r2_dmgA = step2?.damageToA ?? 20;
    const r2_dmgB = step2?.damageToB ?? 25;
    const r3_dmgA = step3?.damageToA ?? (hasUltB ? 50 : 15);
    const r3_dmgB = step3?.damageToB ?? (hasUltA ? 50 : 15);

    const finishWinner = battleLog?.winner || (initialHpA - r1_dmgA - r2_dmgA - r3_dmgA > initialHpB - r1_dmgB - r2_dmgB - r3_dmgB ? "A" : "B");

    // 秒數計時器
    const secDuration = 1000 / speed;
    let secCounter = 0;
    intervalRef.current = setInterval(() => {
      secCounter += 1;
      setElapsedSeconds(secCounter);
      if (secCounter >= 35) {
        clearInterval(intervalRef.current);
      }
    }, secDuration);

    // ==========================================
    // 0~5s：初始化與狀態登場 (Phase 0)
    // ==========================================
    setCommentary(`【0~5s 英雄登場】${student.name} VS ${currentMatch?.opponentName || "神秘對手"} 進入擂台！`);

    // ==========================================
    // 5~15s：第 1 回合 基礎交鋒 (Phase 1)
    // ==========================================
    const tR1 = setTimeout(() => {
      setPhase(1);
      setCommentary(`【ROUND 1 / 3 基礎交鋒】雙方短兵相接！試探攻擊互相衝撞！`);
      setActionA("attack");
      setActionB("attack");
      retroAudio.playSlash();

      const tHit1 = setTimeout(() => {
        setActionA("hurt");
        setActionB("hurt");
        setIsShaking(true);
        retroAudio.playHit();
        setFloatDamageA({ val: r1_dmgA });
        setFloatDamageB({ val: r1_dmgB });
        setHpA((prev) => Math.max(10, prev - r1_dmgA));
        setHpB((prev) => Math.max(10, prev - r1_dmgB));

        // 氣量增加
        setEnergyA((e) => Math.min(3, e + 1));
        setEnergyB((e) => Math.min(3, e + 1));

        const tReset1 = setTimeout(() => {
          setIsShaking(false);
          setActionA("idle");
          setActionB("idle");
          setFloatDamageA(null);
          setFloatDamageB(null);
        }, 1200 / speed);
        activeTimersRef.current.push(tReset1);
      }, 1500 / speed);
      activeTimersRef.current.push(tHit1);
    }, 5000 / speed);
    activeTimersRef.current.push(tR1);

    // ==========================================
    // 15~25s：第 2 回合 學科絕技 (Phase 2)
    // ==========================================
    const tR2 = setTimeout(() => {
      setPhase(2);
      setActiveBanner({
        title: `${skillNameA}  VS  ${skillNameB}`,
        subtitle: "學科實力爆發！最高優勢科目大招碰撞！",
        color: "from-blue-600 via-indigo-600 to-purple-600",
      });
      retroAudio.playMagic();

      const tSkillFire = setTimeout(() => {
        setActiveBanner(null);
        setCommentary(`【ROUND 2 / 3 學科絕技】${student.name} 施展【${skillNameA}】衝擊對手！`);
        setActionA("attack");
        setActionB("attack");

        const tSkillHit = setTimeout(() => {
          setActionA("hurt");
          setActionB("hurt");
          setIsShaking(true);
          retroAudio.playHit();
          setFloatDamageA({ val: r2_dmgA });
          setFloatDamageB({ val: r2_dmgB });
          setHpA((prev) => Math.max(5, prev - r2_dmgA));
          setHpB((prev) => Math.max(5, prev - r2_dmgB));

          const tReset2 = setTimeout(() => {
            setIsShaking(false);
            setActionA("idle");
            setActionB("idle");
            setFloatDamageA(null);
            setFloatDamageB(null);
          }, 1200 / speed);
          activeTimersRef.current.push(tReset2);
        }, 1500 / speed);
        activeTimersRef.current.push(tSkillHit);
      }, 2500 / speed);
      activeTimersRef.current.push(tSkillFire);
    }, 15000 / speed);
    activeTimersRef.current.push(tR2);

    // ==========================================
    // 25~35s：第 3 回合 逆轉奧義 (Phase 3)
    // ==========================================
    const tR3 = setTimeout(() => {
      setPhase(3);

      if (hasUltA || hasUltB) {
        // Super Flash 1 秒黑屏 + 金色橫幅
        setSuperFlashDark(true);
        setActiveBanner({
          title: hasUltA ? "🔥 逆轉奧義：全場爆發！" : "⚡ 對手逆轉奧義就緒！",
          subtitle: hasUltA ? (fighterA?.ultimateReason || "達成奧義條件，發動終極一擊！") : "對手爆發強大戰力！",
          color: "from-amber-500 via-yellow-400 to-amber-600",
        });
        retroAudio.playCrit();

        const tFlashEnd = setTimeout(() => {
          setSuperFlashDark(false);
          setActiveBanner(null);

          if (hasUltA) {
            setActionA("attack");
            setEnergyA(3);
          }
          if (hasUltB) {
            setActionB("attack");
            setEnergyB(3);
          }

          const tUltHit = setTimeout(() => {
            setIsShaking(true);
            retroAudio.playCrit();
            if (hasUltA) {
              setFloatDamageB({ val: r3_dmgB, isCrit: true });
              setActionB("hurt");
            }
            if (hasUltB) {
              setFloatDamageA({ val: r3_dmgA, isCrit: true });
              setActionA("hurt");
            }

            setHpA((prev) => Math.max(0, prev - r3_dmgA));
            setHpB((prev) => Math.max(0, prev - r3_dmgB));

            const tReset3 = setTimeout(() => {
              setIsShaking(false);
              setFloatDamageA(null);
              setFloatDamageB(null);
            }, 1500 / speed);
            activeTimersRef.current.push(tReset3);
          }, 1500 / speed);
          activeTimersRef.current.push(tUltHit);
        }, 2000 / speed);
        activeTimersRef.current.push(tFlashEnd);
      } else {
        // 普通終局拼刀
        setCommentary("【ROUND 3 / 3 終局決戰】雙方拼盡全力，展開最後一波攻勢！");
        setActionA("attack");
        setActionB("attack");
        retroAudio.playSlash();

        const tClashHit = setTimeout(() => {
          setIsShaking(true);
          retroAudio.playHit();
          setFloatDamageA({ val: r3_dmgA });
          setFloatDamageB({ val: r3_dmgB });
          setHpA((prev) => Math.max(0, prev - r3_dmgA));
          setHpB((prev) => Math.max(0, prev - r3_dmgB));

          const tReset3 = setTimeout(() => {
            setIsShaking(false);
            setFloatDamageA(null);
            setFloatDamageB(null);
          }, 1200 / speed);
          activeTimersRef.current.push(tReset3);
        }, 1500 / speed);
        activeTimersRef.current.push(tClashHit);
      }
    }, 25000 / speed);
    activeTimersRef.current.push(tR3);

    // ==========================================
    // 35~40s：終局結算卡片 (Phase 4)
    // ==========================================
    const tFinish = setTimeout(() => {
      finishBattle(finishWinner, r1_dmgA + r2_dmgA + r3_dmgA, r1_dmgB + r2_dmgB + r3_dmgB);
    }, 35000 / speed);
    activeTimersRef.current.push(tFinish);
  }

  function finishBattle(winState: "A" | "B" | "DRAW", totalDmgA: number, totalDmgB: number) {
    clearAllTimers();
    setPhase(4);
    setElapsedSeconds(35);
    setIsPlaying(false);
    retroAudio.stopBGM();

    const finalHpA = Math.max(0, initialHpA - totalDmgA);
    const finalHpB = Math.max(0, initialHpB - totalDmgB);
    setHpA(finalHpA);
    setHpB(finalHpB);
    setFinalWinner(winState);

    if (winState === "A") {
      setActionA("win");
      setActionB("die");
      retroAudio.playVictory();
      setCommentary(`【👑 勝利】${student.name} 贏得本週對戰！`);
    } else if (winState === "B") {
      setActionB("win");
      setActionA("die");
      retroAudio.playDefeat();
      setCommentary(`【惜敗】對手技高一籌，下週繼續努力！`);
    } else {
      setActionA("win");
      setActionB("win");
      retroAudio.playDefeat();
      setCommentary(`【勢均力敵】雙方戰成平手！`);
    }
  }

  // 立即跳過動畫按鈕
  function handleSkip() {
    clearAllTimers();
    const finishWinner = battleLog?.winner || "A";
    const totalDmgA = battleLog?.damageA ?? 20;
    const totalDmgB = battleLog?.damageB ?? 45;
    finishBattle(finishWinner, totalDmgA, totalDmgB);
  }

  useEffect(() => {
    if (autoStart) {
      run35sBattle(speedMultiplier);
    }
  }, []);

  const isMyWin = finalWinner === "A";
  const isMyLoss = finalWinner === "B";
  const isMyDraw = finalWinner === "DRAW";

  const causalityA = battleLog?.causalityAnalysis?.reasonForA || (isMyWin ? "學科實力發揮 + 作業準時護盾助攻" : "作業缺漏或戰力些微差距惜敗");
  const causalityB = battleLog?.causalityAnalysis?.reasonForB || "";

  return (
    <div
      className={`w-full bg-[#0b0f19] border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 font-sans relative transition-all duration-300 ${
        isShaking ? "translate-x-2 -translate-y-2" : ""
      }`}
    >
      {/* Super Flash 全螢幕暗轉效果 */}
      {superFlashDark && (
        <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center animate-pulse">
          <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-2xl sm:text-3xl tracking-widest shadow-2xl border-2 border-amber-300">
            🔥 SUPER FLASH • 逆轉奧義
          </div>
        </div>
      )}

      {/* 技能全螢幕橫幅 */}
      {activeBanner && (
        <div className="absolute top-1/3 left-0 right-0 z-30 flex flex-col items-center justify-center px-4 animate-in fade-in zoom-in duration-300">
          <div className={`w-full max-w-lg bg-gradient-to-r ${activeBanner.color} text-white py-3 px-6 rounded-xl border border-white/30 shadow-2xl text-center`}>
            <p className="font-pixel text-lg sm:text-xl font-bold tracking-wider">{activeBanner.title}</p>
            <p className="text-xs text-white/90 mt-1 font-mono">{activeBanner.subtitle}</p>
          </div>
        </div>
      )}

      {/* 頂部操作列 */}
      <div className="px-4 py-3 bg-[#070b14]/95 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap relative z-20">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
            {phase === 0 ? "0~5s INTRO" : phase === 1 ? "5~15s R1 普攻" : phase === 2 ? "15~25s R2 絕技" : phase === 3 ? "25~35s R3 奧義" : "FINISH"}
          </span>
          <span className="text-slate-200 text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
            第 {currentMatch?.weekNumber || 1} 週 • 35s 街機格鬥舞台 ({elapsedSeconds}s / 35s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* ⏩ 跳過動畫按鈕 */}
          {phase < 4 && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1.5 rounded text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20 flex items-center gap-1 transition-all cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span>跳過動畫</span>
            </button>
          )}

          {/* 音效開關 */}
          <button
            type="button"
            onClick={toggleSound}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              soundEnabled
                ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/60 hover:bg-indigo-900"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono">{soundEnabled ? "音效 ON" : "靜音"}</span>
          </button>

          {/* 倍速切換 */}
          <button
            type="button"
            onClick={() => {
              const next = speedMultiplier === 1 ? 2 : 1;
              setSpeedMultiplier(next);
              run35sBattle(next);
            }}
            className="px-2.5 py-1.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 transition-colors"
          >
            {speedMultiplier}x
          </button>

          {/* 重播 */}
          <button
            type="button"
            onClick={() => run35sBattle(speedMultiplier)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-pixel text-[10px] transition-all flex items-center gap-1 border border-slate-600 hover:border-amber-400"
          >
            <RotateCcw className="w-3 h-3" />
            <span>REPLAY</span>
          </button>

          {/* 關閉返回 */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/60 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>關閉</span>
            </button>
          )}
        </div>
      </div>

      {/* 雙方血條與能量指示區 */}
      <div className="px-4 py-3 bg-[#0d1424] border-b border-slate-800/80 grid grid-cols-2 gap-4 sm:gap-8 relative z-10">
        {/* 左側玩家 (我方) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>{student.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({student.studentNumber})</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">{hpA} / {initialHpA} HP</span>
          </div>
          {/* 血條 */}
          <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.max(0, (hpA / initialHpA) * 100)}%` }}
            />
          </div>
          {/* 氣量槽 */}
          <div className="flex items-center gap-1 pt-0.5">
            <span className="text-[10px] text-slate-400 font-pixel">ENERGY:</span>
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[9px] transition-all ${
                  idx < energyA
                    ? "bg-amber-400 border-amber-300 text-slate-950 shadow-sm shadow-amber-400/50"
                    : "bg-slate-900 border-slate-700 text-slate-600"
                }`}
              >
                ◆
              </span>
            ))}
          </div>
        </div>

        {/* 右側玩家 (對手) */}
        <div className="space-y-1.5 text-right">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-rose-400">{hpB} / {initialHpB} HP</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">(對手)</span>
              <span>{currentMatch?.opponentName || "神秘對手"}</span>
            </span>
          </div>
          {/* 血條 */}
          <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-l from-rose-500 to-amber-500 transition-all duration-300 ml-auto"
              style={{ width: `${Math.max(0, (hpB / initialHpB) * 100)}%` }}
            />
          </div>
          {/* 氣量槽 */}
          <div className="flex items-center justify-end gap-1 pt-0.5">
            <span className="text-[10px] text-slate-400 font-pixel">ENERGY:</span>
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[9px] transition-all ${
                  idx < energyB
                    ? "bg-amber-400 border-amber-300 text-slate-950 shadow-sm shadow-amber-400/50"
                    : "bg-slate-900 border-slate-700 text-slate-600"
                }`}
              >
                ◆
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 擂台主畫面 */}
      <div className="h-64 sm:h-72 bg-gradient-to-b from-[#0a0f1d] via-[#10192e] to-[#0d1322] relative flex items-center justify-between px-8 sm:px-16 overflow-hidden">
        {/* 背景網格與像素地面 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent border-t border-slate-800 pointer-events-none" />

        {/* 左側精靈 (我方) */}
        <div className="relative flex flex-col items-center">
          {/* 0~5s 開場 Buff 標籤浮動 */}
          {phase === 0 && (
            <div className="absolute -top-16 flex flex-col items-center gap-1 animate-bounce">
              {hasBuffA && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400/80 text-[10px] text-emerald-300 font-bold whitespace-nowrap shadow-md">
                  🛡️ 作業準時：氣量+1
                </span>
              )}
              {allChallengesCorrectA && (
                <span className="px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-400/80 text-[10px] text-amber-300 font-bold whitespace-nowrap shadow-md">
                  ⚡ 挑戰全對：奧義就緒
                </span>
              )}
            </div>
          )}

          {/* 浮動傷害飄字 */}
          {floatDamageA && (
            <div className={`absolute -top-12 font-black font-mono animate-bounce z-30 ${floatDamageA.isCrit ? "text-2xl text-amber-300" : "text-xl text-rose-400"}`}>
              {floatDamageA.isCrit ? `CRITICAL! -${floatDamageA.val}` : `-${floatDamageA.val}`}
            </div>
          )}

          <div className="relative transform scale-125">
            <PixelFighterSprite
              gender={mySkin.gender}
              charClass={mySkin.charClass}
              color={mySkin.color}
              action={actionA}
              isOpponent={false}
              size={110}
            />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {student.name}
          </span>
        </div>

        {/* 中央戰況資訊 */}
        <div className="flex flex-col items-center justify-center text-center z-10 space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-inner">
            <span className="font-pixel text-xs text-amber-400">VS</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800/80">
            {elapsedSeconds}s / 35s
          </span>
        </div>

        {/* 右側精靈 (對手) */}
        <div className="relative flex flex-col items-center">
          {/* 0~5s 對手 Buff 標籤 */}
          {phase === 0 && (
            <div className="absolute -top-16 flex flex-col items-center gap-1 animate-bounce">
              {hasBuffB && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400/80 text-[10px] text-emerald-300 font-bold whitespace-nowrap shadow-md">
                  🛡️ 作業護盾+1
                </span>
              )}
            </div>
          )}

          {/* 浮動傷害飄字 */}
          {floatDamageB && (
            <div className={`absolute -top-12 font-black font-mono animate-bounce z-30 ${floatDamageB.isCrit ? "text-2xl text-amber-300" : "text-xl text-rose-400"}`}>
              {floatDamageB.isCrit ? `CRITICAL! -${floatDamageB.val}` : `-${floatDamageB.val}`}
            </div>
          )}

          <div className="relative transform scale-125">
            <PixelFighterSprite
              gender={oppSkin.gender}
              charClass={oppSkin.charClass}
              color={oppSkin.color}
              action={actionB}
              isOpponent={true}
              size={110}
            />
          </div>
          <span className="mt-2 text-xs font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {currentMatch?.opponentName || "神秘對手"}
          </span>
        </div>
      </div>

      {/* 下方戰況解說跑馬燈 */}
      <div className="px-4 py-2.5 bg-[#070b14] border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-mono text-amber-300 font-semibold">{commentary}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          35s ARCADE ENGINE
        </span>
      </div>

      {/* 35~40s 終局結算卡片 (Phase 4) */}
      {phase === 4 && (
        <div className="p-6 bg-slate-900/95 border-t-2 border-amber-400/80 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <Trophy className={`w-8 h-8 ${isMyWin ? "text-amber-400" : isMyDraw ? "text-cyan-400" : "text-slate-500"}`} />
            <h3 className="text-2xl font-black tracking-wider text-white">
              {isMyWin ? "👑 恭喜獲得本週對戰勝利！" : isMyDraw ? "🤝 雙方勢均力敵 平手！" : "⚔️ 本週惜敗，下週再戰！"}
            </h3>
          </div>

          {/* 因果歸因分析卡 */}
          <div className="w-full max-w-xl bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>親師生因果歸因分析報告</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              • <strong className="text-white">{student.name}：</strong>{causalityA}
            </p>
            {causalityB && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                • <strong className="text-slate-300">對手：</strong>{causalityB}
              </p>
            )}
          </div>

          {/* 獎勵與結算按鈕 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => run35sBattle(speedMultiplier)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再次重播</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs tracking-wider transition-colors"
              >
                返回看板大廳
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
