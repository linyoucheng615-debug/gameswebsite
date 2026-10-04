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
  Flame,
  CheckCircle2,
  AlertCircle,
  Swords,
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
  autoStart = false,
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

  const initialHp1 = Number(p1.initialHp) || 85;
  const initialHp2 = Number(p2.initialHp) || 85;
  const rounds = Array.isArray(battleLog?.rounds) ? battleLog.rounds : [];

  const r1 = rounds[0] || {};
  const r2 = rounds[1] || {};
  const r3 = rounds[2] || {};

  const dmg1_p1 = Number(r1.damageToP1) || 14;
  const dmg1_p2 = Number(r1.damageToP2) || 14;

  const dmg2_p1 = Number(r2.damageToP1) || 18;
  const dmg2_p2 = Number(r2.damageToP2) || 18;

  const dmg3_p1 = Number(r3.damageToP1) || 28;
  const dmg3_p2 = Number(r3.damageToP2) || 38;
  const healP1 = Number(r3.healP1) || 0;
  const healP2 = Number(r3.healP2) || 0;

  // 狀態管理
  const [seconds, setSeconds] = useState(0);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [stageDesc, setStageDesc] = useState<{ step: string; detail: string; badge: string }>({
    badge: "Round 1 試探普攻",
    step: "推演準備就緒",
    detail: "點擊播放按鈕開始 30 秒學力推演回放...",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [hp1, setHp1] = useState(initialHp1);
  const [hp2, setHp2] = useState(initialHp2);

  const [action1, setAction1] = useState<FighterAction>("idle");
  const [action2, setAction2] = useState<FighterAction>("idle");

  // 攻擊與防守特效
  const [projectile, setProjectile] = useState<"p1_to_p2" | "p2_to_p1" | null>(null);
  const [shieldActive1, setShieldActive1] = useState(false);
  const [shieldActive2, setShieldActive2] = useState(false);

  const [floatDamage1, setFloatDamage1] = useState<{ val: number; isCrit?: boolean; isHeal?: boolean } | null>(null);
  const [floatDamage2, setFloatDamage2] = useState<{ val: number; isCrit?: boolean; isHeal?: boolean } | null>(null);

  const [shakeIntensity, setShakeIntensity] = useState<number>(0);
  const [superFlash, setSuperFlash] = useState(false);
  const [chipBanner, setChipBanner] = useState<{ title: string; desc: string; color: string } | null>(null);
  const [activeChipAnim, setActiveChipAnim] = useState<ChipId | null>(null);

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

  function startSimulation() {
    clearTimers();
    setIsPlaying(true);
    setFinished(false);
    setSeconds(0);
    setCurrentStage(1);
    setHp1(initialHp1);
    setHp2(initialHp2);
    setAction1("idle");
    setAction2("idle");
    setProjectile(null);
    setShieldActive1(false);
    setShieldActive2(false);
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
    // Round 1 (0~8s)：順序交鋒
    // ==========================================
    setStageDesc({
      badge: "Round 1 試探普攻",
      step: `【${p1.name}】率先發動普攻！`,
      detail: "雙方短兵相接，先手選手發動試探揮砍。",
    });

    const tR1_p1_atk = setTimeout(() => {
      setAction1("attack");
      setProjectile("p1_to_p2");
      retroAudio.playSlash();
      setShakeIntensity(2);

      const tR1_p2_hit = setTimeout(() => {
        setProjectile(null);
        setAction2("hurt");
        retroAudio.playHit();
        setFloatDamage2({ val: dmg1_p2 });
        setHp2((h: number) => Math.max(10, h - dmg1_p2));
        setStageDesc({
          badge: "Round 1 試探普攻",
          step: `【${p1.name}】突進揮砍命中！`,
          detail: `造成 ${dmg1_p2} 點基礎傷害，${p2.name} 穩住陣腳準備反擊！`,
        });

        const tR1_p1_back = setTimeout(() => {
          setAction1("idle");
          setAction2("idle");
          setShakeIntensity(0);
          setFloatDamage2(null);
        }, 1200);
        timersRef.current.push(tR1_p1_back);
      }, 700);
      timersRef.current.push(tR1_p2_hit);
    }, 800);
    timersRef.current.push(tR1_p1_atk);

    const tR1_p2_atk = setTimeout(() => {
      setStageDesc({
        badge: "Round 1 試探普攻",
        step: `【${p2.name}】迅速反擊回敬！`,
        detail: `劍光反刺，回擊 ${p1.name}！`,
      });
      setAction2("attack");
      setProjectile("p2_to_p1");
      retroAudio.playSlash();
      setShakeIntensity(2);

      const tR1_p1_hit = setTimeout(() => {
        setProjectile(null);
        setAction1("hurt");
        retroAudio.playHit();
        setFloatDamage1({ val: dmg1_p1 });
        setHp1((h: number) => Math.max(10, h - dmg1_p1));
        setStageDesc({
          badge: "Round 1 試探普攻",
          step: `【${p2.name}】反擊成功！`,
          detail: `造成 ${dmg1_p1} 點傷害，第一回合試探結束！`,
        });

        const tR1_p2_back = setTimeout(() => {
          setAction1("idle");
          setAction2("idle");
          setShakeIntensity(0);
          setFloatDamage1(null);
        }, 1200);
        timersRef.current.push(tR1_p2_back);
      }, 700);
      timersRef.current.push(tR1_p1_hit);
    }, 4000);
    timersRef.current.push(tR1_p2_atk);

    // ==========================================
    // Round 2 (8~18s)：作業護盾
    // ==========================================
    const tR2_start = setTimeout(() => {
      setCurrentStage(2);
      setStageDesc({
        badge: "Round 2 作業護盾防守",
        step: "戰況升溫！檢驗本週作業完成度！",
        detail: "按時繳交作業者，身上的【作業護盾】將大幅減免所受傷害！",
      });

      const tR2_p1_strike = setTimeout(() => {
        setAction1("attack");
        setProjectile("p1_to_p2");
        retroAudio.playSlash();
        setShakeIntensity(3);

        const tR2_p2_defend = setTimeout(() => {
          setProjectile(null);
          setShieldActive2(true);
          setAction2(p2.hasHomeworkCompleted ? "defend" : "hurt");
          retroAudio.playHit();

          setFloatDamage2({ val: dmg2_p2 });
          setHp2((h: number) => Math.max(10, h - dmg2_p2));

          setStageDesc({
            badge: "Round 2 作業護盾防守",
            step: p2.hasHomeworkCompleted ? `【${p2.name}】作業護盾生效！` : `【${p2.name}】無作業護盾加成！`,
            detail: p2.hasHomeworkCompleted
              ? `🛡️ 準時繳交作業啟動金光護盾，成功吸收傷害，僅受 ${dmg2_p2} 點傷害！`
              : `⚠️ 本週作業缺漏，失去護盾保護，承受全額 ${dmg2_p2} 點傷害！`,
          });

          const tR2_p2_reset = setTimeout(() => {
            setAction1("idle");
            setAction2("idle");
            setShieldActive2(false);
            setShakeIntensity(0);
            setFloatDamage2(null);
          }, 1500);
          timersRef.current.push(tR2_p2_reset);
        }, 700);
        timersRef.current.push(tR2_p2_defend);
      }, 1500);
      timersRef.current.push(tR2_p1_strike);

      const tR2_p2_strike = setTimeout(() => {
        setStageDesc({
          badge: "Round 2 作業護盾防守",
          step: `【${p2.name}】展開強烈回擊！`,
          detail: `考驗【${p1.name}】的作業防禦防線！`,
        });

        setAction2("attack");
        setProjectile("p2_to_p1");
        retroAudio.playSlash();
        setShakeIntensity(3);

        const tR2_p1_defend = setTimeout(() => {
          setProjectile(null);
          setShieldActive1(true);
          setAction1(p1.hasHomeworkCompleted ? "defend" : "hurt");
          retroAudio.playHit();

          setFloatDamage1({ val: dmg2_p1 });
          setHp1((h: number) => Math.max(10, h - dmg2_p1));

          setStageDesc({
            badge: "Round 2 作業護盾防守",
            step: p1.hasHomeworkCompleted ? `【${p1.name}】作業護盾金光格擋！` : `【${p1.name}】無作業護盾加成！`,
            detail: p1.hasHomeworkCompleted
              ? `🛡️ 準時繳交作業啟用能量光盾，抵禦重擊，僅扣 ${dmg2_p1} 點血量！`
              : `⚠️ 作業未完成，失去護盾保護，承受 ${dmg2_p1} 點傷害！`,
          });

          const tR2_p1_reset = setTimeout(() => {
            setAction1("idle");
            setAction2("idle");
            setShieldActive1(false);
            setShakeIntensity(0);
            setFloatDamage1(null);
          }, 1500);
          timersRef.current.push(tR2_p1_reset);
        }, 700);
        timersRef.current.push(tR2_p1_defend);
      }, 5500);
      timersRef.current.push(tR2_p2_strike);
    }, 8000);
    timersRef.current.push(tR2_start);

    // ==========================================
    // Round 3 (18~27s)：晶片奧義對轟
    // ==========================================
    const tR3_start = setTimeout(() => {
      setCurrentStage(3);
      setSuperFlash(true);
      setStageDesc({
        badge: "Round 3 晶片奧義對轟",
        step: "⚡ SUPER FLASH！晶片奧義全場引爆！",
        detail: "核心晶片共鳴覺醒，雙方釋放本週最大學力奧義！",
      });
      retroAudio.playCrit();

      const tFlashEnd = setTimeout(() => {
        setSuperFlash(false);
        setAction1("cast");
        setAction2("cast");

        setChipBanner({
          title: `【${meta1.name}】⚔️【${meta2.name}】`,
          desc: `${p1.name}：${meta1.effectDesc} | ${p2.name}：${meta2.effectDesc}`,
          color: meta1.bannerColor,
        });

        setActiveChipAnim(chip1);

        setStageDesc({
          badge: "Round 3 晶片奧義對轟",
          step: `【${meta1.name}】vs【${meta2.name}】`,
          detail: `雙方同時施展專屬奧義！學科精熟光芒與勤勉突破烈焰正面對轟！`,
        });

        const tR3_impact = setTimeout(() => {
          setShakeIntensity(8);
          retroAudio.playCrit();

          setFloatDamage1({ val: dmg3_p1, isCrit: true });
          setFloatDamage2({ val: dmg3_p2, isCrit: true });

          setHp1((h: number) => Math.max(0, h - dmg3_p1 + healP1));
          setHp2((h: number) => Math.max(0, h - dmg3_p2 + healP2));

          setAction1(dmg3_p1 >= dmg3_p2 ? "hurt" : "attack");
          setAction2(dmg3_p2 >= dmg3_p1 ? "hurt" : "attack");

          setStageDesc({
            badge: "Round 3 晶片奧義對轟",
            step: "💥 奧義震撼命中！勝負在此一舉！",
            detail: `全螢幕高光衝擊！暴擊數值結算完成，雙方承受終極招式！`,
          });

          const tR3_clean = setTimeout(() => {
            setShakeIntensity(0);
            setChipBanner(null);
            setActiveChipAnim(null);
            setFloatDamage1(null);
            setFloatDamage2(null);
          }, 2500);
          timersRef.current.push(tR3_clean);
        }, 3200);
        timersRef.current.push(tR3_impact);
      }, 700);
      timersRef.current.push(tFlashEnd);
    }, 18000);
    timersRef.current.push(tR3_start);

    // ==========================================
    // 終局結算 (27~30s)
    // ==========================================
    const tFinish = setTimeout(() => {
      finishBattle();
    }, 27000);
    timersRef.current.push(tFinish);
  }

  function finishBattle() {
    clearTimers();
    setSeconds(30);
    setCurrentStage(4);
    setIsPlaying(false);
    setFinished(true);
    setSuperFlash(false);
    setShakeIntensity(0);
    setChipBanner(null);
    setActiveChipAnim(null);
    setProjectile(null);
    setShieldActive1(false);
    setShieldActive2(false);
    retroAudio.stopBGM();

    const final1 = Number(p1.finalHp) ?? Math.max(0, initialHp1 - dmg1_p1 - dmg2_p1 - dmg3_p1 + healP1);
    const final2 = Number(p2.finalHp) ?? Math.max(0, initialHp2 - dmg1_p2 - dmg2_p2 - dmg3_p2 + healP2);
    setHp1(final1);
    setHp2(final2);

    if (final1 > final2) {
      setAction1("win");
      setAction2("die");
      if (isMeP1) retroAudio.playVictory();
      else retroAudio.playDefeat();
      setStageDesc({
        badge: "推演完成",
        step: `👑【${p1.name}】奪得本週推演勝利！`,
        detail: battleLog?.causalityAnalysis?.reasonForP1 || "週考成績優勢與晶片觸發關鍵制勝！",
      });
    } else if (final2 > final1) {
      setAction1("die");
      setAction2("win");
      if (!isMeP1) retroAudio.playVictory();
      else retroAudio.playDefeat();
      setStageDesc({
        badge: "推演完成",
        step: `👑【${p2.name}】奪得本週推演勝利！`,
        detail: battleLog?.causalityAnalysis?.reasonForP2 || "防守得當且大招爆發，成功拿下對決！",
      });
    } else {
      setAction1("win");
      setAction2("win");
      retroAudio.playDefeat();
      setStageDesc({
        badge: "推演完成",
        step: "🤝 雙方勢均力敵，握手言和！",
        detail: "雙方實力相近，本週打成平手！",
      });
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
      className={`w-full bg-slate-900 border border-slate-300 rounded-2xl overflow-hidden shadow-lg flex flex-col text-slate-100 font-sans relative transition-transform duration-100 ${
        shakeIntensity === 2
          ? "translate-x-0.5 -translate-y-0.5"
          : shakeIntensity === 3
          ? "translate-x-1 -translate-y-1"
          : shakeIntensity === 8
          ? "translate-x-2 -translate-y-2"
          : ""
      }`}
    >
      {/* Super Flash 全黑 0.6 秒 */}
      {superFlash && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center animate-fade-in">
          <div className="text-amber-400 font-black text-2xl sm:text-3xl tracking-widest animate-pulse flex items-center gap-2">
            <span>⚡ SUPER FLASH 奧義引爆</span>
          </div>
        </div>
      )}

      {/* 晶片具象特效層 */}
      {activeChipAnim && (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden flex items-center justify-center">
          {activeChipAnim === "MATH_VOID" && (
            <div className="w-full h-full bg-blue-500/10 flex items-center justify-center relative">
              <div className="w-64 h-64 border-4 border-cyan-400 rotate-45 animate-spin duration-700 shadow-[0_0_50px_rgba(34,211,238,0.8)]" />
              <div className="absolute inset-x-0 h-2 bg-gradient-to-r from-transparent via-cyan-200 to-transparent shadow-[0_0_30px_cyan] animate-pulse" />
              <div className="absolute text-cyan-200 text-xs font-mono font-bold tracking-widest top-1/3">
                幾何晶體矩陣 • 穿透打擊
              </div>
            </div>
          )}
          {activeChipAnim === "CHINESE_INK" && (
            <div className="w-full h-full bg-slate-900/40 flex items-center justify-center relative">
              <div className="text-7xl font-serif text-amber-200/50 select-none animate-ping">斬</div>
              <div className="absolute text-5xl font-serif text-slate-200/40 -left-10 animate-bounce">墨</div>
              <div className="absolute text-5xl font-serif text-slate-200/40 -right-10 animate-bounce">破</div>
            </div>
          )}
          {activeChipAnim === "ADVERSITY_SHATTER" && (
            <div className="w-full h-full bg-rose-500/15 flex items-center justify-center relative">
              <div className="w-72 h-72 rounded-full border-4 border-rose-500 animate-ping shadow-[0_0_60px_rgba(244,63,94,0.9)]" />
              <div className="absolute text-amber-300 font-black text-lg tracking-widest animate-bounce">
                🔥 逆境破甲 +35% 超量暴擊！
              </div>
            </div>
          )}
          {activeChipAnim === "GUARDIAN_BASTION" && (
            <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center relative">
              <div className="w-80 h-44 rounded-xl border-4 border-emerald-400 bg-emerald-950/60 shadow-[0_0_50px_rgba(52,211,153,0.8)] flex items-center justify-center">
                <span className="text-emerald-300 font-bold text-sm tracking-wider">🛡️ 玄武壁壘 • 減傷50%並反彈</span>
              </div>
            </div>
          )}
          {activeChipAnim === "SELF_TRANSCENDENCE" && (
            <div className="w-full h-full bg-yellow-500/20 flex items-center justify-center relative">
              <div className="w-full h-32 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_80px_gold] animate-pulse flex items-center justify-center">
                <span className="text-slate-950 font-black text-base tracking-widest">👑 自我超越 • 必定暴擊爆發</span>
              </div>
            </div>
          )}
          {activeChipAnim === "ENGLISH_STORM" && (
            <div className="w-full h-full bg-amber-500/15 flex items-center justify-center relative">
              <div className="flex gap-4 animate-pulse">
                <div className="w-20 h-1 bg-amber-300 shadow-[0_0_20px_gold]" />
                <div className="w-20 h-1 bg-amber-300 shadow-[0_0_20px_gold]" />
                <div className="w-20 h-1 bg-amber-300 shadow-[0_0_20px_gold]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 晶片大招金色橫幅 */}
      {chipBanner && (
        <div className="absolute top-1/4 left-0 right-0 z-40 flex flex-col items-center justify-center px-4 animate-in zoom-in duration-300">
          <div className={`w-full max-w-md bg-gradient-to-r ${chipBanner.color} text-white py-3 px-5 rounded-xl border border-white/50 shadow-2xl text-center space-y-1`}>
            <p className="font-extrabold text-base sm:text-lg tracking-wider text-amber-200">
              {chipBanner.title}
            </p>
            <p className="text-xs text-white/95 leading-relaxed">{chipBanner.desc}</p>
          </div>
        </div>
      )}

      {/* 頂部操作列與階段進度條 */}
      <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold overflow-x-auto">
          {[
            { stage: 1, label: "1. 試探普攻" },
            { stage: 2, label: "2. 作業護盾" },
            { stage: 3, label: "3. 晶片奧義" },
            { stage: 4, label: "4. 推演結算" },
          ].map((st) => (
            <div
              key={st.stage}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                currentStage === st.stage
                  ? "bg-indigo-600 text-white font-bold"
                  : currentStage > st.stage
                  ? "bg-slate-700 text-emerald-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <span>{st.label}</span>
              {currentStage > st.stage && <CheckCircle2 className="w-3 h-3" />}
            </div>
          ))}
          <span className="font-mono text-slate-300 ml-1">({seconds}s/30s)</span>
        </div>

        <div className="flex items-center gap-2">
          {!finished && isPlaying && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold rounded-md text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span>跳過 (Skip)</span>
            </button>
          )}

          {!isPlaying && !finished && (
            <button
              type="button"
              onClick={startSimulation}
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <span>▶ 開始播放</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            className={`px-2 py-1 rounded text-xs border ${
              soundEnabled ? "bg-slate-700 text-cyan-300 border-cyan-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
            title="音效開關"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={startSimulation}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded border border-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
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
      <div className="px-5 sm:px-8 py-3 bg-slate-800/90 border-b border-slate-700 grid grid-cols-2 gap-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 truncate">
              <span>{p1.name}</span>
              <span className="text-[10px] text-slate-300 font-mono">({p1.studentNumber})</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold shrink-0">{hp1} / {initialHp1} HP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.max(0, (hp1 / initialHp1) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 pt-0.5">
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-500/40 font-semibold truncate">
              {meta1.name}
            </span>
            {p1.hasHomeworkCompleted && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                🛡️ 護盾中
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1 text-right">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-rose-400 font-bold shrink-0">{hp2} / {initialHp2} HP</span>
            <span className="font-bold text-white flex items-center justify-end gap-1.5 truncate">
              <span className="text-[10px] text-slate-300 font-mono">({p2.studentNumber})</span>
              <span>{p2.name}</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-rose-500 to-amber-500 transition-all duration-300 ml-auto"
              style={{ width: `${Math.max(0, (hp2 / initialHp2) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300 pt-0.5">
            {p2.hasHomeworkCompleted && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                🛡️ 護盾中
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-500/40 font-semibold truncate">
              {meta2.name}
            </span>
          </div>
        </div>
      </div>

      {/* 擂台主畫面 */}
      <div className="h-64 sm:h-72 bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-900 relative flex items-center justify-between px-8 sm:px-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415520_1px,transparent_1px),linear-gradient(to_bottom,#33415520_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />

        {/* 斬擊彈道特效 */}
        {projectile === "p1_to_p2" && (
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 z-30 animate-pulse flex items-center">
            <div className="w-24 sm:w-40 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-white shadow-[0_0_20px_cyan] rounded-full rotate-[-10deg]" />
          </div>
        )}
        {projectile === "p2_to_p1" && (
          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 z-30 animate-pulse flex items-center">
            <div className="w-24 sm:w-40 h-2 bg-gradient-to-l from-transparent via-rose-400 to-white shadow-[0_0_20px_rose] rounded-full rotate-[10deg]" />
          </div>
        )}

        {/* P1 選手區域 */}
        <div className="relative flex flex-col items-center">
          {shieldActive1 && (
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.7)] animate-pulse z-20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-400 -top-6 absolute">
                🛡️ 作業護盾格擋！
              </span>
            </div>
          )}

          {floatDamage1 && (
            <div className={`absolute -top-12 font-mono font-black z-30 ${floatDamage1.isCrit ? "text-2xl text-amber-300 animate-bounce drop-shadow-[0_0_10px_gold]" : "text-lg text-rose-400"}`}>
              {floatDamage1.isCrit ? `CRITICAL! -${floatDamage1.val}` : `-${floatDamage1.val}`}
            </div>
          )}

          <PixelFighterSprite
            gender={p1.gender}
            action={action1}
            isOpponent={false}
            size={110}
          />

          <span className="mt-1 text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
            {p1.name}
          </span>
        </div>

        {/* 中央 VS 核心 */}
        <div className="text-center z-10 space-y-1">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs mx-auto shadow-inner">
            VS
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            R{currentStage}
          </span>
        </div>

        {/* P2 選手區域 */}
        <div className="relative flex flex-col items-center">
          {shieldActive2 && (
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.7)] animate-pulse z-20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-400 -top-6 absolute">
                🛡️ 作業護盾格擋！
              </span>
            </div>
          )}

          {floatDamage2 && (
            <div className={`absolute -top-12 font-mono font-black z-30 ${floatDamage2.isCrit ? "text-2xl text-amber-300 animate-bounce drop-shadow-[0_0_10px_gold]" : "text-lg text-rose-400"}`}>
              {floatDamage2.isCrit ? `CRITICAL! -${floatDamage2.val}` : `-${floatDamage2.val}`}
            </div>
          )}

          <PixelFighterSprite
            gender={p2.gender}
            action={action2}
            isOpponent={true}
            size={110}
          />

          <span className="mt-1 text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
            {p2.name}
          </span>
        </div>
      </div>

      {/* 下方清爽文字戰況解說看板 */}
      <div className="px-5 py-3.5 bg-slate-800 border-t border-slate-700 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 shrink-0 text-indigo-300 mt-0.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-900 text-indigo-200 border border-indigo-700 font-mono">
              {stageDesc.badge}
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-300 truncate">
              {stageDesc.step}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {stageDesc.detail}
          </p>
        </div>
      </div>

      {/* 終局結算因果分析卡片 */}
      {finished && (
        <div className="p-6 bg-slate-900 border-t-2 border-amber-400 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Trophy className={`w-7 h-7 ${isWinnerMe ? "text-amber-400" : isDraw ? "text-cyan-400" : "text-slate-500"}`} />
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider">
              {isWinnerMe ? "👑 VICTORY • 本週推演勝出！" : isDraw ? "🤝 DRAW • 勢均力敵！" : "⚔️ DEFEAT • 本週惜敗"}
            </h3>
          </div>

          <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-xl p-4 text-left space-y-2 shadow-inner">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>推演勝負因果分析報告</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {causalityReason || "努力完成作業啟用減傷護盾，並在自主修練中解鎖翻盤晶片。"}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={startSimulation}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
            >
              再次回放 (Replay)
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                關閉推演視窗
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

