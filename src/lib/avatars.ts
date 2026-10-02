export interface AvatarMeta {
  id: string;
  name: string;
  role: string;
  emoji: string;
  badge: string;
  color: string;
  bgColor: string;
  border: string;
  bgGradient: string;
  skillName: string;
  skillDesc: string;
  skillIcon: string;
  skillGradient: string;
  soundType: "slash" | "magic" | "hit" | "crit";
  vfxType: "holy" | "arcane" | "shadow" | "wind" | "fire" | "thunder";
}

export const AVATAR_PRESETS: AvatarMeta[] = [
  {
    id: "pixel-knight",
    name: "聖堂重騎",
    role: "戰士",
    emoji: "⚔️",
    badge: "KNIGHT",
    color: "text-amber-400",
    bgColor: "bg-amber-950/60",
    border: "border-amber-500",
    bgGradient: "from-amber-600/30 to-orange-700/20",
    skillName: "神聖衝鋒",
    skillDesc: "召喚聖騎光盾，以千鈞之勢衝撞敵陣！",
    skillIcon: "🛡️⚡",
    skillGradient: "from-amber-500 via-orange-500 to-yellow-600",
    soundType: "crit",
    vfxType: "holy",
  },
  {
    id: "pixel-mage",
    name: "元素魔導",
    role: "法師",
    emoji: "🔮",
    badge: "MAGE",
    color: "text-purple-400",
    bgColor: "bg-purple-950/60",
    border: "border-purple-500",
    bgGradient: "from-purple-600/30 to-indigo-700/20",
    skillName: "奧術流星",
    skillDesc: "吟唱星穹法陣，召喚三枚高溫奧術爆彈！",
    skillIcon: "✨☄️",
    skillGradient: "from-purple-500 via-violet-600 to-indigo-600",
    soundType: "magic",
    vfxType: "arcane",
  },
  {
    id: "pixel-ninja",
    name: "暗影疾刃",
    role: "刺客",
    emoji: "🥷",
    badge: "NINJA",
    color: "text-emerald-400",
    bgColor: "bg-emerald-950/60",
    border: "border-emerald-500",
    bgGradient: "from-emerald-600/30 to-teal-700/20",
    skillName: "暗影分身斬",
    skillDesc: "瞬間分身兩側，發動無法閃避的十字疾刃！",
    skillIcon: "🗡️💨",
    skillGradient: "from-emerald-500 via-teal-600 to-slate-800",
    soundType: "slash",
    vfxType: "shadow",
  },
  {
    id: "pixel-archer",
    name: "風行神射",
    role: "射手",
    emoji: "🏹",
    badge: "ARCHER",
    color: "text-sky-400",
    bgColor: "bg-sky-950/60",
    border: "border-sky-500",
    bgGradient: "from-sky-600/30 to-cyan-700/20",
    skillName: "極限風暴箭",
    skillDesc: "滿弓蓄力，射出穿透護盾的光束風暴！",
    skillIcon: "🌪️🎯",
    skillGradient: "from-sky-500 via-cyan-500 to-blue-600",
    soundType: "slash",
    vfxType: "wind",
  },
  {
    id: "pixel-paladin",
    name: "光之守護",
    role: "聖騎",
    emoji: "🛡️",
    badge: "PALADIN",
    color: "text-yellow-300",
    bgColor: "bg-yellow-950/60",
    border: "border-yellow-400",
    bgGradient: "from-yellow-600/30 to-amber-700/20",
    skillName: "光之制裁錘",
    skillDesc: "高舉聖金戰錘，降下淨化全場的正義之雷！",
    skillIcon: "🔨✨",
    skillGradient: "from-yellow-400 via-amber-500 to-orange-600",
    soundType: "crit",
    vfxType: "holy",
  },
  {
    id: "pixel-valkyrie",
    name: "女武神姬",
    role: "戰士",
    emoji: "✨",
    badge: "VALKYRIE",
    color: "text-rose-400",
    bgColor: "bg-rose-950/60",
    border: "border-rose-500",
    bgGradient: "from-rose-600/30 to-pink-700/20",
    skillName: "勝利飛矛",
    skillDesc: "展開極光之翼，以神速投擲必中飛矛！",
    skillIcon: "🔱🪽",
    skillGradient: "from-rose-500 via-pink-600 to-purple-700",
    soundType: "crit",
    vfxType: "thunder",
  },
  {
    id: "pixel-brawler",
    name: "狂暴武僧",
    role: "鬥士",
    emoji: "🥊",
    badge: "BRAWLER",
    color: "text-red-400",
    bgColor: "bg-red-950/60",
    border: "border-red-500",
    bgGradient: "from-red-600/30 to-orange-700/20",
    skillName: "寸勁百烈拳",
    skillDesc: "瞬步貼身，一秒揮出十道連環氣勁重拳！",
    skillIcon: "💥🔥",
    skillGradient: "from-red-500 via-orange-600 to-amber-600",
    soundType: "hit",
    vfxType: "fire",
  },
  {
    id: "pixel-rogue",
    name: "幻影遊俠",
    role: "刺客",
    emoji: "🗡️",
    badge: "ROGUE",
    color: "text-teal-400",
    bgColor: "bg-teal-950/60",
    border: "border-teal-500",
    bgGradient: "from-teal-600/30 to-emerald-700/20",
    skillName: "煙霧奇襲斬",
    skillDesc: "投擲煙霧彈隱匿氣息，從盲區發動暴擊！",
    skillIcon: "💨🗡️",
    skillGradient: "from-teal-500 via-cyan-600 to-slate-900",
    soundType: "slash",
    vfxType: "shadow",
  },
  {
    id: "pixel-bot",
    name: "守門武士",
    role: "機器人",
    emoji: "🤖",
    badge: "BOT",
    color: "text-zinc-400",
    bgColor: "bg-zinc-900/80",
    border: "border-zinc-500",
    bgGradient: "from-zinc-700/40 to-slate-800/20",
    skillName: "超載火箭拳",
    skillDesc: "核心爐超載過熱，射出鋼鐵推進火箭鐵拳！",
    skillIcon: "🚀⚙️",
    skillGradient: "from-slate-500 via-zinc-600 to-amber-600",
    soundType: "crit",
    vfxType: "thunder",
  },
];

export function getAvatarMeta(avatarId?: string | null): AvatarMeta {
  if (!avatarId) return AVATAR_PRESETS[0];
  const found = AVATAR_PRESETS.find((a) => a.id === avatarId);
  if (found) return found;

  if (avatarId.includes("bot")) return AVATAR_PRESETS[8];
  if (avatarId.includes("mage")) return AVATAR_PRESETS[1];
  if (avatarId.includes("ninja")) return AVATAR_PRESETS[2];
  if (avatarId.includes("archer")) return AVATAR_PRESETS[3];
  if (avatarId.includes("paladin")) return AVATAR_PRESETS[4];
  if (avatarId.includes("valkyrie")) return AVATAR_PRESETS[5];
  if (avatarId.includes("brawler")) return AVATAR_PRESETS[6];
  if (avatarId.includes("rogue")) return AVATAR_PRESETS[7];

  return AVATAR_PRESETS[0];
}
