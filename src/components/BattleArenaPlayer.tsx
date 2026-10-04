"use client";

import { useEffect, useState, useRef } from "react";
import {
  Shield,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Volume2,
  VolumeX,
  Flame,
  X,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";
import { retroAudio } from "@/lib/audioEngine";
import { StudentBattleViewData, BattleLog } from "@/types";

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
  const matchLog = currentMatch?.battleLog;
  const isPlayerA = currentMatch?.isPlayerA ?? true;

  // 戰鬥狀態控制
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
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

  // 學生互動集氣
  const [cheerCount, setCheerCount] = useState<number>(0);
  const [showCheerEffect, setShowCheerEffect] = useState<boolean>(false);

  const activeTimersRef = useRef<any[]>([]);

  function clearAllTimers() {
    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current = [];
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

  function handleCheer() {
    setCheerCount((prev) => prev + 1);
    setShowCheerEffect(true);
    retroAudio.playMagic();
    setTimeout(() => setShowCheerEffect(false), 800);
  }

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

    // 回合 0: 登場
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

    // 回合 2: 作業護盾防禦回合 (3.5s) - 吸收 5 點傷害
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
        retroAudio.playShieldBlock();
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

    // 回合 3: 職業奧義決戰 (5.4s)
    const t3 = setTimeout(() => {
      setCurrentRound(3);
      setShieldAbsorbActiveA(false);
      setShieldAbsorbActiveB(false);
      setActiveSkillA(metaA.skillName);
      setActiveSkillB(metaB.skillName);

      setCommentary(
        `【回合 3：奧義決戰】${log.playerA.name} 施放【${metaA.skillName}】！${log.playerB.name} 爆發【${metaB.skillName}】！！`
      );

      retroAudio.playCrit();
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

  useEffect(() => {
    if (autoStart && matchLog) {
      runMultiTurnBattle(matchLog, speedMultiplier);
    }
  }, [matchLog]);

  if (!currentMatch || !matchLog) {
    return (
      <div className="p-8 bg-[#111827] border border-slate-700 rounded-xl text-center space-y-3">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
        <h2 className="text-base font-bold text-white">本週週考對決準備中</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          老師正在為全班進行作業檢核與週考批改。結算完成後，將在此呈現專屬您的 2D 像素戰鬥！
        </p>
      </div>
    );
  }

  const myFighter = isPlayerA ? matchLog.playerA : matchLog.playerB;
  const opponentFighter = isPlayerA ? matchLog.playerB : matchLog.playerA;

  const myHp = isPlayerA ? hpA : hpB;
  const opponentHp = isPlayerA ? hpB : hpA;

  const myDamage = isPlayerA ? floatDamageA : floatDamageB;
  const opponentDamage = isPlayerA ? floatDamageB : floatDamageA;

  const myShieldAbsorb = isPlayerA ? shieldAbsorbActiveA : shieldAbsorbActiveB;
  const opponentShieldAbsorb = isPlayerA ? shieldAbsorbActiveB : shieldAbsorbActiveA;

  const myActiveSkill = isPlayerA ? activeSkillA : activeSkillB;
  const opponentActiveSkill = isPlayerA ? activeSkillB : activeSkillA;

  const myAvatar = getAvatarMeta(student.avatarId);
  const opponentAvatar = getAvatarMeta(currentMatch.opponentAvatar);

  const isMyWin = currentMatch.result === "win";
  const isMyLoss = currentMatch.result === "loss";
  const isMyDraw = currentMatch.result === "draw";

  return (
    <div className="w-full bg-[#0b0f19] border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 font-sans">
      {/* 頂部操作控制列 */}
      <div className="px-4 py-3 bg-[#070b14]/95 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
            {currentRound === 0
              ? "READY"
              : currentRound <= 3
              ? `ROUND ${currentRound} / 3`
              : "KO!"}
          </span>
          <span className="text-slate-200 text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
            第 {currentMatch.weekNumber} 週 • {currentMatch.weekTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 音效開關 */}
          <button
            type="button"
            onClick={toggleSound}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              soundEnabled
                ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/60 hover:bg-indigo-900"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="開關 8-bit 音效"
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
              if (matchLog) runMultiTurnBattle(matchLog, next);
            }}
            className="px-2.5 py-1.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 transition-colors"
          >
            {speedMultiplier}x
          </button>

          {/* 重播 */}
          <button
            type="button"
            onClick={() => runMultiTurnBattle(matchLog, speedMultiplier)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-pixel text-[10px] transition-all flex items-center gap-1 border border-slate-600 hover:border-amber-400"
          >
            <RotateCcw className="w-3 h-3" />
            <span>REPLAY</span>
          </button>

          {/* 關閉返回大廳按鈕 */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/60 rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>返回大廳</span>
            </button>
          )}
        </div>
      </div>

      {/* 戰鬥中央舞台 */}
      <div
        className={`relative bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#1e293b] p-4 sm:p-8 flex flex-col justify-between transition-transform ${
          isShaking ? "animate-battle-shake" : ""
        } ${clashFlash ? "brightness-125" : ""}`}
        style={{ minHeight: "420px" }}
      >
        {/* 雙方厚邊框血條 + 戰力 */}
        <div className="grid grid-cols-2 gap-4 sm:gap-12">
          {/* 我方狀態列 */}
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

            <div className="w-full h-4 bg-[#450a0a] rounded-xs p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div
                className="h-full rounded-xs transition-all duration-500"
                style={{
                  width: `${Math.max(0, myHp)}%`,
                  backgroundColor: myHp > 50 ? "#34d399" : myHp > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

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

          {/* 對手狀態列 */}
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

            <div className="w-full h-4 bg-[#450a0a] rounded-xs p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex justify-end relative overflow-hidden">
              <div
                className="h-full rounded-xs transition-all duration-500"
                style={{
                  width: `${Math.max(0, opponentHp)}%`,
                  backgroundColor: opponentHp > 50 ? "#34d399" : opponentHp > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

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
        <div className="relative my-6 flex items-center justify-between px-2 sm:px-12">
          {/* 我方選手 */}
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

            {/* 角色主體 */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-4xl sm:text-5xl bg-gradient-to-br ${myAvatar.bgGradient} border-2 ${myAvatar.border} shadow-xl relative z-10 transition-transform ${
                currentRound === 4 && isMyWin ? "scale-110 animate-bounce" : ""
              }`}
            >
              {myAvatar.emoji}
            </div>

            {/* 站立微光基座 */}
            <div className="w-24 sm:w-28 h-5 sm:h-6 -mt-3 bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20 rounded-full blur-[2px] border border-sky-400/40 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />

            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-white">{student.name}</span>
            </div>
          </div>

          {/* 中間對決動態指示器與結算彈窗 */}
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

            {/* 集氣加油按鈕 */}
            <button
              type="button"
              onClick={handleCheer}
              className="mt-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-pixel text-[10px] rounded transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
            >
              <Flame className="w-3 h-3 text-white fill-white" />
              <span>CHEER! {cheerCount > 0 && `(${cheerCount})`}</span>
            </button>

            {showCheerEffect && (
              <div className="font-pixel text-[10px] text-amber-300 animate-cheer-spark pointer-events-none mt-1">
                ⭐ +PWR!
              </div>
            )}

            {/* 結算彈窗卡片 */}
            {currentRound === 4 && (
              <div className="mt-3 animate-fadeIn p-4 rounded-xl bg-[#0b0f19]/95 border-2 border-slate-400 shadow-2xl max-w-xs space-y-2">
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

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full mt-2 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded transition-all"
                  >
                    關閉返回大廳
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 對手選手 */}
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
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-4xl sm:text-5xl bg-gradient-to-br ${opponentAvatar.bgGradient} border-2 ${opponentAvatar.border} shadow-xl relative z-10 transition-transform ${
                currentRound === 4 && isMyLoss ? "scale-110 animate-bounce" : ""
              }`}
            >
              {opponentFighter?.isBot ? "🤖" : opponentAvatar.emoji}
            </div>

            {/* 站立微光基座 */}
            <div className="w-24 sm:w-28 h-5 sm:h-6 -mt-3 bg-gradient-to-r from-amber-500/20 via-orange-400/40 to-amber-500/20 rounded-full blur-[2px] border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />

            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-white">
                {currentMatch.opponentName}
              </span>
            </div>
          </div>
        </div>

        {/* 底部即時戰鬥播報日誌 */}
        <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-md text-center text-xs text-amber-300 font-sans tracking-wide">
          {commentary}
        </div>
      </div>
    </div>
  );
}

