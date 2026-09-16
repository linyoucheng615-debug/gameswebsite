"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Tag,
  Shield,
  Calendar,
  Save,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Swords,
  Trophy,
  Percent,
  Crosshair,
  Skull,
  Award,
  Edit3,
  Sparkles,
} from "lucide-react";
import { UserProfile, PlayerStats } from "@/types";
import { AVATAR_PRESETS, getAvatarMeta } from "@/lib/avatars";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [nickname, setNickname] = useState("");
  const [motto, setMotto] = useState("");
  const [avatar, setAvatar] = useState("cyber-fox");

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadProfile() {
    try {
      const res = await fetch("/api/users/profile");
      const data = await res.json();
      if (!res.ok || !data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      setStats(data.stats || null);
      setNickname(data.user.nickname);
      setMotto(data.user.motto || "超越極限，榮耀加冕！");
      setAvatar(data.user.avatar || "cyber-fox");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatar, motto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "儲存失敗");

      setUser(data.user);
      setMessage({ type: "success", text: "選手檔案與座右銘已成功同步更新！" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "更新失敗" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAvatar(newAvatarId: string) {
    setAvatar(newAvatarId);
    setAvatarModalOpen(false);
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatar: newAvatarId, motto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更換頭像失敗");

      setUser(data.user);
      setMessage({ type: "success", text: "頭像徽記已成功更換！" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-cyber-cyan font-mono text-sm tracking-widest animate-pulse">
          // ACCESSING PLAYER MATRIX & COMBAT STATS...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentAvatarMeta = getAvatarMeta(avatar);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyber-border pb-6 mb-8">
        <div>
          <div className="text-xs font-mono text-cyber-cyan tracking-widest uppercase mb-1 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ITM GAMES // 清大科管所選手中心</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            選手中心與戰績檔案
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/15 text-xs font-bold uppercase cyber-cut-corner transition-all flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          登出帳號
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 text-xs flex items-center gap-2 cyber-cut-br ${
            message.type === "success"
              ? "bg-emerald-950/60 border border-emerald-500 text-emerald-200"
              : "bg-red-950/60 border border-cyber-red text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="bg-cyber-card border border-cyber-border p-6 sm:p-8 cyber-cut-br shadow-cyber-card mb-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and Basic info */}
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
              <div
                className={`w-20 h-20 rounded-xl bg-gradient-to-br ${currentAvatarMeta.bgGradient} border-2 ${currentAvatarMeta.border} flex items-center justify-center text-4xl shadow-cyber-card transition-transform group-hover:scale-105`}
              >
                {currentAvatarMeta.emoji}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-cyber-darkest border border-cyber-cyan text-[10px] font-mono font-bold text-cyber-cyan rounded flex items-center gap-1 shadow"
              >
                <Edit3 className="w-2.5 h-2.5" /> 換頭像
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="text-2xl font-black text-white">{user.nickname}</h2>
                {user.role === "admin" ? (
                  <span className="px-2 py-0.5 bg-cyber-red/20 border border-cyber-red text-cyber-red text-[10px] font-mono font-bold rounded">
                    賽事管理員 (ADMIN)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan text-[10px] font-mono font-bold rounded">
                    認證選手 (PLAYER)
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-3 mb-2">
                <span>姓名：{user.name}</span>
                <span>•</span>
                <span>學號：{user.studentId}</span>
              </div>

              {/* Motto Display */}
              <div className="text-xs text-cyber-cyan font-mono italic flex items-center gap-1.5">
                <span>❝</span>
                <span>{motto}</span>
                <span>❞</span>
              </div>
            </div>
          </div>

          {/* Quick Win Rate Badge */}
          {stats && (
            <div className="bg-cyber-darkest/90 border border-cyber-border-bright p-4 cyber-cut-br flex items-center gap-5">
              <div className="text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-0.5">生涯總勝率</div>
                <div className="text-3xl font-black font-mono text-cyber-cyan">
                  {stats.winRate}%
                </div>
              </div>
              <div className="h-10 w-[1px] bg-cyber-border" />
              <div className="text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-0.5">戰績 (勝/負/和)</div>
                <div className="text-sm font-mono font-bold">
                  <span className="text-emerald-400">{stats.wins}W</span>{" "}
                  <span className="text-red-400">{stats.losses}L</span>{" "}
                  <span className="text-slate-400">{stats.draws}D</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-cyber-gold" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              對戰數據戰力分析
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 1. Overall Stats Card */}
            <div className="bg-cyber-card border border-cyber-border p-5 cyber-cut-br shadow-cyber-card">
              <div className="text-xs font-mono text-cyber-cyan uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Percent className="w-4 h-4" /> 總對戰指標
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">總出賽場次</span>
                  <span className="text-white font-bold text-sm">{stats.totalMatches} 場</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">獲勝場次</span>
                  <span className="text-emerald-400 font-bold">{stats.wins} 場</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">和局/平手</span>
                  <span className="text-slate-300 font-bold">{stats.draws} 場</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">敗北場次</span>
                  <span className="text-red-400 font-bold">{stats.losses} 場</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-cyber-border">
                  <span className="text-slate-400">連勝狀態</span>
                  <span className="text-cyber-gold font-bold">
                    {stats.streak.type === "win"
                      ? `🔥 ${stats.streak.count} 連勝中`
                      : stats.streak.type === "loss"
                      ? `❄️ ${stats.streak.count} 連敗`
                      : "平常"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Nemesis (Worst Winrate Opponent) */}
            <div className="bg-cyber-card border border-red-500/30 p-5 cyber-cut-br shadow-cyber-card relative">
              <div className="text-xs font-mono text-cyber-red uppercase tracking-wider mb-3 flex items-center gap-1.5 font-bold">
                <Skull className="w-4 h-4 text-cyber-red" />
                宿命天敵 (對誰勝率最低)
              </div>
              {stats.nemesis ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-red-950/50 border border-red-500/40 flex items-center justify-center text-2xl">
                      {getAvatarMeta(stats.nemesis.opponentAvatar).emoji}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">
                        {stats.nemesis.opponentNickname}
                      </div>
                      <div className="text-[11px] font-mono text-red-400 font-bold">
                        面對勝率：{stats.nemesis.winRate}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-cyber-darkest/70 p-2.5 border border-cyber-border rounded">
                    交手紀錄：
                    <span className="text-emerald-400 font-bold"> {stats.nemesis.wins} 勝 </span>
                    <span className="text-red-400 font-bold"> {stats.nemesis.losses} 負 </span>
                    <span className="text-slate-300 font-bold"> {stats.nemesis.draws} 和 </span>
                    (共 {stats.nemesis.totalGames} 戰)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">
                  尚無交手對手紀錄
                </div>
              )}
            </div>

            {/* 3. Favorite Rival (Best Winrate Opponent) */}
            <div className="bg-cyber-card border border-emerald-500/30 p-5 cyber-cut-br shadow-cyber-card relative">
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-bold">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                得意對手 (對誰勝率最高)
              </div>
              {stats.favoriteRival ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-2xl">
                      {getAvatarMeta(stats.favoriteRival.opponentAvatar).emoji}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">
                        {stats.favoriteRival.opponentNickname}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold">
                        壓制勝率：{stats.favoriteRival.winRate}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-cyber-darkest/70 p-2.5 border border-cyber-border rounded">
                    交手紀錄：
                    <span className="text-emerald-400 font-bold"> {stats.favoriteRival.wins} 勝 </span>
                    <span className="text-red-400 font-bold"> {stats.favoriteRival.losses} 負 </span>
                    <span className="text-slate-300 font-bold"> {stats.favoriteRival.draws} 和 </span>
                    (共 {stats.favoriteRival.totalGames} 戰)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">
                  尚無交手對手紀錄
                </div>
              )}
            </div>
          </div>

          {/* Recent Match History Table */}
          {stats.recentMatches.length > 0 && (
            <div className="bg-cyber-card border border-cyber-border p-5 cyber-cut-br shadow-cyber-card">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-cyber-red" /> 近期對戰戰報
              </div>
              <div className="space-y-2.5">
                {stats.recentMatches.map((m) => (
                  <div
                    key={m.matchId}
                    className="p-3 bg-cyber-darkest border border-cyber-border hover:border-cyber-cyan transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 font-mono font-bold rounded ${
                          m.result === "win"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                            : m.result === "loss"
                            ? "bg-red-950 text-red-400 border border-red-500/40"
                            : "bg-slate-800 text-slate-300 border border-slate-600"
                        }`}
                      >
                        {m.result === "win" ? "勝場" : m.result === "loss" ? "敗北" : "平手"}
                      </span>
                      <span className="font-bold text-white">{m.tournamentName}</span>
                      <span className="text-slate-500 font-mono">R{m.round}</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 font-mono">
                      <span>
                        對手：<strong className="text-slate-200">{m.opponentNickname}</strong>
                      </span>
                      <span className="text-cyber-cyan font-bold">{m.scoreChange}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Edit Profile Form */}
      <div className="bg-cyber-card border border-cyber-border p-6 sm:p-8 cyber-cut-br shadow-cyber-card">
        <h2 className="text-lg font-bold uppercase text-white mb-6 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-cyber-cyan" />
          編輯選手個人設定與座右銘
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                選手暱稱 (擂台識別名稱)
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-cyber-darkest border border-cyber-border px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                個人戰鬥座右銘 (Motto)
              </label>
              <input
                type="text"
                value={motto}
                placeholder="例: 超越極限，榮耀加冕！"
                onChange={(e) => setMotto(e.target.value)}
                className="w-full bg-cyber-darkest border border-cyber-border px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-cyber-red hover:bg-cyber-red-hover text-white font-bold text-xs uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "儲存中..." : "儲存個人設定"}
            </button>
          </div>
        </form>
      </div>

      {/* Avatar Selector Modal */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-cyber-card border border-cyber-border-bright p-6 sm:p-8 cyber-cut-corner shadow-cyber-card">
            <div className="flex items-center justify-between border-b border-cyber-border pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-cyber-cyan tracking-widest uppercase font-bold">
                  // Avatar Customization
                </span>
                <h3 className="text-xl font-black uppercase text-white tracking-wide">
                  選擇選手電競徽記頭像
                </h3>
              </div>
              <button
                onClick={() => setAvatarModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {AVATAR_PRESETS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleSelectAvatar(item.id)}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all cyber-cut-br ${
                    avatar === item.id
                      ? "bg-cyber-surface border-cyber-cyan shadow-neon-cyan/30 scale-105"
                      : "bg-cyber-darkest border-cyber-border hover:border-slate-500"
                  }`}
                >
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="text-xs font-bold text-white">{item.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${item.color} bg-cyber-darkest border border-cyber-border`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setAvatarModalOpen(false)}
              className="w-full py-2.5 bg-cyber-darkest border border-cyber-border text-slate-400 hover:text-white text-xs font-mono uppercase"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
