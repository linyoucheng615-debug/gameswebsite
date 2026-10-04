"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Volume2,
  VolumeX,
  Flame,
  X,
  Zap,
  Swords,
  Coins,
  Trophy,
} from "lucide-react";
import { retroAudio } from "@/lib/audioEngine";
import { StudentBattleViewData } from "@/types";
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

const CARD_ICONS: Record<string, { icon: string; name: string; color: string }> = {
  charge: { icon: "⚡", name: "集氣", color: "text-blue-400 bg-blue-950/80 border-blue-500/50" },
  attack: { icon: "⚔️", name: "攻擊", color: "text-rose-400 bg-rose-950/80 border-rose-500/50" },
  defend: { icon: "🛡️", name: "防守", color: "text-emerald-400 bg-emerald-950/80 border-emerald-500/50" },
  break: { icon: "🔨", name: "瓦解", color: "text-purple-400 bg-purple-950/80 border-purple-500/50" },
  ultimate: { icon: "🔥", name: "必殺技", color: "text-amber-300 bg-amber-950/90 border-amber-400" },
};

export default function BattleArenaPlayer({
  data,
  onClose,
  autoStart = true,
}: BattleArenaPlayerProps) {
  const { student, currentMatch } = data;

  const mySkin = currentMatch?.mySkin || {
    gender: (student.skinGender as SkinGender) || "boy",
    charClass: (student.skinClass as SkinClass) || "warrior",
    color: (student.skinColor as SkinColor) || "blue",
  };

  const oppSkin = currentMatch?.opponentSkin || {
    gender: "girl" as SkinGender,
    charClass: "mage" as SkinClass,
    color: "red" as SkinColor,
  };

  const myCards = currentMatch?.myCards || ["charge", "attack", "defend", "charge", "ultimate"];
  const oppCards = currentMatch?.opponentCards || ["attack", "charge", "defend", "break", "ultimate"];

  const initialHpA = Math.min(100, Math.max(30, currentMatch?.myStartingHp || 90));
  const initialHpB = Math.min(100, Math.max(30, currentMatch?.opponentStartingHp || 85));

  const hasBuffA = currentMatch?.myHasBuff ?? true;
  const hasBuffB = currentMatch?.opponentHasBuff ?? false;

  // 狀態管理
  const [currentRound, setCurrentRound] = useState<number>(0); // 0: 準備, 1~5: 回合進行, 6: 終局結算
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 雙方血量
  const [hpA, setHpA] = useState<number>(initialHpA);
  const [hpB, setHpB] = useState<number>(initialHpB);

  // 氣量槽 (0 ~ 3)
  const [energyA, setEnergyA] = useState<number>(hasBuffA ? 1 : 0);
  const [energyB, setEnergyB] = useState<number>(hasBuffB ? 1 : 0);

  // 角色精靈圖動畫狀態
  const [actionA, setActionA] = useState<FighterAction>("idle");
  const [actionB, setActionB] = useState<FighterAction>("idle");

  // 出招揭曉卡片
  const [cardRevealedA, setCardRevealedA] = useState<string | null>(null);
  const [cardRevealedB, setCardRevealedB] = useState<string | null>(null);

  // 浮動傷害飄字
  const [floatDamageA, setFloatDamageA] = useState<number | null>(null);
  const [floatDamageB, setFloatDamageB] = useState<number | null>(null);

  // 特效與畫面反饋
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [superFlash, setSuperFlash] = useState<boolean>(false);
  const [guardTextA, setGuardTextA] = useState<string | null>(null);
  const [guardTextB, setGuardTextB] = useState<string | null>(null);

  // 戰況文字記錄跑馬燈
  const [commentary, setCommentary] = useState<string>("雙方冒險者就位，準備揭曉回合戰術！");

  // 結算結果
  const [winner, setWinner] = useState<"A" | "B" | "DRAW" | null>(null);
  const [isKO, setIsKO] = useState<boolean>(false);

  // 加油互動
  const [cheerCount, setCheerCount] = useState<number>(0);
  const [showCheerAnim, setShowCheerAnim] = useState<boolean>(false);

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
    setShowCheerAnim(true);
    retroAudio.playMagic();
    setTimeout(() => setShowCheerAnim(false), 800);
  }

  // 5 回合策略對決演練排程器
  function runFiveRoundBattle(speed: number = 1) {
    clearAllTimers();
    setIsPlaying(true);
    setCurrentRound(0);
    setHpA(initialHpA);
    setHpB(initialHpB);
    setEnergyA(hasBuffA ? 1 : 0);
    setEnergyB(hasBuffB ? 1 : 0);
    setActionA("idle");
    setActionB("idle");
    setCardRevealedA(null);
    setCardRevealedB(null);
    setFloatDamageA(null);
    setFloatDamageB(null);
    setGuardTextA(null);
    setGuardTextB(null);
    setIsShaking(false);
    setSuperFlash(false);
    setWinner(null);
    setIsKO(false);

    if (soundEnabled) {
      retroAudio.startBGM();
    }

    const baseUnit = 2400 / speed; // 每個回合約 2.4 秒
    setCommentary(`【對決準備】${student.name} vs ${currentMatch?.opponentName || "神秘對手"}，戰鬥展開！`);

    // 建立 5 回合狀態機依序執行
    let curHpA = initialHpA;
    let curHpB = initialHpB;
    let curEnergyA = hasBuffA ? 1 : 0;
    let curEnergyB = hasBuffB ? 1 : 0;

    for (let r = 0; r < 5; r++) {
      const roundIndex = r;
      const cA = myCards[roundIndex] || "attack";
      const cB = oppCards[roundIndex] || "attack";

      const tStart = setTimeout(() => {
        // 如果前一回合已分出勝負提前 KO，則不再執行後續回合
        if (curHpA <= 0 || curHpB <= 0) return;

        const roundNum = roundIndex + 1;
        setCurrentRound(roundNum);

        // 【階段 1：出招揭曉】(0s)
        setCardRevealedA(cA);
        setCardRevealedB(cB);
        setFloatDamageA(null);
        setFloatDamageB(null);
        setGuardTextA(null);
        setGuardTextB(null);

        const cardNameA = CARD_ICONS[cA]?.name || "出招";
        const cardNameB = CARD_ICONS[cB]?.name || "出招";
        setCommentary(`【ROUND ${roundNum} / 5】${student.name} 出【${cardNameA}】⚔️ ${currentMatch?.opponentName} 出【${cardNameB}】！`);

        // 【階段 2：招式動畫觸發】(0.6s)
        const tAction = setTimeout(() => {
          let spentUltA = false;
          let spentUltB = false;

          // 能量計算
          if (cA === "charge") {
            curEnergyA = Math.min(3, curEnergyA + 2);
            setEnergyA(curEnergyA);
            retroAudio.playMagic();
          } else if (cA === "ultimate") {
            if (curEnergyA >= 3) {
              curEnergyA -= 3;
              setEnergyA(curEnergyA);
              spentUltA = true;
              setSuperFlash(true);
              retroAudio.playCrit();
            }
          }

          if (cB === "charge") {
            curEnergyB = Math.min(3, curEnergyB + 2);
            setEnergyB(curEnergyB);
            retroAudio.playMagic();
          } else if (cB === "ultimate") {
            if (curEnergyB >= 3) {
              curEnergyB -= 3;
              setEnergyB(curEnergyB);
              spentUltB = true;
              setSuperFlash(true);
              retroAudio.playCrit();
            }
          }

          // 設置動作
          setActionA(cA === "defend" ? "defend" : cA === "charge" ? "idle" : "attack");
          setActionB(cB === "defend" ? "defend" : cB === "charge" ? "idle" : "attack");

          if (cA === "defend") retroAudio.playShieldBlock();
          if (cB === "defend") retroAudio.playShieldBlock();
          if (cA === "attack") retroAudio.playSlash();
          if (cB === "attack") retroAudio.playSlash();

          // 【階段 3：受擊判定與扣血跳字】(1.2s)
          const tHit = setTimeout(() => {
            setSuperFlash(false);

            let dmgToB = 0;
            let dmgToA = 0;
            let guardB = false;
            let guardA = false;
            let shatterB = false;
            let shatterA = false;

            // 計算 A 對 B 的傷害
            if (cA === "attack") {
              if (cB === "defend") {
                dmgToB = 10; // 防守減傷 50%
                guardB = true;
                curEnergyB = Math.min(3, curEnergyB + 1); // 防禦成功回補 1 氣
                setEnergyB(curEnergyB);
              } else if (cB === "charge" || cB === "break") {
                dmgToB = 25; // 破招重擊
              } else {
                dmgToB = 20;
              }
            } else if (cA === "break") {
              if (cB === "defend") {
                dmgToB = 35; // 破盾大重創
                shatterB = true;
              } else if (cB === "attack" || cB === "ultimate") {
                dmgToB = 0; // 被對手攻擊打斷
              } else {
                dmgToB = 15;
              }
            } else if (cA === "ultimate") {
              if (spentUltA) {
                if (cB === "defend") {
                  dmgToB = 25;
                  guardB = true;
                } else {
                  dmgToB = 50;
                }
              } else {
                dmgToB = 15; // 氣不足普通揮砍
              }
            }

            // 計算 B 對 A 的傷害
            if (cB === "attack") {
              if (cA === "defend") {
                dmgToA = 10;
                guardA = true;
                curEnergyA = Math.min(3, curEnergyA + 1);
                setEnergyA(curEnergyA);
              } else if (cA === "charge" || cA === "break") {
                dmgToA = 25;
              } else {
                dmgToA = 20;
              }
            } else if (cB === "break") {
              if (cA === "defend") {
                dmgToA = 35;
                shatterA = true;
              } else if (cA === "attack" || cA === "ultimate") {
                dmgToA = 0;
              } else {
                dmgToA = 15;
              }
            } else if (cB === "ultimate") {
              if (spentUltB) {
                if (cA === "defend") {
                  dmgToA = 25;
                  guardA = true;
                } else {
                  dmgToA = 50;
                }
              } else {
                dmgToA = 15;
              }
            }

            // 扣除血量
            curHpA = Math.max(0, curHpA - dmgToA);
            curHpB = Math.max(0, curHpB - dmgToB);
            setHpA(curHpA);
            setHpB(curHpB);

            if (dmgToA > 0) setFloatDamageA(dmgToA);
            if (dmgToB > 0) setFloatDamageB(dmgToB);

            if (guardA) setGuardTextA("GUARD! 減傷50%");
            if (guardB) setGuardTextB("GUARD! 減傷50%");
            if (shatterA) setGuardTextA("SHATTER! 盾碎重創");
            if (shatterB) setGuardTextB("SHATTER! 盾碎重創");

            if (dmgToA > 0) setActionA("hurt");
            if (dmgToB > 0) setActionB("hurt");

            if (dmgToA > 0 || dmgToB > 0) {
              setIsShaking(true);
              retroAudio.playHit();
            }

            // 文字解說
            if (spentUltA || spentUltB) {
              setCommentary(`【回合 ${roundNum} 必殺爆發】全螢幕毀滅打擊震撼戰場！`);
            } else if (shatterB || shatterA) {
              setCommentary(`【回合 ${roundNum} 破防】瓦解戰術奏效，防禦護盾瞬間震碎！`);
            } else if (guardA || guardB) {
              setCommentary(`【回合 ${roundNum} 完美格擋】堅固盾牆化解猛烈攻勢！`);
            }

            // 震動結束與重置動作
            const tReset = setTimeout(() => {
              setIsShaking(false);
              setActionA(curHpA <= 0 ? "die" : "idle");
              setActionB(curHpB <= 0 ? "die" : "idle");
            }, 0.5 * (1000 / speed));
            activeTimersRef.current.push(tReset);

            // 檢查是否 KO 提前結束或為第 5 回合結算
            if (curHpA <= 0 || curHpB <= 0 || roundIndex === 4) {
              const tFinish = setTimeout(() => {
                handleBattleFinish(curHpA, curHpB);
              }, 1.2 * (1000 / speed));
              activeTimersRef.current.push(tFinish);
            }
          }, 0.6 * (1000 / speed));
          activeTimersRef.current.push(tHit);
        }, 0.6 * (1000 / speed));
        activeTimersRef.current.push(tAction);
      }, (r * 2.5 + 0.5) * baseUnit);

      activeTimersRef.current.push(tStart);
    }
  }

  function handleBattleFinish(finalHpA: number, finalHpB: number) {
    setCurrentRound(6); // 結算狀態
    setIsPlaying(false);
    retroAudio.stopBGM();

    let winState: "A" | "B" | "DRAW" = "DRAW";
    const isKnockout = finalHpA <= 0 || finalHpB <= 0;
    setIsKO(isKnockout);

    if (finalHpA > finalHpB) {
      winState = "A";
      setActionA("win");
      setActionB("die");
      retroAudio.playVictory();
      setCommentary(
        isKnockout
          ? `【K.O. 勝利】${student.name} 提前擊潰對手！強勢贏得勝利！`
          : `【點數勝出】5 回合戰罷，${student.name} 憑藉血量優勢奪得勝利！`
      );
    } else if (finalHpB > finalHpA) {
      winState = "B";
      setActionB("win");
      setActionA("die");
      retroAudio.playDefeat();
      setCommentary(
        isKnockout
          ? `【K.O. 惜敗】對手發動強力連擊擊破防線，下週再接再厲！`
          : `【戰術惜敗】5 回合戰罷，對手血量領先獲得勝利！`
      );
    } else {
      winState = "DRAW";
      setActionA("win");
      setActionB("win");
      retroAudio.playDefeat();
      setCommentary("【平局平手】雙方戰術勢均力敵，打出精彩平局！");
    }

    setWinner(winState);
  }

  useEffect(() => {
    if (autoStart) {
      runFiveRoundBattle(speedMultiplier);
    }
  }, []);

  const isMyWin = winner === "A";
  const isMyLoss = winner === "B";
  const isMyDraw = winner === "DRAW";

  return (
    <div
      className={`w-full bg-[#0b0f19] border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 font-sans relative ${
        superFlash ? "brightness-200 saturate-150" : ""
      }`}
    >
      {/* 頂部操作列 */}
      <div className="px-4 py-3 bg-[#070b14]/95 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap relative z-20">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
            {currentRound === 0
              ? "READY"
              : currentRound <= 5
              ? `ROUND ${currentRound} / 5`
              : isKO
              ? "K.O. FINISH!"
              : "ROUND OVER"}
          </span>
          <span className="text-slate-200 text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
            第 {currentMatch?.weekNumber || 1} 週 • 5 回合策略對決
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
              runFiveRoundBattle(next);
            }}
            className="px-2.5 py-1.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 transition-colors"
          >
            {speedMultiplier}x
          </button>

          {/* 重播 */}
          <button
            type="button"
            onClick={() => runFiveRoundBattle(speedMultiplier)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-pixel text-[10px] transition-all flex items-center gap-1 border border-slate-600 hover:border-amber-400"
          >
            <RotateCcw className="w-3 h-3" />
            <span>REPLAY</span>
          </button>

          {/* 關閉返回大廳 */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/60 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>返回大廳</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 回合街機戰鬥擂台舞台 */}
      <div
        className={`relative bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#1e293b] p-4 sm:p-8 flex flex-col justify-between transition-transform min-h-[460px] ${
          isShaking ? "animate-battle-shake" : ""
        }`}
      >
        {/* Super Flash 全螢幕必殺閃光特寫 */}
        {superFlash && (
          <div className="absolute inset-0 bg-amber-400/20 backdrop-brightness-150 pointer-events-none z-30 animate-pulse flex items-center justify-center">
            <span className="font-pixel text-2xl sm:text-4xl text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,1)] tracking-widest">
              💥 SUPER FLASH ULTIMATE!!
            </span>
          </div>
        )}

        {/* 頂部數值面板：厚邊框像素血條 + 氣量槽 (3 Gems) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-14 relative z-10">
          {/* 左方玩家（我方）狀態 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{student.name}</span>
                <span className="font-pixel text-[9px] text-sky-400">({student.studentNumber})</span>
                {hasBuffA && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    +1氣護盾
                  </span>
                )}
              </div>
              <span className="font-pixel text-[10px] text-emerald-400 font-bold">
                {hpA} / {initialHpA} HP
              </span>
            </div>

            {/* 厚邊框血條 */}
            <div className="w-full h-4 bg-[#450a0a] rounded-xs p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div
                className="h-full rounded-xs transition-all duration-300"
                style={{
                  width: `${Math.max(0, (hpA / initialHpA) * 100)}%`,
                  backgroundColor: hpA > 50 ? "#34d399" : hpA > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

            {/* 3 顆氣量寶石槽 (◇ ◇ ◇) */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-bold font-mono">ENERGY:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((gem) => (
                  <div
                    key={gem}
                    className={`w-3.5 h-3.5 rounded-sm rotate-45 border transition-all ${
                      energyA >= gem
                        ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,1)]"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  />
                ))}
              </div>
              {energyA >= 3 && (
                <span className="text-[10px] font-pixel text-amber-300 font-bold animate-pulse ml-1">
                  READY!
                </span>
              )}
            </div>
          </div>

          {/* 右方玩家（對手）狀態 */}
          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-between text-xs flex-row-reverse">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{currentMatch?.opponentName || "神秘對手"}</span>
                {hasBuffB && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    +1氣
                  </span>
                )}
              </div>
              <span className="font-pixel text-[10px] text-emerald-400 font-bold">
                {hpB} / {initialHpB} HP
              </span>
            </div>

            {/* 厚邊框血條 (對手) */}
            <div className="w-full h-4 bg-[#450a0a] rounded-xs p-0.5 border-2 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex justify-end relative overflow-hidden">
              <div
                className="h-full rounded-xs transition-all duration-300"
                style={{
                  width: `${Math.max(0, (hpB / initialHpB) * 100)}%`,
                  backgroundColor: hpB > 50 ? "#34d399" : hpB > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

            {/* 3 顆氣量寶石槽 (對手) */}
            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              {energyB >= 3 && (
                <span className="text-[10px] font-pixel text-amber-300 font-bold animate-pulse mr-1">
                  READY!
                </span>
              )}
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((gem) => (
                  <div
                    key={gem}
                    className={`w-3.5 h-3.5 rounded-sm rotate-45 border transition-all ${
                      energyB >= gem
                        ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,1)]"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-bold font-mono">:ENERGY</span>
            </div>
          </div>
        </div>

        {/* 擂台中央角色與打擊對決區 */}
        <div className="relative my-8 flex items-center justify-between px-2 sm:px-14 z-10">
          {/* 左方角色容器 */}
          <div className="relative flex flex-col items-center">
            {/* 頭頂翻開出招卡牌標籤 */}
            {cardRevealedA && (
              <div
                className={`absolute -top-14 px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg border animate-bounce z-20 ${
                  CARD_ICONS[cardRevealedA]?.color || "text-white"
                }`}
              >
                <span className="text-base">{CARD_ICONS[cardRevealedA]?.icon}</span>
                <span>{CARD_ICONS[cardRevealedA]?.name}</span>
              </div>
            )}

            {/* 防禦格擋或破盾飄字 */}
            {guardTextA && (
              <div className="absolute -top-6 font-bold text-xs text-cyan-300 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-cyan-400 z-30">
                {guardTextA}
              </div>
            )}

            {/* 受傷扣血飄字 */}
            {floatDamageA && floatDamageA > 0 && (
              <div className="absolute -top-12 font-pixel text-xl sm:text-2xl text-rose-400 animate-float-damage pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,1)] z-40">
                -{floatDamageA} HP
              </div>
            )}

            {/* 16-bit 像素角色渲染 */}
            <PixelFighterSprite
              gender={mySkin.gender}
              charClass={mySkin.charClass}
              color={mySkin.color}
              action={actionA}
              size={150}
            />

            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-white">{student.name}</span>
            </div>
          </div>

          {/* 中央回合狀態標籤與結算 */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            {currentRound > 0 && currentRound <= 5 && (
              <div className="space-y-1">
                <div className="font-pixel text-xs sm:text-sm text-amber-400 tracking-wider">
                  ROUND {currentRound} / 5
                </div>
                <div className="font-pixel text-[10px] text-slate-400">CLASH!</div>
              </div>
            )}

            {/* 學生點擊集氣加油按鈕 */}
            {currentRound <= 5 && (
              <button
                type="button"
                onClick={handleCheer}
                className="mt-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-pixel text-[10px] rounded transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
              >
                <Flame className="w-3 h-3 text-white fill-white" />
                <span>CHEER! {cheerCount > 0 && `(${cheerCount})`}</span>
              </button>
            )}

            {showCheerAnim && (
              <div className="font-pixel text-[10px] text-amber-300 animate-cheer-spark pointer-events-none mt-1">
                ⭐ +PWR!
              </div>
            )}

            {/* 終局結算卡片 (Round 6) */}
            {currentRound === 6 && (
              <div className="animate-fadeIn p-4 sm:p-5 rounded-2xl bg-[#0b0f19]/95 border-2 border-amber-400 shadow-2xl max-w-xs space-y-3">
                {isMyWin && (
                  <div className="space-y-1">
                    <div className="font-pixel text-xl sm:text-2xl text-[#F59E0B] tracking-wider drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
                      VICTORY
                    </div>
                    <p className="text-xs text-slate-200 font-sans">
                      🏆 恭喜勝出！戰術壓制取得最終榮耀！
                    </p>
                  </div>
                )}
                {isMyLoss && (
                  <div className="space-y-1">
                    <div className="font-pixel text-xl sm:text-2xl text-[#E11D48] tracking-wider drop-shadow-[0_0_12px_rgba(225,29,72,0.8)]">
                      DEFEAT
                    </div>
                    <p className="text-xs text-slate-200 font-sans">
                      惜敗！至戰術室重新調整出招克敵！
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

                {/* 發放本週獎勵 */}
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-around font-mono font-bold">
                  <span className="text-emerald-400">+50 EXP</span>
                  <span className="text-yellow-300">+25 💰</span>
                </div>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    返回冒險者大廳
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 右方角色容器（對手） */}
          <div className="relative flex flex-col items-center">
            {/* 頭頂翻開出招卡牌標籤 */}
            {cardRevealedB && (
              <div
                className={`absolute -top-14 px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg border animate-bounce z-20 ${
                  CARD_ICONS[cardRevealedB]?.color || "text-white"
                }`}
              >
                <span className="text-base">{CARD_ICONS[cardRevealedB]?.icon}</span>
                <span>{CARD_ICONS[cardRevealedB]?.name}</span>
              </div>
            )}

            {/* 防禦格擋或破盾飄字 */}
            {guardTextB && (
              <div className="absolute -top-6 font-bold text-xs text-cyan-300 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-cyan-400 z-30">
                {guardTextB}
              </div>
            )}

            {/* 受傷扣血飄字 */}
            {floatDamageB && floatDamageB > 0 && (
              <div className="absolute -top-12 font-pixel text-xl sm:text-2xl text-rose-400 animate-float-damage pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,1)] z-40">
                -{floatDamageB} HP
              </div>
            )}

            {/* 16-bit 像素角色渲染（對手翻轉） */}
            <PixelFighterSprite
              gender={oppSkin.gender}
              charClass={oppSkin.charClass}
              color={oppSkin.color}
              action={actionB}
              isOpponent={true}
              size={150}
            />

            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-white">
                {currentMatch?.opponentName || "神秘對手"}
              </span>
            </div>
          </div>
        </div>

        {/* 底部即時戰況跑馬燈 */}
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-center text-xs text-amber-300 font-sans tracking-wide relative z-10 shadow-inner">
          {commentary}
        </div>
      </div>
    </div>
  );
}
