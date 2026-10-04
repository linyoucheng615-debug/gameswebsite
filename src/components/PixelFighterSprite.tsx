"use client";

import React from "react";

export type SkinGender = "boy" | "girl";
export type SkinClass = "warrior" | "mage" | "ranger" | "assassin";
export type SkinColor = "blue" | "red" | "green" | "purple" | "gold";
export type FighterAction = "idle" | "attack" | "defend" | "hurt" | "die" | "win";

interface PixelFighterSpriteProps {
  gender?: SkinGender;
  charClass?: SkinClass;
  color?: SkinColor;
  action?: FighterAction;
  isOpponent?: boolean;
  size?: number; // width in px
  className?: string;
}

const COLOR_PALETTES: Record<
  SkinColor,
  { primary: string; light: string; dark: string; glow: string; weapon: string }
> = {
  blue: {
    primary: "#2563eb",
    light: "#60a5fa",
    dark: "#1e3a8a",
    glow: "#38bdf8",
    weapon: "#93c5fd",
  },
  red: {
    primary: "#dc2626",
    light: "#f87171",
    dark: "#991b1b",
    glow: "#f87171",
    weapon: "#fca5a5",
  },
  green: {
    primary: "#059669",
    light: "#34d399",
    dark: "#065f46",
    glow: "#6ee7b7",
    weapon: "#a7f3d0",
  },
  purple: {
    primary: "#7c3aed",
    light: "#c084fc",
    dark: "#5b21b6",
    glow: "#e9d5ff",
    weapon: "#ddd6fe",
  },
  gold: {
    primary: "#d97706",
    light: "#fbbf24",
    dark: "#92400e",
    glow: "#fef08a",
    weapon: "#fde68a",
  },
};

