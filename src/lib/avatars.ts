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
  pixelClass: string;
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
    pixelClass: "pixel-hero-knight",
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
    pixelClass: "pixel-hero-mage",
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
    pixelClass: "pixel-hero-ninja",
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
    pixelClass: "pixel-hero-archer",
  },
  {
    id: "pixel-paladin",
    name: "光之守護",
    role: "聖騎士",
    emoji: "🛡️",
    badge: "PALADIN",
    color: "text-yellow-300",
    bgColor: "bg-yellow-950/60",
    border: "border-yellow-400",
    bgGradient: "from-yellow-600/30 to-amber-700/20",
    pixelClass: "pixel-hero-paladin",
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
    pixelClass: "pixel-hero-valkyrie",
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
    pixelClass: "pixel-hero-brawler",
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
    pixelClass: "pixel-hero-rogue",
  },
  {
    id: "pixel-bot",
    name: "分段守門機器人",
    role: "守門員",
    emoji: "🤖",
    badge: "BOT",
    color: "text-zinc-400",
    bgColor: "bg-zinc-900/80",
    border: "border-zinc-500",
    bgGradient: "from-zinc-700/40 to-slate-800/20",
    pixelClass: "pixel-hero-bot",
  },
];

export function getAvatarMeta(avatarId?: string | null): AvatarMeta {
  if (!avatarId) return AVATAR_PRESETS[0];
  const found = AVATAR_PRESETS.find((a) => a.id === avatarId);
  if (found) return found;

  // Fallback map for older or alternative names
  if (avatarId.includes("bot")) return AVATAR_PRESETS[8];
  if (avatarId.includes("mage") || avatarId.includes("violet")) return AVATAR_PRESETS[1];
  if (avatarId.includes("ninja") || avatarId.includes("blade")) return AVATAR_PRESETS[2];
  if (avatarId.includes("archer") || avatarId.includes("hawk")) return AVATAR_PRESETS[3];
  if (avatarId.includes("paladin") || avatarId.includes("aegis")) return AVATAR_PRESETS[4];
  if (avatarId.includes("valkyrie") || avatarId.includes("crown")) return AVATAR_PRESETS[5];
  if (avatarId.includes("brawler") || avatarId.includes("wolf")) return AVATAR_PRESETS[6];
  if (avatarId.includes("rogue") || avatarId.includes("fox")) return AVATAR_PRESETS[7];

  return AVATAR_PRESETS[0];
}
