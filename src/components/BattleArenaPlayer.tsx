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
  Swords,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { retroAudio } from "@/lib/audioEngine";
import PixelFighterSprite, { FighterAction } from "@/components/PixelFighterSprite";
import { TACTICAL_CHIPS, ChipId } from "@/lib/chips";
import { BattleLogData, ChipCode, FighterState, RoundAction } from "@/types/battle";

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
  // =========================================================================
  // 1. 防禦性解析 (Error Boundary & Safe Fallback Mock) - 嚴格防白屏
  // =========================================================================
  let parsed: BattleLogData | null = null;
  if (typeof battleLog === "string") {
    try {
      parsed = JSON.parse(battleLog);
    } catch {
      parsed = null;
    }
  } else if (battleLog && typeof battleLog === "object") {
    parsed = battleLog as BattleLogData;
  }

  // 取得選手資料 (相容 2.0 fighterA/fighterB 與舊版 player1/player2)
  const fA: FighterState = parsed?.fighterA || (parsed?.player1 ? {
    id: parsed.player1.id || "p1_id",
    name: parsed.player1.name || "學生A",
    studentNumber: parsed.player1.studentNumber || "S101",
    gender: (parsed.player1.gender as "BOY" | "GIRL") || "BOY",
    initialHp: Number(parsed.player1.initialHp) || 85,
    currentHp: Number(parsed.player1.finalHp) || 45,
    hasHomeworkShield: !!parsed.player1.hasHomeworkCompleted,
    equippedChip: (parsed.player1.equippedChip as ChipCode) || "ADVERSITY_SHATTER",
    isWeakened: false,
    chipName: parsed.player1.chipName,
    bannerColor: parsed.player1.bannerColor,
  } : {
    id: "fA_default",
    name: "王小明",
    studentNumber: currentStudentNumber || "S101",
    gender: "BOY",
    initialHp: 85,
    currentHp: 40,
    hasHomeworkShield: true,
    equippedChip: "ADVERSITY_SHATTER",
    isWeakened: false,
    chipName: "逆境破甲焰",
  });

  const fB: FighterState = parsed?.fighterB || (parsed?.player2 ? {
    id: parsed.player2.id || "p2_id",
    name: parsed.player2.name || "班級守護教練",
    studentNumber: parsed.player2.studentNumber || "COACH_NPC",
    gender: (parsed.player2.gender as "BOY" | "GIRL") || "BOY",
    initialHp: Number(parsed.player2.initialHp) || 80,
    currentHp: Number(parsed.player2.finalHp) || 25,
    hasHomeworkShield: !!parsed.player2.hasHomeworkCompleted,
    equippedChip: (parsed.player2.equippedChip as ChipCode) || "GUARDIAN_BASTION",
    isWeakened: false,
    isShadowCoach: parsed.player2.studentNumber === "COACH_NPC",
    chipName: parsed.player2.chipName,
    bannerColor: parsed.player2.bannerColor,
  } : {
    id: "fB_default",
    name: "班級守護教練",
    studentNumber: "COACH_NPC",
    gender: "BOY",
    initialHp: 80,
    currentHp: 20,
    hasHomeworkShield: true,
    equippedChip: "GUARDIAN_BASTION",
    isWeakened: false,
    isShadowCoach: true,
    chipName: "守護壁壘",
  });

  const isMeA = !currentStudentNumber || currentStudentNumber === fA.studentNumber;
  const chipA = fA.equippedChip || "ADVERSITY_SHATTER";
  const chipB = fB.equippedChip || "GUARDIAN_BASTION";
  const metaA = TACTICAL_CHIPS[chipA] || TACTICAL_CHIPS.ADVERSITY_SHATTER;
  const metaB = TACTICAL_CHIPS[chipB] || TACTICAL_CHIPS.GUARDIAN_BASTION;

  const initialHpA = Math.max(30, Number(fA.initialHp) || 85);
  const initialHpB = Math.max(30, Number(fB.initialHp) || 80);

  // 提取 Round Actions
  const rawRounds = Array.isArray(parsed?.rounds) ? parsed.rounds : [];
  const r1Actions = rawRounds.filter((r: any) => r.round === 1);
  const r2Actions = rawRounds.filter((r: any) => r.round === 2);
  const r3Actions = rawRounds.filter((r: any) => r.round === 3);

  // 數值防呆轉換
  const dmg1_toB = Number(r1Actions.find((a: any) => a.attackerId === fA.id)?.damage) || 14;
  const dmg1_toA = Number(r1Actions.find((a: any) => a.attackerId === fB.id)?.damage) || 14;

  const r2_toB = r2Actions.find((a: any) => a.attackerId === fA.id);
  const r2_toA = r2Actions.find((a: any) => a.attackerId === fB.id);
  const dmg2_toB = Number(r2_toB?.damage) || 18;
  const dmg2_toA = Number(r2_toA?.damage) || 18;

  const r3_toB = r3Actions.find((a: any) => a.attackerId === fA.id);
  const r3_toA = r3Actions.find((a: any) => a.attackerId === fB.id);
  const dmg3_toB = Number(r3_toB?.damage) || 35;
  const dmg3_toA = Number(r3_toA?.damage) || 25;

  // 狀態管理
  const [seconds, setSeconds] = useState(0);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [stageDesc, setStageDesc] = useState<{ step: string; detail: string; badge: string }>({
    badge: "00s 開局姿態",
    step: "推演準備就緒",
    detail: "點擊播放按鈕開始 30 秒學力推演回放...",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [hpA, setHpA] = useState(initialHpA);
  const [hpB, setHpB] = useState(initialHpB);

  const [actionA, setActionA] = useState<FighterAction>("idle");
  const [actionB, setActionB] = useState<FighterAction>("idle");

  // 弱化 (WEAKENED) 標記狀態
  const [weakenedA, setWeakenedA] = useState(fA.isWeakened);
  const [weakenedB, setWeakenedB] = useState(fB.isWeakened);

  // 元素彈道
  const [projectile, setProjectile] = useState<{
    dir: "a_to_b" | "b_to_a";
    element: "math" | "ink" | "storm" | "flame" | "shield" | "normal";
  } | null>(null);

  // 護盾與反彈光波
  const [shieldActiveA, setShieldActiveA] = useState(false);
  const [shieldActiveB, setShieldActiveB] = useState(false);
  const [pierceActive, setPierceActive] = useState<"A" | "B" | null>(null);
  const [reflectActive, setReflectActive] = useState<"A" | "B" | null>(null);

  // 跳字傷害浮層
  const [floatDamageA, setFloatDamageA] = useState<{ text: string; isCrit?: boolean; isWeak?: boolean } | null>(null);
  const [floatDamageB, setFloatDamageB] = useState<{ text: string; isCrit?: boolean; isWeak?: boolean } | null>(null);

  // 震屏與奧義演出
  const [shakeIntensity, setShakeIntensity] = useState<number>(0);
  const [superFlash, setSuperFlash] = useState(false);
  const [chipBanner, setChipBanner] = useState<{ title: string; desc: string; color: string } | null>(null);
  const [activeChipAnim, setActiveChipAnim] = useState<ChipCode | null>(null);

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

  // 根據晶片代碼返回專屬普攻彈道元素
  function getChipElement(chip: ChipCode): "math" | "ink" | "storm" | "flame" | "shield" | "normal" {
    switch (chip) {
      case "MATH_VOID": return "math";
      case "CHINESE_INK": return "ink";
      case "ENGLISH_STORM": return "storm";
      case "ADVERSITY_SHATTER": return "flame";
      case "GUARDIAN_BASTION": return "shield";
      default: return "normal";
    }
  }

  // =========================================================================
  // 30 秒 Timeline 2.0 學力推演主回放引擎
  // =========================================================================
  function startSimulation() {
    clearTimers();
    setIsPlaying(true);
    setFinished(false);
    setSeconds(0);
    setCurrentStage(1);
    setHpA(initialHpA);
    setHpB(initialHpB);
    setActionA("idle");
    setActionB("idle");
    setWeakenedA(false);
    setWeakenedB(false);
    setProjectile(null);
    setShieldActiveA(false);
    setShieldActiveB(false);
    setPierceActive(null);
    setReflectActive(null);
    setFloatDamageA(null);
    setFloatDamageB(null);
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

    // ----------------------------------------------------
    // [00s ~ 05s] 開局姿態檢驗 & 方案 A 英文開局先手壓制
    // ----------------------------------------------------
    setStageDesc({
      badge: "00s 開局姿態",
      step: "選手進場 • 晶片能量共鳴",
      detail: `【${fA.name}】與【${fB.name}】攜帶專屬核心晶片踏入推演競技場！`,
    });

    // 方案 A 核心：英文晶片開局第 2 秒搶先躍起射出風暴光矢
    const tPreStorm = setTimeout(() => {
      const stormByA = chipA === "ENGLISH_STORM";
      const stormByB = chipB === "ENGLISH_STORM";

      if (stormByA) {
        setActionA("attack");
        setProjectile({ dir: "a_to_b", element: "storm" });
        retroAudio.playSlash();
        const tDebuffB = setTimeout(() => {
          setProjectile(null);
          setActionA("idle");
          setWeakenedB(true);
          retroAudio.playHit();
          setStageDesc({
            badge: "02s 英文壓制",
            step: `【${fA.name}】發動【律動疾風矢】開局先手壓制！`,
            detail: `風暴光矢貫穿半場，【${fB.name}】頭頂被掛上 WEAKENED 標記（全場攻擊削弱 20%）！`,
          });
        }, 800);
        timersRef.current.push(tDebuffB);
      } else if (stormByB) {
        setActionB("attack");
        setProjectile({ dir: "b_to_a", element: "storm" });
        retroAudio.playSlash();
        const tDebuffA = setTimeout(() => {
          setProjectile(null);
          setActionB("idle");
          setWeakenedA(true);
          retroAudio.playHit();
          setStageDesc({
            badge: "02s 英文壓制",
            step: `【${fB.name}】發動【律動疾風矢】開局先手壓制！`,
            detail: `風暴光矢貫穿半場，【${fA.name}】頭頂被掛上 WEAKENED 標記（全場攻擊削弱 20%）！`,
          });
        }, 800);
        timersRef.current.push(tDebuffA);
      }
    }, 2000);
    timersRef.current.push(tPreStorm);

    // ----------------------------------------------------
    // [05s ~ 13s] Round 1：元素普攻交鋒 (輪流進攻)
    // ----------------------------------------------------
    const tR1_start = setTimeout(() => {
      setCurrentStage(1);
      setActionA("idle");
      setActionB("idle");

      // A 發動元素普攻
      setActionA("attack");
      setProjectile({ dir: "a_to_b", element: getChipElement(chipA) });
      retroAudio.playSlash();
      setShakeIntensity(2);

      setStageDesc({
        badge: "Round 1 元素普攻",
        step: `【${fA.name}】率先發動元素突進揮砍！`,
        detail: `武器附帶【${metaA.name}】元素光華直指對手！`,
      });

      const tR1_hitB = setTimeout(() => {
        setProjectile(null);
        setActionB("hurt");
        retroAudio.playHit();
        const textB = weakenedA ? `WEAKENED! -${dmg1_toB}` : `-${dmg1_toB}`;
        setFloatDamageB({ text: textB, isWeak: weakenedA });
        setHpB((h) => Math.max(10, h - dmg1_toB));

        setStageDesc({
          badge: "Round 1 元素普攻",
          step: `【${fA.name}】揮砍命中！造成 ${dmg1_toB} 點傷害`,
          detail: `【${fB.name}】穩住重心準備反擊！`,
        });

        const tR1_resetA = setTimeout(() => {
          setActionA("idle");
          setActionB("idle");
          setShakeIntensity(0);
          setFloatDamageB(null);
        }, 1200);
        timersRef.current.push(tR1_resetA);
      }, 700);
      timersRef.current.push(tR1_hitB);

      // B 反擊回敬 (於第 9 秒發動)
      const tR1_bAtk = setTimeout(() => {
        setActionB("attack");
        setProjectile({ dir: "b_to_a", element: getChipElement(chipB) });
        retroAudio.playSlash();
        setShakeIntensity(2);

        setStageDesc({
          badge: "Round 1 元素普攻",
          step: `【${fB.name}】迅速反擊回敬！`,
          detail: `刀光反刺，元素劍氣激射向【${fA.name}】！`,
        });

        const tR1_hitA = setTimeout(() => {
          setProjectile(null);
          setActionA("hurt");
          retroAudio.playHit();
          const textA = weakenedB ? `WEAKENED! -${dmg1_toA}` : `-${dmg1_toA}`;
          setFloatDamageA({ text: textA, isWeak: weakenedB });
          setHpA((h) => Math.max(10, h - dmg1_toA));

          setStageDesc({
            badge: "Round 1 元素普攻",
            step: `【${fB.name}】反擊成功！造成 ${dmg1_toA} 點傷害`,
            detail: "第一回合試探結束，雙方戰意升溫！",
          });

          const tR1_resetB = setTimeout(() => {
            setActionA("idle");
            setActionB("idle");
            setShakeIntensity(0);
            setFloatDamageA(null);
          }, 1200);
          timersRef.current.push(tR1_resetB);
        }, 700);
        timersRef.current.push(tR1_hitA);
      }, 4000);
      timersRef.current.push(tR1_bAtk);
    }, 5000);
    timersRef.current.push(tR1_start);

    // ----------------------------------------------------
    // [13s ~ 21s] Round 2：作業護盾克制檢驗
    // ----------------------------------------------------
    const tR2_start = setTimeout(() => {
      setCurrentStage(2);
      setStageDesc({
        badge: "Round 2 作業護盾克制",
        step: "戰況升溫！檢驗本週作業完成度與護盾克制！",
        detail: "作業按時繳交者升起金色防護盾，配合晶片觸發穿透或玄武反射！",
      });

      // A 攻擊 B (檢驗 B 護盾與 A 幾何穿透)
      setActionA("attack");
      setProjectile({ dir: "a_to_b", element: getChipElement(chipA) });
      retroAudio.playSlash();
      setShakeIntensity(3);

      const tR2_hitB = setTimeout(() => {
        setProjectile(null);
        setShieldActiveB(true);
        const isPierceA = chipA === "MATH_VOID";
        const isReflectB = chipB === "GUARDIAN_BASTION" && fB.hasHomeworkShield;

        if (isPierceA) setPierceActive("A");
        if (isReflectB) setReflectActive("B");

        setActionB(fB.hasHomeworkShield ? "defend" : "hurt");
        retroAudio.playHit();

        const floatTextB = isPierceA
          ? `PIERCE! -${dmg2_toB}`
          : isReflectB
          ? `REFLECT! 減傷 -${dmg2_toB}`
          : fB.hasHomeworkShield
          ? `GUARD! -${dmg2_toB}`
          : `-${dmg2_toB}`;

        setFloatDamageB({ text: floatTextB, isCrit: isPierceA });
        setHpB((h) => Math.max(10, h - dmg2_toB));

        setStageDesc({
          badge: "Round 2 作業護盾克制",
          step: isPierceA
            ? `【${fA.name}】幾何湮滅穿透！直接無視護盾！`
            : isReflectB
            ? `【${fB.name}】玄武壁壘啟動！減免 50% 並反彈傷害！`
            : fB.hasHomeworkShield
            ? `【${fB.name}】作業護盾生效！吸收 15% 傷害！`
            : `【${fB.name}】無作業護盾加成！承受全額打擊！`,
          detail: isPierceA
            ? "【幾何湮滅陣】特化屬性：無視對手任何防禦護盾打出全額重擊！"
            : isReflectB
            ? "【守護壁壘】特化屬性：作業全勤升級為玄武巨盾，化解攻勢並震傷對手！"
            : fB.hasHomeworkShield
            ? "按時完成作業的學生，在此回合獲得穩固防護。"
            : "作業缺漏使防禦力大幅下滑！",
        });

        const tR2_resetA = setTimeout(() => {
          setActionA("idle");
          setActionB("idle");
          setShieldActiveB(false);
          setPierceActive(null);
          setReflectActive(null);
          setShakeIntensity(0);
          setFloatDamageB(null);
        }, 1500);
        timersRef.current.push(tR2_resetA);
      }, 700);
      timersRef.current.push(tR2_hitB);

      // B 攻擊 A (於第 17 秒發動)
      const tR2_bAtk = setTimeout(() => {
        setActionB("attack");
        setProjectile({ dir: "b_to_a", element: getChipElement(chipB) });
        retroAudio.playSlash();
        setShakeIntensity(3);

        const tR2_hitA = setTimeout(() => {
          setProjectile(null);
          setShieldActiveA(true);
          const isPierceB = chipB === "MATH_VOID";
          const isReflectA = chipA === "GUARDIAN_BASTION" && fA.hasHomeworkShield;

          if (isPierceB) setPierceActive("B");
          if (isReflectA) setReflectActive("A");

          setActionA(fA.hasHomeworkShield ? "defend" : "hurt");
          retroAudio.playHit();

          const floatTextA = isPierceB
            ? `PIERCE! -${dmg2_toA}`
            : isReflectA
            ? `REFLECT! 減傷 -${dmg2_toA}`
            : fA.hasHomeworkShield
            ? `GUARD! -${dmg2_toA}`
            : `-${dmg2_toA}`;

          setFloatDamageA({ text: floatTextA, isCrit: isPierceB });
          setHpA((h) => Math.max(10, h - dmg2_toA));

          setStageDesc({
            badge: "Round 2 作業護盾克制",
            step: isPierceB
              ? `【${fB.name}】幾何湮滅穿透！無視護盾！`
              : isReflectA
              ? `【${fA.name}】玄武壁壘啟動！減免 50% 並反彈！`
              : fA.hasHomeworkShield
              ? `【${fA.name}】作業護盾生效！吸收 15% 傷害！`
              : `【${fA.name}】無作業護盾加成！`,
            detail: "雙方血量逼近警戒線，即將引爆 Round 3 核心晶片大招！",
          });

          const tR2_resetB = setTimeout(() => {
            setActionA("idle");
            setActionB("idle");
            setShieldActiveA(false);
            setPierceActive(null);
            setReflectActive(null);
            setShakeIntensity(0);
            setFloatDamageA(null);
          }, 1500);
          timersRef.current.push(tR2_resetB);
        }, 700);
        timersRef.current.push(tR2_hitA);
      }, 4000);
      timersRef.current.push(tR2_bAtk);
    }, 13000);
    timersRef.current.push(tR2_start);

    // ----------------------------------------------------
    // [21s ~ 27s] Round 3：終局晶片大招對轟 (Super Flash)
    // ----------------------------------------------------
    const tR3_start = setTimeout(() => {
      setCurrentStage(3);
      setSuperFlash(true);
      retroAudio.playCrit();
      setShakeIntensity(8);

      setStageDesc({
        badge: "Round 3 晶片奧義",
        step: "⚡ SUPER FLASH 能量過載！核心奧義引爆！",
        detail: "全螢幕暗光蓄力！雙方釋放本週裝備之終極核心晶片！",
      });

      const tR3_unflash = setTimeout(() => {
        setSuperFlash(false);

        // A 釋放大招橫幅與動畫
        setChipBanner({
          title: `【${metaA.name}】全場爆發！`,
          desc: metaA.effectDesc,
          color: metaA.bannerColor,
        });
        setActiveChipAnim(chipA);
        setActionA("attack");
        retroAudio.playSlash();

        const tR3_hitB = setTimeout(() => {
          setActionB("hurt");
          retroAudio.playHit();
          setFloatDamageB({ text: `CRITICAL! -${dmg3_toB}`, isCrit: true });
          setHpB((h) => Math.max(0, h - dmg3_toB));

          const tR3_bUlt = setTimeout(() => {
            // B 釋放大招
            setChipBanner({
              title: `【${metaB.name}】全力對轟！`,
              desc: metaB.effectDesc,
              color: metaB.bannerColor,
            });
            setActiveChipAnim(chipB);
            setActionB("attack");
            retroAudio.playSlash();

            const tR3_hitA = setTimeout(() => {
              setActionA("hurt");
              retroAudio.playHit();
              setFloatDamageA({ text: `CRITICAL! -${dmg3_toA}`, isCrit: true });
              setHpA((h) => Math.max(0, h - dmg3_toA));

              const tR3_end = setTimeout(() => {
                setChipBanner(null);
                setActiveChipAnim(null);
                setFloatDamageA(null);
                setFloatDamageB(null);
                setShakeIntensity(0);
              }, 1800);
              timersRef.current.push(tR3_end);
            }, 700);
            timersRef.current.push(tR3_hitA);
          }, 2000);
          timersRef.current.push(tR3_bUlt);
        }, 800);
        timersRef.current.push(tR3_hitB);
      }, 600);
      timersRef.current.push(tR3_unflash);
    }, 21000);
    timersRef.current.push(tR3_start);

    // ----------------------------------------------------
    // [27s ~ 30s] Round 4：推演結算與勝負因果分析
    // ----------------------------------------------------
    const tR4_end = setTimeout(() => {
      finishBattle();
    }, 27000);
    timersRef.current.push(tR4_end);
  }

  function finishBattle() {
    clearTimers();
    setSeconds(30);
    setCurrentStage(4);
    setIsPlaying(false);
    setFinished(true);
    setSuperFlash(false);
    setChipBanner(null);
    setActiveChipAnim(null);
    setProjectile(null);
    setShieldActiveA(false);
    setShieldActiveB(false);
    setFloatDamageA(null);
    setFloatDamageB(null);
    setShakeIntensity(0);
    retroAudio.stopBGM();

    // 計算最終勝負
    const finalA = fA.currentHp;
    const finalB = fB.currentHp;
    setHpA(finalA);
    setHpB(finalB);

    const winnerId = parsed?.winnerId || (finalA > finalB ? fA.id : finalB > finalA ? fB.id : null);

    if (winnerId === fA.id) {
      setActionA("win");
      setActionB("die");
      if (isMeA) retroAudio.playVictory();
      else retroAudio.playDefeat();
      setStageDesc({
        badge: "推演結算完成",
        step: `👑【${fA.name}】奪得本週推演勝利！`,
        detail: parsed?.resultAnalysis?.summary || "晶片大招爆發並善用作業防護盾，成功壓制對手拿下勝局！",
      });
    } else if (winnerId === fB.id) {
      setActionA("die");
      setActionB("win");
      if (!isMeA) retroAudio.playVictory();
      else retroAudio.playDefeat();
      setStageDesc({
        badge: "推演結算完成",
        step: `👑【${fB.name}】奪得本週推演勝利！`,
        detail: parsed?.resultAnalysis?.summary || "防守得當且大招爆發，成功拿下對決！",
      });
    } else {
      setActionA("win");
      setActionB("win");
      retroAudio.playDefeat();
      setStageDesc({
        badge: "推演結算完成",
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

  const winnerId = parsed?.winnerId || (fA.currentHp > fB.currentHp ? fA.id : fB.currentHp > fA.currentHp ? fB.id : null);
  const isWinnerMe = (winnerId === fA.id && isMeA) || (winnerId === fB.id && !isMeA);
  const isDraw = !winnerId || parsed?.isDraw;

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
              <div className="flex flex-col items-center gap-2 animate-bounce">
                <span className="text-amber-300 font-black text-lg tracking-widest">
                  🏹 漫天風暴光矢流星雨轟炸！
                </span>
                <div className="flex gap-4">
                  <div className="w-20 h-1 bg-amber-300 shadow-[0_0_20px_gold]" />
                  <div className="w-20 h-1 bg-amber-300 shadow-[0_0_20px_gold]" />
                  <div className="w-20 h-1 bg-amber-300 shadow-[0_0_20px_gold]" />
                </div>
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
            { stage: 1, label: "1. 元素普攻" },
            { stage: 2, label: "2. 護盾克制" },
            { stage: 3, label: "3. 晶片奧義" },
            { stage: 4, label: "4. 因果結算" },
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
        {/* 左側：選手 A */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 truncate">
              <span>{fA.name}</span>
              <span className="text-[10px] text-slate-300 font-mono">({fA.studentNumber})</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold shrink-0">{hpA} / {initialHpA} HP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.max(0, (hpA / initialHpA) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 pt-0.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-500/40 font-semibold truncate">
              {metaA.name}
            </span>
            {fA.hasHomeworkShield && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                🛡️ 作業護盾
              </span>
            )}
            {weakenedA && (
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold animate-pulse">
                🟣 WEAKENED -20%
              </span>
            )}
          </div>
        </div>

        {/* 右側：選手 B */}
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-rose-400 font-bold shrink-0">{hpB} / {initialHpB} HP</span>
            <span className="font-bold text-white flex items-center justify-end gap-1.5 truncate">
              <span className="text-[10px] text-slate-300 font-mono">({fB.studentNumber})</span>
              <span>{fB.name}</span>
              {fB.isShadowCoach && (
                <span className="text-[9px] bg-slate-700 text-amber-300 px-1 rounded">NPC</span>
              )}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-rose-500 to-amber-500 transition-all duration-300 ml-auto"
              style={{ width: `${Math.max(0, (hpB / initialHpB) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300 pt-0.5 flex-wrap">
            {weakenedB && (
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold animate-pulse">
                🟣 WEAKENED -20%
              </span>
            )}
            {fB.hasHomeworkShield && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                🛡️ 作業護盾
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-500/40 font-semibold truncate">
              {metaB.name}
            </span>
          </div>
        </div>
      </div>

      {/* 擂台主畫面 (具象粒子光環與攻防演出) */}
      <div className="h-64 sm:h-72 bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-900 relative flex items-center justify-between px-8 sm:px-20 overflow-hidden">
        {/* 背景網格與地磚微光 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415520_1px,transparent_1px),linear-gradient(to_bottom,#33415520_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />

        {/* 元素彈道特效 */}
        {projectile?.dir === "a_to_b" && (
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 z-30 animate-pulse flex items-center">
            {projectile.element === "storm" && (
              <div className="w-28 sm:w-48 h-2.5 bg-gradient-to-r from-transparent via-amber-300 to-white shadow-[0_0_25px_gold] rounded-full rotate-[-5deg]" />
            )}
            {projectile.element === "math" && (
              <div className="w-28 sm:w-48 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-white shadow-[0_0_20px_cyan] rounded-full rotate-[-10deg]" />
            )}
            {projectile.element === "ink" && (
              <div className="w-28 sm:w-48 h-3 bg-gradient-to-r from-transparent via-slate-800 to-amber-200 shadow-[0_0_20px_black] rounded-full rotate-[-5deg]" />
            )}
            {projectile.element === "flame" && (
              <div className="w-28 sm:w-48 h-3.5 bg-gradient-to-r from-transparent via-rose-500 to-amber-400 shadow-[0_0_25px_red] rounded-full rotate-[-5deg]" />
            )}
            {(projectile.element === "normal" || projectile.element === "shield") && (
              <div className="w-24 sm:w-40 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-white shadow-[0_0_20px_cyan] rounded-full rotate-[-10deg]" />
            )}
          </div>
        )}

        {projectile?.dir === "b_to_a" && (
          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 z-30 animate-pulse flex items-center">
            {projectile.element === "storm" && (
              <div className="w-28 sm:w-48 h-2.5 bg-gradient-to-l from-transparent via-amber-300 to-white shadow-[0_0_25px_gold] rounded-full rotate-[5deg]" />
            )}
            {projectile.element === "math" && (
              <div className="w-28 sm:w-48 h-2 bg-gradient-to-l from-transparent via-cyan-400 to-white shadow-[0_0_20px_cyan] rounded-full rotate-[10deg]" />
            )}
            {projectile.element === "ink" && (
              <div className="w-28 sm:w-48 h-3 bg-gradient-to-l from-transparent via-slate-800 to-amber-200 shadow-[0_0_20px_black] rounded-full rotate-[5deg]" />
            )}
            {projectile.element === "flame" && (
              <div className="w-28 sm:w-48 h-3.5 bg-gradient-to-l from-transparent via-rose-500 to-amber-400 shadow-[0_0_25px_red] rounded-full rotate-[5deg]" />
            )}
            {(projectile.element === "normal" || projectile.element === "shield") && (
              <div className="w-24 sm:w-40 h-2 bg-gradient-to-l from-transparent via-rose-400 to-white shadow-[0_0_20px_rose] rounded-full rotate-[10deg]" />
            )}
          </div>
        )}

        {/* 選手 A 區域 (附帶持續性晶片粒子姿態光環) */}
        <div className="relative flex flex-col items-center">
          {/* 足底持續性晶片粒子光環 */}
          <div className="absolute -bottom-2 w-20 h-6 rounded-full blur-xs opacity-75 pointer-events-none">
            {chipA === "MATH_VOID" && <div className="w-full h-full bg-cyan-400 animate-pulse shadow-[0_0_20px_cyan]" />}
            {chipA === "CHINESE_INK" && <div className="w-full h-full bg-slate-600 animate-pulse shadow-[0_0_20px_black]" />}
            {chipA === "ENGLISH_STORM" && <div className="w-full h-full bg-amber-400 animate-pulse shadow-[0_0_20px_gold]" />}
            {chipA === "ADVERSITY_SHATTER" && <div className="w-full h-full bg-rose-500 animate-pulse shadow-[0_0_20px_red]" />}
            {chipA === "GUARDIAN_BASTION" && <div className="w-full h-full bg-emerald-400 animate-pulse shadow-[0_0_20px_green]" />}
            {chipA === "SELF_TRANSCENDENCE" && <div className="w-full h-full bg-yellow-300 animate-pulse shadow-[0_0_20px_yellow]" />}
          </div>

          {/* 護盾效果層 */}
          {shieldActiveA && (
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.7)] animate-pulse z-20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-400 -top-6 absolute">
                🛡️ 作業護盾格擋！
              </span>
            </div>
          )}

          {/* 傷害跳字 */}
          {floatDamageA && (
            <div className={`absolute -top-12 font-mono font-black z-30 ${floatDamageA.isCrit ? "text-2xl text-amber-300 animate-bounce drop-shadow-[0_0_10px_gold]" : floatDamageA.isWeak ? "text-sm text-purple-300" : "text-lg text-rose-400"}`}>
              {floatDamageA.text}
            </div>
          )}

          <PixelFighterSprite
            gender={fA.gender}
            action={actionA}
            isOpponent={false}
            size={110}
          />

          <span className="mt-1 text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
            {fA.name}
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

        {/* 選手 B 區域 (附帶持續性晶片粒子姿態光環) */}
        <div className="relative flex flex-col items-center">
          {/* 足底持續性晶片粒子光環 */}
          <div className="absolute -bottom-2 w-20 h-6 rounded-full blur-xs opacity-75 pointer-events-none">
            {chipB === "MATH_VOID" && <div className="w-full h-full bg-cyan-400 animate-pulse shadow-[0_0_20px_cyan]" />}
            {chipB === "CHINESE_INK" && <div className="w-full h-full bg-slate-600 animate-pulse shadow-[0_0_20px_black]" />}
            {chipB === "ENGLISH_STORM" && <div className="w-full h-full bg-amber-400 animate-pulse shadow-[0_0_20px_gold]" />}
            {chipB === "ADVERSITY_SHATTER" && <div className="w-full h-full bg-rose-500 animate-pulse shadow-[0_0_20px_red]" />}
            {chipB === "GUARDIAN_BASTION" && <div className="w-full h-full bg-emerald-400 animate-pulse shadow-[0_0_20px_green]" />}
            {chipB === "SELF_TRANSCENDENCE" && <div className="w-full h-full bg-yellow-300 animate-pulse shadow-[0_0_20px_yellow]" />}
          </div>

          {/* 護盾效果層 */}
          {shieldActiveB && (
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.7)] animate-pulse z-20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-400 -top-6 absolute">
                🛡️ 作業護盾格擋！
              </span>
            </div>
          )}

          {/* 傷害跳字 */}
          {floatDamageB && (
            <div className={`absolute -top-12 font-mono font-black z-30 ${floatDamageB.isCrit ? "text-2xl text-amber-300 animate-bounce drop-shadow-[0_0_10px_gold]" : floatDamageB.isWeak ? "text-sm text-purple-300" : "text-lg text-rose-400"}`}>
              {floatDamageB.text}
            </div>
          )}

          <PixelFighterSprite
            gender={fB.gender}
            action={actionB}
            isOpponent={true}
            size={110}
          />

          <span className="mt-1 text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
            {fB.name}
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
              <span>推演勝負因果分析報告：{parsed?.resultAnalysis?.keyFactor || "客觀學力分析"}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {parsed?.resultAnalysis?.summary || parsed?.causalityAnalysis?.reasonForP1 || "努力完成作業啟用減傷護盾，並在自主修練中解鎖翻盤晶片。"}
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
