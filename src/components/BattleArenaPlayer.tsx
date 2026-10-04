"use client";

import { useEffect, useState, useRef } from "react";
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  FastForward,
  Trophy,
  Shield,
  Zap,
} from "lucide-react";
import { retroAudio } from "@/lib/audioEngine";
import PixelFighterSprite, { FighterAction } from "@/components/PixelFighterSprite";
import { TACTICAL_CHIPS, ChipId } from "@/lib/chips";

interface BattleArenaPlayerProps {
  battleLog: any;
  currentStudentNumber?: string;
  onClose?: () => void;
  autoStart?: boolean;
}

export default function BattleArenaPlayer({
  battleLog,
  currentStudentNumber,
  onClose,
  autoStart = true,
}: BattleArenaPlayerProps) {
  const p1 = battleLog?.player1 || {
    studentNumber: "S101",
    name: "王小明",
    gender: "BOY",
    initialHp: 85,
    finalHp: 35,
    equippedChip: "ADVERSITY_SHATTER",
    chipName: "逆境破甲焰",
    hasHomeworkCompleted: true,
  };

  const p2 = battleLog?.player2 || {
    studentNumber: "S102",
    name: "李依婷",
    gender: "GIRL",
    initialHp: 90,
    finalHp: 20,
    equippedChip: "GUARDIAN_BASTION",
    chipName: "守護壁壘",
    hasHomeworkCompleted: true,
  };

  const isMeP1 = !currentStudentNumber || currentStudentNumber === p1.studentNumber;
  const chip1 = (p1.equippedChip as ChipId) || "ADVERSITY_SHATTER";
  const chip2 = (p2.equippedChip as ChipId) || "GUARDIAN_BASTION";
  const meta1 = TACTICAL_CHIPS[chip1] || TACTICAL_CHIPS.ADVERSITY_SHATTER;
  const meta2 = TACTICAL_CHIPS[chip2] || TACTICAL_CHIPS.GUARDIAN_BASTION;

  const initialHp1 = p1.initialHp || 85;
  const initialHp2 = p2.initialHp || 85;
  const rounds = battleLog?.rounds || [];

  const r1 = rounds[0] || { damageToP1: 15, damageToP2: 15 };
  const r2 = rounds[1] || { damageToP1: 20, damageToP2: 20 };
  const r3 = rounds[2] || { damageToP1: 30, damageToP2: 45, healP1: 0, healP2: 0 };

  // 狀態管理
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [hp1, setHp1] = useState(initialHp1);
  const [hp2, setHp2] = useState(initialHp2);

  const [action1, setAction1] = useState<FighterAction>("idle");
  const [action2, setAction2] = useState<FighterAction>("idle");

  const [floatDamage1, setFloatDamage1] = useState<{ val: number; isCrit?: boolean; isHeal?: boolean } | null>(null);
  const [floatDamage2, setFloatDamage2] = useState<{ val: number; isCrit?: boolean; isHeal?: boolean } | null>(null);

  const [shakeIntensity, setShakeIntensity] = useState<number>(0);
  const [superFlash, setSuperFlash] = useState(false);
  const [chipBanner, setChipBanner] = useState<{ title: string; desc: string; color: string } | null>(null);
  const [activeChipAnim, setActiveChipAnim] = useState<ChipId | null>(null);

  const [commentary, setCommentary] = useState("30 秒學力推演引擎準備就緒...");
  const [finished, setFinished] = useState(false);

  const timersRef = useRef<any[]>([]);
  const intervalRef = useRef<any>(null);

  function clearTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearTimers();
      retroAudio.stopBGM();
    };
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    retroAudio.setMuted(!next);
    if (next && isPlaying) {
      retroAudio.startBGM();
    }
  }

  // 30 秒推演時間軸排程
  function startSimulation() {
    clearTimers();
    setIsPlaying(true);
    setFinished(false);
    setSeconds(0);
    setHp1(initialHp1);
    setHp2(initialHp2);
    setAction1("idle");
    setAction2("idle");
    setFloatDamage1(null);
    setFloatDamage2(null);
    setShakeIntensity(0);
    setSuperFlash(false);
    setChipBanner(null);
    setActiveChipAnim(null);

    if (soundEnabled) {
      retroAudio.startBGM();
    }

    let secCount = 0;
    intervalRef.current = setInterval(() => {
      secCount += 1;
      setSeconds(secCount);
      if (secCount >= 30) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    // ==========================================
    // 00:00 - 00:08【Round 1 試探交鋒】
    // ==========================================
    setCommentary(`【0~8s Round 1 試探交鋒】雙方短兵相接，互換普攻！`);
    const tR1_hit = setTimeout(() => {
      setAction1("attack");
      setAction2("attack");
      retroAudio.playSlash();
      setShakeIntensity(2);

      const tR1_dmg = setTimeout(() => {
        setAction1("hurt");
        setAction2("hurt");
        retroAudio.playHit();
        setFloatDamage1({ val: r1.damageToP1 });
        setFloatDamage2({ val: r1.damageToP2 });
        setHp1((h: number) => Math.max(10, h - r1.damageToP1));
        setHp2((h: number) => Math.max(10, h - r1.damageToP2));

        const tR1_reset = setTimeout(() => {
          setShakeIntensity(0);
          setAction1("idle");
          setAction2("idle");
          setFloatDamage1(null);
          setFloatDamage2(null);
        }, 1200);
        timersRef.current.push(tR1_reset);
      }, 1000);
      timersRef.current.push(tR1_dmg);
    }, 2500);
    timersRef.current.push(tR1_hit);

    // ==========================================
    // 00:08 - 00:18【Round 2 戰況升溫】
    // ==========================================
    const tR2 = setTimeout(() => {
      setCommentary(`【8~18s Round 2 戰況升溫】作業護盾減傷激戰，逼近半血警戒！`);
      setAction1("attack");
      setAction2("attack");
      retroAudio.playSlash();
      setShakeIntensity(4);

      const tR2_hit = setTimeout(() => {
        setAction1("hurt");
        setAction2("hurt");
        retroAudio.playHit();
        setFloatDamage1({ val: r2.damageToP1 });
        setFloatDamage2({ val: r2.damageToP2 });
        setHp1((h: number) => Math.max(10, h - r2.damageToP1));
        setHp2((h: number) => Math.max(10, h - r2.damageToP2));

        const tR2_reset = setTimeout(() => {
          setShakeIntensity(0);
          setAction1("idle");
          setAction2("idle");
          setFloatDamage1(null);
          setFloatDamage2(null);
        }, 1200);
        timersRef.current.push(tR2_reset);
      }, 1200);
      timersRef.current.push(tR2_hit);
    }, 8500);
    timersRef.current.push(tR2);

    // ==========================================
    // 00:18 - 00:28【Round 3 晶片大招對轟】
    // ==========================================
    const tR3 = setTimeout(() => {
      // 畫面全黑 0.6 秒 (Super Flash)
      setSuperFlash(true);
      setCommentary(`【18~28s Round 3 晶片大招】SUPER FLASH！裝備晶片奧義全場引爆！`);
      retroAudio.playCrit();

      const tFlashEnd = setTimeout(() => {
        setSuperFlash(false);
        setAction1("cast");
        setAction2("cast");

        // 浮現金色招式橫幅
        setChipBanner({
          title: `【奧義・${meta1.name}】VS【奧義・${meta2.name}】`,
          desc: `${meta1.effectDesc} • ${meta2.effectDesc}`,
          color: meta1.bannerColor,
        });

        // 啟動專屬粒子動畫
        setActiveChipAnim(chip1);

        const tR3_impact = setTimeout(() => {
          setShakeIntensity(8); // 劇烈震屏 8px
          retroAudio.playCrit();

          setFloatDamage1({ val: r3.damageToP1, isCrit: true });
          setFloatDamage2({ val: r3.damageToP2, isCrit: true });

          setHp1((h: number) => Math.max(0, h - r3.damageToP1 + (r3.healP1 || 0)));
          setHp2((h: number) => Math.max(0, h - r3.damageToP2 + (r3.healP2 || 0)));

          setAction1(r3.damageToP1 >= r3.damageToP2 ? "hurt" : "attack");
          setAction2(r3.damageToP2 >= r3.damageToP1 ? "hurt" : "attack");

          const tR3_clean = setTimeout(() => {
            setShakeIntensity(0);
            setChipBanner(null);
            setActiveChipAnim(null);
            setFloatDamage1(null);
            setFloatDamage2(null);
          }, 2000);
          timersRef.current.push(tR3_clean);
        }, 3000);
        timersRef.current.push(tR3_impact);
      }, 600);
      timersRef.current.push(tFlashEnd);
    }, 18000);
    timersRef.current.push(tR3);

    // ==========================================
    // 00:28 - 00:33【終局結算】
    // ==========================================
    const tFinish = setTimeout(() => {
      finishBattle();
    }, 28000);
    timersRef.current.push(tFinish);
  }

  function finishBattle() {
    clearTimers();
    setSeconds(30);
    setIsPlaying(false);
    setFinished(true);
    setSuperFlash(false);
    setShakeIntensity(0);
    setChipBanner(null);
    setActiveChipAnim(null);
    retroAudio.stopBGM();

    const final1 = p1.finalHp ?? 30;
    const final2 = p2.finalHp ?? 15;
    setHp1(final1);
    setHp2(final2);

    const winner = battleLog?.winner || (final1 > final2 ? "P1" : "P2");

    if (winner === "P1") {
      setAction1("win");
      setAction2("die");
      if (isMeP1) retroAudio.playVictory();
      else retroAudio.playDefeat();
      setCommentary(`【推演結算】${p1.name} 奪得勝利！`);
    } else if (winner === "P2") {
      setAction2("win");
      setAction1("die");
      if (!isMeP1) retroAudio.playVictory();
      else retroAudio.playDefeat();
      setCommentary(`【推演結算】${p2.name} 奪得勝利！`);
    } else {
      setAction1("win");
      setAction2("win");
      retroAudio.playDefeat();
      setCommentary("【推演結算】雙方勢均力敵，握手言和！");
    }
  }

  function handleSkip() {
    finishBattle();
  }

  useEffect(() => {
    if (autoStart) {
      startSimulation();
    }
  }, []);

  const winner = battleLog?.winner || (hp1 > hp2 ? "P1" : hp2 > hp1 ? "P2" : "DRAW");
  const isWinnerMe = (winner === "P1" && isMeP1) || (winner === "P2" && !isMeP1);
  const isDraw = winner === "DRAW";

  const causalityReason = isMeP1
    ? battleLog?.causalityAnalysis?.reasonForP1
    : battleLog?.causalityAnalysis?.reasonForP2;

  return (
    <div
      className={`w-full bg-[#0b0f19] border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 font-sans relative transition-transform duration-100 ${
        shakeIntensity === 2
          ? "translate-x-0.5 -translate-y-0.5"
          : shakeIntensity === 4
          ? "translate-x-1 -translate-y-1"
          : shakeIntensity === 8
          ? "translate-x-2 -translate-y-2"
          : ""
      }`}
    >
      {/* Super Flash 全黑 0.6 秒 */}
      {superFlash && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center animate-fade-in">
          <div className="text-amber-400 font-black text-2xl tracking-widest animate-pulse">
            ⚡ SUPER FLASH
          </div>
        </div>
      )}

      {/* 晶片專屬 Canvas/CSS 粒子特效層 */}
      {activeChipAnim && (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden flex items-center justify-center">
          {activeChipAnim === "MATH_VOID" && (
            <div className="w-full h-full bg-blue-500/10 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-cyan-400 rotate-45 animate-spin duration-700 shadow-[0_0_50px_rgba(34,211,238,0.8)]" />
              <div className="absolute inset-x-0 h-1 bg-white shadow-[0_0_20px_white] animate-pulse" />
            </div>
          )}
          {activeChipAnim === "CHINESE_INK" && (
            <div className="w-full h-full bg-slate-900/40 flex items-center justify-center">
              <div className="text-6xl font-serif text-amber-200/40 select-none animate-ping">墨</div>
            </div>
          )}
          {activeChipAnim === "ADVERSITY_SHATTER" && (
            <div className="w-full h-full bg-rose-500/15 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full border-4 border-rose-500 animate-ping shadow-[0_0_60px_rgba(244,63,94,0.9)]" />
            </div>
          )}
          {activeChipAnim === "GUARDIAN_BASTION" && (
            <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
              <div className="w-80 h-80 rounded-2xl border-4 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.8)]" />
            </div>
          )}
          {activeChipAnim === "SELF_TRANSCENDENCE" && (
            <div className="w-full h-full bg-yellow-500/20 flex items-center justify-center">
              <div className="w-full h-24 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_80px_gold] animate-pulse" />
            </div>
          )}
          {activeChipAnim === "ENGLISH_STORM" && (
            <div className="w-full h-full bg-amber-500/15 flex items-center justify-center">
              <div className="w-full h-full border-t-4 border-b-4 border-amber-300 rotate-12 animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* 晶片大招金色橫幅 */}
      {chipBanner && (
        <div className="absolute top-1/4 left-0 right-0 z-40 flex flex-col items-center justify-center px-4 animate-in zoom-in duration-300">
          <div className={`w-full max-w-md bg-gradient-to-r ${chipBanner.color} text-white py-3 px-5 rounded-xl border border-white/40 shadow-2xl text-center`}>
            <p className="font-bold text-base sm:text-lg tracking-wider text-amber-200">{chipBanner.title}</p>
            <p className="text-[11px] text-white/90 mt-0.5">{chipBanner.desc}</p>
          </div>
        </div>
      )}

      {/* 頂部操作列 */}
      <div className="px-4 py-2.5 bg-[#070b14] border-b border-slate-800 flex items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-2">
          <span className="font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 text-[11px]">
            {seconds < 8 ? "ROUND 1 試探" : seconds < 18 ? "ROUND 2 升溫" : seconds < 28 ? "ROUND 3 奧義" : "FINISH"}
          </span>
          <span className="text-slate-300 text-xs font-semibold">
            30 秒學力推演回放 ({seconds}s / 30s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* ⏩ 常駐跳過動畫按鈕 */}
          {!finished && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span>跳過動畫 (Skip)</span>
            </button>
          )}

          {/* 音效開關 */}
          <button
            type="button"
            onClick={toggleSound}
            className={`px-2 py-1 rounded text-xs border ${
              soundEnabled ? "bg-slate-800 text-cyan-400 border-cyan-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* 重播 */}
          <button
            type="button"
            onClick={startSimulation}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重播</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 雙方血量指示條 */}
      <div className="px-6 py-3 bg-[#0d1424] border-b border-slate-800/80 grid grid-cols-2 gap-6 relative z-10">
        {/* P1 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1">
              <span>{p1.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({p1.studentNumber})</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{hp1} / {initialHp1} HP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.max(0, (hp1 / initialHp1) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              {meta1.icon} {meta1.name}
            </span>
          </div>
        </div>

        {/* P2 */}
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-rose-400 font-bold">{hp2} / {initialHp2} HP</span>
            <span className="font-bold text-white flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono">({p2.studentNumber})</span>
              <span>{p2.name}</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-rose-500 to-amber-500 transition-all duration-300 ml-auto"
              style={{ width: `${Math.max(0, (hp2 / initialHp2) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5">
            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              {meta2.icon} {meta2.name}
            </span>
          </div>
        </div>
      </div>

      {/* 擂台主畫面 */}
      <div className="h-60 sm:h-64 bg-gradient-to-b from-[#0a0f1d] via-[#10192e] to-[#0d1322] relative flex items-center justify-between px-10 sm:px-20 overflow-hidden">
        {/* 背景格線 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

        {/* P1 精靈 */}
        <div className="relative flex flex-col items-center">
          {floatDamage1 && (
            <div className={`absolute -top-10 font-mono font-black z-30 ${floatDamage1.isCrit ? "text-xl text-amber-300 animate-bounce" : "text-lg text-rose-400"}`}>
              {floatDamage1.isCrit ? `CRITICAL! -${floatDamage1.val}` : `-${floatDamage1.val}`}
            </div>
          )}
          <PixelFighterSprite
            gender={p1.gender}
            action={action1}
            isOpponent={false}
            size={105}
          />
          <span className="mt-1 text-[11px] font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {p1.name}
          </span>
        </div>

        {/* 中央 VS */}
        <div className="text-center z-10 space-y-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs mx-auto shadow-inner">
            VS
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
            {seconds}s
          </span>
        </div>

        {/* P2 精靈 */}
        <div className="relative flex flex-col items-center">
          {floatDamage2 && (
            <div className={`absolute -top-10 font-mono font-black z-30 ${floatDamage2.isCrit ? "text-xl text-amber-300 animate-bounce" : "text-lg text-rose-400"}`}>
              {floatDamage2.isCrit ? `CRITICAL! -${floatDamage2.val}` : `-${floatDamage2.val}`}
            </div>
          )}
          <PixelFighterSprite
            gender={p2.gender}
            action={action2}
            isOpponent={true}
            size={105}
          />
          <span className="mt-1 text-[11px] font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {p2.name}
          </span>
        </div>
      </div>

      {/* 下方戰況解說 */}
      <div className="px-4 py-2 bg-[#070b14] border-t border-slate-800 text-xs text-amber-300 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-mono truncate">{commentary}</span>
      </div>

      {/* 終局結算卡片 */}
      {finished && (
        <div className="p-5 bg-slate-900 border-t-2 border-amber-400 flex flex-col items-center text-center space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Trophy className={`w-6 h-6 ${isWinnerMe ? "text-amber-400" : isDraw ? "text-cyan-400" : "text-slate-500"}`} />
            <h3 className="text-xl font-bold text-white tracking-wider">
              {isWinnerMe ? "👑 VICTORY • 推演勝出！" : isDraw ? "🤝 DRAW • 勢均力敵！" : "⚔️ DEFEAT • 本週惜敗"}
            </h3>
          </div>

          <div className="w-full max-w-lg bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left space-y-1.5">
            <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>推演勝負因果分析報告</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {causalityReason || "努力完成作業與自主修練題目，解鎖核心晶片優勢。"}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={startSimulation}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-bold transition-colors"
            >
              再次回放
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-xs transition-colors"
              >
                返回看板
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