export default function PixelFighterSprite({
  gender = "boy",
  charClass = "warrior",
  color = "blue",
  action = "idle",
  isOpponent = false,
  size = 140,
  className = "",
}: PixelFighterSpriteProps) {
  const palette = COLOR_PALETTES[color] || COLOR_PALETTES.blue;

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
          {/* 聚氣 / 防護光環濾鏡 */}
          <filter id={`glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={palette.glow} />
          </filter>
        </defs>

        {/* 1. 防禦光盾特效 (當 action === 'defend') */}
        {action === "defend" && (
          <g filter={`url(#glow-${color})`}>
            <polygon
              points="44,14 54,20 54,42 44,50 36,42 36,20"
              fill={palette.glow}
              opacity="0.6"
            />
            <polygon
              points="46,18 52,22 52,38 46,44 40,38 40,22"
              fill="white"
              opacity="0.8"
            />
          </g>
        )}

        {/* 2. 陰影基座 */}
        <ellipse cx="32" cy="58" rx="14" ry="4" fill="#000000" opacity="0.4" />

        {/* 3. 雙腳與靴子 */}
        <rect x="24" y="48" width="6" height="8" fill="#1f2937" />
        <rect x="34" y="48" width="6" height="8" fill="#1f2937" />
        <rect x="23" y="53" width="7" height="4" fill={palette.dark} />
        <rect x="34" y="53" width="7" height="4" fill={palette.dark} />

        {/* 4. 身體與披風/戰袍 */}
        {/* 披風底層 */}
        <rect x="20" y="30" width="24" height="20" fill={palette.dark} />

        {/* 衣服/胸甲 */}
        <rect x="24" y="28" width="16" height="18" fill={palette.primary} />
        <rect x="26" y="30" width="12" height="12" fill={palette.light} />
        {/* 皮帶 */}
        <rect x="24" y="44" width="16" height="3" fill="#374151" />
        <rect x="30" y="44" width="4" height="3" fill="#f59e0b" />

        {/* 5. 頭部與臉部 */}
        {/* 脖子 */}
        <rect x="30" y="25" width="4" height="4" fill="#fbcfe8" />
        {/* 臉蛋 */}
        <rect x="24" y="16" width="16" height="12" fill="#fed7aa" />
        {/* 眼睛 */}
        <rect x="33" y="20" width="3" height="4" fill="#0f172a" />
        <rect x="34" y="20" width="1" height="2" fill="#ffffff" />
        {action === "hurt" && (
          <rect x="32" y="18" width="6" height="6" fill="#ef4444" opacity="0.8" />
        )}

        {/* 6. 髮型 (依據性別與體型) */}
        {gender === "boy" ? (
          /* 男冒險者短髮 */
          <g>
            <rect x="22" y="12" width="20" height="7" fill="#78350f" />
            <rect x="20" y="15" width="4" height="8" fill="#78350f" />
            <rect x="38" y="15" width="4" height="6" fill="#78350f" />
            <polygon points="26,12 28,8 32,12" fill="#78350f" />
            <polygon points="32,12 35,9 38,12" fill="#78350f" />
          </g>
        ) : (
          /* 女冒險者長髮/馬尾 */
          <g>
            <rect x="22" y="12" width="20" height="7" fill="#831843" />
            <rect x="20" y="15" width="5" height="14" fill="#831843" />
            <rect x="39" y="15" width="5" height="12" fill="#831843" />
            {/* 馬尾 */}
            <rect x="16" y="16" width="6" height="18" fill="#9d174d" />
            <rect x="18" y="14" width="4" height="4" fill={palette.glow} />
          </g>
        )}

        {/* 7. 職業專屬武器與裝備姿態 */}
        {charClass === "warrior" && (
          /* 劍士：精鋼雙手大劍 */
          <g>
            {/* 左肩甲 */}
            <rect x="21" y="28" width="5" height="6" fill="#9ca3af" />
            {/* 右肩甲 */}
            <rect x="38" y="28" width="5" height="6" fill="#9ca3af" />

            {/* 武器大劍 (若攻擊往前揮動) */}
            {action === "attack" ? (
              <g transform="rotate(35 44 32)">
                <rect x="44" y="10" width="5" height="28" fill="#e5e7eb" />
                <rect x="45" y="10" width="3" height="26" fill={palette.weapon} />
                <rect x="42" y="38" width="9" height="3" fill="#d97706" />
                <rect x="45" y="41" width="3" height="7" fill="#4b5563" />
                {/* 斬擊光波氣刃 */}
                <path
                  d="M 40,6 A 25 25 0 0 1 58,40"
                  stroke={palette.glow}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </g>
            ) : (
              <g>
                {/* 斜背/斜持大劍 */}
                <rect x="42" y="16" width="4" height="24" fill="#e5e7eb" />
                <rect x="43" y="18" width="2" height="20" fill={palette.weapon} />
                <rect x="40" y="40" width="8" height="3" fill="#d97706" />
                <rect x="43" y="43" width="2" height="6" fill="#4b5563" />
              </g>
            )}
          </g>
        )}

        {charClass === "mage" && (
          /* 法師：魔法斗篷與寶石法杖 */
          <g>
            {/* 法師兜帽邊飾 */}
            <rect x="24" y="12" width="16" height="3" fill={palette.dark} />
            {/* 手持法杖 */}
            <rect x="44" y="16" width="3" height="34" fill="#78350f" />
            {/* 法杖頂端寶石 */}
            <circle cx="45.5" cy="14" r="5" fill={palette.glow} filter={`url(#glow-${color})`} />
            <circle cx="45.5" cy="14" r="2.5" fill="#ffffff" />

            {/* 攻擊時發射奧術魔法球 */}
            {action === "attack" && (
              <g filter={`url(#glow-${color})`}>
                <circle cx="56" cy="18" r="6" fill={palette.glow} />
                <circle cx="56" cy="18" r="3" fill="#ffffff" />
                {/* 尾跡粒子 */}
                <circle cx="50" cy="22" r="2" fill={palette.glow} opacity="0.8" />
                <circle cx="48" cy="25" r="1.5" fill={palette.glow} opacity="0.6" />
              </g>
            )}
          </g>
        )}

        {charClass === "ranger" && (
          /* 遊俠：羽毛長弓與箭袋 */
          <g>
            {/* 披風兜帽羽毛 */}
            <polygon points="23,12 21,5 25,10" fill="#10b981" />
            {/* 背後箭袋 */}
            <rect x="20" y="24" width="4" height="14" fill="#78350f" />
            <line x1="21" y1="23" x2="21" y2="18" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="23" y1="23" x2="23" y2="19" stroke="#f59e0b" strokeWidth="1.5" />

            {/* 手持長弓 */}
            {action === "attack" ? (
              <g>
                {/* 拉滿弓 */}
                <path d="M 44,14 Q 50,30 44,46" stroke="#92400e" strokeWidth="3" fill="none" />
                <line x1="44" y1="14" x2="38" y2="30" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="44" y1="46" x2="38" y2="30" stroke="#f3f4f6" strokeWidth="1" />
                {/* 射出光箭 */}
                <line
                  x1="38"
                  y1="30"
                  x2="58"
                  y2="30"
                  stroke={palette.glow}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polygon points="60,30 55,27 55,33" fill={palette.glow} />
              </g>
            ) : (
              <g>
                {/* 靜態持弓 */}
                <path d="M 44,18 Q 48,32 44,46" stroke="#92400e" strokeWidth="2.5" fill="none" />
                <line x1="44" y1="18" x2="44" y2="46" stroke="#f3f4f6" strokeWidth="1" />
              </g>
            )}
          </g>
        )}

        {charClass === "assassin" && (
          /* 刺客：蒙面面巾與雙持逆手匕首 */
          <g>
            {/* 黑色面罩 */}
            <rect x="24" y="22" width="16" height="6" fill="#1e293b" />
            {/* 頭部護額金屬片 */}
            <rect x="25" y="15" width="14" height="2.5" fill="#94a3b8" />

            {/* 雙持反手匕首 */}
            {action === "attack" ? (
              <g>
                {/* 左手匕首前刺 */}
                <line x1="38" y1="36" x2="52" y2="28" stroke="#f1f5f9" strokeWidth="3" />
                <line x1="38" y1="36" x2="52" y2="28" stroke={palette.glow} strokeWidth="1.5" />
                {/* 右手匕首上挑 */}
                <line x1="36" y1="40" x2="54" y2="44" stroke="#f1f5f9" strokeWidth="3" />
                {/* 刺客瞬步殘影 */}
                <path
                  d="M 20,40 L 52,24"
                  stroke={palette.glow}
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  opacity="0.8"
                />
              </g>
            ) : (
              <g>
                {/* 雙匕手架式 */}
                <line x1="38" y1="36" x2="46" y2="44" stroke="#e2e8f0" strokeWidth="2.5" />
                <line x1="22" y1="36" x2="16" y2="44" stroke="#e2e8f0" strokeWidth="2.5" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

