"use client";

import React from "react";

export type SkinGender = "boy" | "girl" | "BOY" | "GIRL";
export type FighterAction = "idle" | "attack" | "defend" | "hurt" | "die" | "win" | "cast";

interface PixelFighterSpriteProps {
  gender?: SkinGender;
  action?: FighterAction;
  isOpponent?: boolean;
  size?: number; // width in px
  className?: string;
  chipEffect?: string; // 晶片特效樣式
}

export default function PixelFighterSprite({
  gender = "BOY",
  action = "idle",
  isOpponent = false,
  size = 140,
  className = "",
  chipEffect,
}: PixelFighterSpriteProps) {
  const isGirl = String(gender).toUpperCase() === "GIRL";

  // 動畫樣式類別
  let animClass = "";
  if (action === "idle") {
    animClass = "animate-pulse";
  } else if (action === "attack") {
    animClass = isOpponent
      ? "-translate-x-6 scale-110 duration-200"
      : "translate-x-6 scale-110 duration-200";
  } else if (action === "defend") {
    animClass = "scale-95 brightness-110";
  } else if (action === "cast") {
    animClass = "-translate-y-3 scale-110 drop-shadow-[0_0_16px_rgba(251,191,36,0.9)] animate-bounce duration-300";
  } else if (action === "hurt") {
    animClass = isOpponent
      ? "translate-x-4 brightness-150 saturate-200"
      : "-translate-x-4 brightness-150 saturate-200";
  } else if (action === "die") {
    animClass = "opacity-30 grayscale translate-y-6 rotate-45";
  } else if (action === "win") {
    animClass = "animate-bounce scale-110";
  }

  // 翻轉：對手朝左
  const flipTransform = isOpponent ? "scaleX(-1)" : "none";

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all duration-300 ${animClass} ${className}`}
      style={{
        width: size,
        height: size,
        transform: flipTransform,
      }}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
        shapeRendering="crispEdges"
      >
        <defs>
          <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" />
          </filter>
          <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" />
          </filter>
        </defs>

        {/* 1. 晶片施法氣環特效 (action === 'cast') */}
        {action === "cast" && (
          <g filter="url(#glow-gold)">
            {/* 地面法陣矩陣 */}
            <ellipse cx="32" cy="58" rx="20" ry="6" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="32" cy="58" r="3" fill="#fbbf24" />
            {/* 浮空粒子光柱 */}
            <line x1="20" y1="58" x2="20" y2="20" stroke="#fef08a" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="44" y1="58" x2="44" y2="20" stroke="#fef08a" strokeWidth="1" strokeDasharray="3 2" />
            {/* 頂部能量球 */}
            <circle cx="32" cy="6" r="4" fill="#fbbf24" />
            <circle cx="32" cy="6" r="2" fill="#ffffff" />
          </g>
        )}

        {/* 2. 防禦光盾特效 (action === 'defend') */}
        {action === "defend" && (
          <g filter="url(#glow-blue)">
            <polygon
              points="44,14 54,20 54,42 44,50 36,42 36,20"
              fill="#38bdf8"
              opacity="0.6"
            />
            <polygon
              points="46,18 52,22 52,38 46,44 40,38 40,22"
              fill="white"
              opacity="0.8"
            />
          </g>
        )}

        {/* 3. 陰影基座 */}
        <ellipse cx="32" cy="58" rx="14" ry="4" fill="#000000" opacity="0.4" />

        {/* 4. 雙腳與靴子 */}
        <rect x="24" y="48" width="6" height="8" fill="#1f2937" />
        <rect x="34" y="48" width="6" height="8" fill="#1f2937" />
        <rect x="23" y="53" width="7" height="4" fill="#1e3a8a" />
        <rect x="34" y="53" width="7" height="4" fill="#1e3a8a" />

        {/* 5. 身體與披風/戰袍 */}
        {/* 披風底層 */}
        <rect x="20" y="30" width="24" height="20" fill={isGirl ? "#9d174d" : "#1e3a8a"} />

        {/* 衣服/胸甲 */}
        <rect x="24" y="28" width="16" height="18" fill={isGirl ? "#db2777" : "#2563eb"} />
        <rect x="26" y="30" width="12" height="12" fill={isGirl ? "#f472b6" : "#60a5fa"} />
        {/* 皮帶 */}
        <rect x="24" y="44" width="16" height="3" fill="#374151" />
        <rect x="30" y="44" width="4" height="3" fill="#f59e0b" />

        {/* 6. 頭部與臉部 */}
        {/* 脖子 */}
        <rect x="30" y="25" width="4" height="4" fill="#fed7aa" />
        {/* 臉蛋 */}
        <rect x="24" y="16" width="16" height="12" fill="#fed7aa" />
        {/* 眼睛 */}
        <rect x="33" y="20" width="3" height="4" fill="#0f172a" />
        <rect x="34" y="20" width="1" height="2" fill="#ffffff" />
        {action === "hurt" && (
          <rect x="32" y="18" width="6" height="6" fill="#ef4444" opacity="0.8" />
        )}

        {/* 7. 髮型 (純男女冒險者規格) */}
        {!isGirl ? (
          /* 男冒險者棕色短髮 + 額前飾帶 */
          <g>
            <rect x="22" y="12" width="20" height="7" fill="#78350f" />
            <rect x="20" y="15" width="4" height="8" fill="#78350f" />
            <rect x="38" y="15" width="4" height="6" fill="#78350f" />
            <polygon points="26,12 28,8 32,12" fill="#78350f" />
            <polygon points="32,12 35,9 38,12" fill="#78350f" />
            {/* 藍色冒險者額帶 */}
            <rect x="24" y="16" width="16" height="2" fill="#2563eb" />
          </g>
        ) : (
          /* 女冒險者粉紫馬尾髮型 + 髮飾 */
          <g>
            <rect x="22" y="12" width="20" height="7" fill="#831843" />
            <rect x="20" y="15" width="5" height="14" fill="#831843" />
            <rect x="39" y="15" width="5" height="12" fill="#831843" />
            {/* 馬尾 */}
            <rect x="16" y="16" width="6" height="18" fill="#9d174d" />
            {/* 金色髮夾 */}
            <rect x="18" y="14" width="4" height="4" fill="#fbbf24" />
          </g>
        )}

        {/* 8. 手持冒險佩劍/法仗 */}
        <g>
          {/* 肩甲 */}
          <rect x="21" y="28" width="5" height="6" fill="#9ca3af" />
          <rect x="38" y="28" width="5" height="6" fill="#9ca3af" />

          {/* 佩劍 */}
          {action === "attack" ? (
            <g transform="rotate(35 44 32)">
              <rect x="44" y="10" width="4" height="28" fill="#e5e7eb" />
              <rect x="45" y="10" width="2" height="26" fill="#93c5fd" />
              <rect x="42" y="38" width="8" height="3" fill="#d97706" />
              <rect x="45" y="41" width="2" height="6" fill="#4b5563" />
              {/* 斬擊光波 */}
              <path
                d="M 40,6 A 25 25 0 0 1 58,40"
                stroke="#60a5fa"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          ) : action === "cast" ? (
            <g transform="rotate(-15 44 24)">
              {/* 高舉武器施法 */}
              <rect x="44" y="6" width="4" height="32" fill="#e5e7eb" />
              <rect x="45" y="6" width="2" height="30" fill="#fde68a" />
              <circle cx="46" cy="4" r="4" fill="#fbbf24" filter="url(#glow-gold)" />
              <rect x="42" y="38" width="8" height="3" fill="#d97706" />
            </g>
          ) : (
            <g>
              <rect x="42" y="16" width="4" height="24" fill="#e5e7eb" />
              <rect x="43" y="18" width="2" height="20" fill="#93c5fd" />
              <rect x="40" y="40" width="8" height="3" fill="#d97706" />
              <rect x="43" y="43" width="2" height="6" fill="#4b5563" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
