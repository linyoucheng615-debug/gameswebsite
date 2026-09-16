export interface AvatarMeta {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  color: string;
  border: string;
  bgGradient: string;
}

export const AVATAR_PRESETS: AvatarMeta[] = [
  {
    id: "cyber-fox",
    name: "靈狐戰神",
    emoji: "🦊",
    badge: "FOX",
    color: "text-amber-400",
    border: "border-amber-500/50",
    bgGradient: "from-amber-500/25 to-orange-600/10",
  },
  {
    id: "cyber-dragon",
    name: "神龍裁決",
    emoji: "🐉",
    badge: "DRAGON",
    color: "text-emerald-400",
    border: "border-emerald-500/50",
    bgGradient: "from-emerald-500/25 to-teal-600/10",
  },
  {
    id: "cyber-wolf",
    name: "孤狼行者",
    emoji: "🐺",
    badge: "WOLF",
    color: "text-cyan-400",
    border: "border-cyan-500/50",
    bgGradient: "from-cyan-500/25 to-blue-600/10",
  },
  {
    id: "cyber-samurai",
    name: "影武電刃",
    emoji: "⚡",
    badge: "BLADE",
    color: "text-yellow-400",
    border: "border-yellow-500/50",
    bgGradient: "from-yellow-500/25 to-amber-600/10",
  },
  {
    id: "cyber-hawk",
    name: "天際獵鷹",
    emoji: "🦅",
    badge: "HAWK",
    color: "text-sky-400",
    border: "border-sky-500/50",
    bgGradient: "from-sky-500/25 to-indigo-600/10",
  },
  {
    id: "cyber-aegis",
    name: "鋼鐵聖盾",
    emoji: "🛡️",
    badge: "AEGIS",
    color: "text-purple-400",
    border: "border-purple-500/50",
    bgGradient: "from-purple-500/25 to-fuchsia-600/10",
  },
  {
    id: "cyber-crown",
    name: "王座霸主",
    emoji: "👑",
    badge: "CROWN",
    color: "text-rose-400",
    border: "border-rose-500/50",
    bgGradient: "from-rose-500/25 to-red-600/10",
  },
  {
    id: "cyber-mage",
    name: "星宿智者",
    emoji: "🔮",
    badge: "MAGE",
    color: "text-violet-400",
    border: "border-violet-500/50",
    bgGradient: "from-violet-500/25 to-purple-600/10",
  },
];

export function getAvatarMeta(avatarId?: string | null): AvatarMeta {
  return AVATAR_PRESETS.find((a) => a.id === avatarId) || AVATAR_PRESETS[0];
}

