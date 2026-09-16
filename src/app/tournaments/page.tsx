"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Trophy,
  Plus,
  Users,
  Swords,
  Calendar,
  Clock,
  Sparkles,
  Filter,
  AlertTriangle,
  Gamepad2,
  Layers,
  Activity,
  Flame,
  Trash2,
} from "lucide-react";
import { UserProfile, TournamentCategory } from "@/types";

interface TournamentItem {
  id: string;
  name: string;
  description?: string | null;
  format: "swiss" | "round_robin" | "single_elimination";
  category: TournamentCategory;
  status: "pending" | "ongoing" | "playoff" | "completed";
  topCut: number;
  currentRound: number;
  totalRounds: number;
  createdAt: string;
  creator: { id: string; name: string; nickname: string };
  createdBy?: string;
  _count: { participants: number; matches: number };
}

function TournamentsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "all";

  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);

  // Create Tournament Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "esports" as TournamentCategory,
    format: "swiss",
    totalRounds: 3,
    topCut: 4,
  });

  async function loadData() {
    try {
      const [userRes, tourneysRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/tournaments"),
      ]);

      const userData = await userRes.json();
      setCurrentUser(userData.user || null);

      const tourneyData = await tourneysRes.json();
      if (tourneysRes.ok) {
        setTournaments(tourneyData.tournaments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "建立失敗");

      setCreateModalOpen(false);
      setForm({
        name: "",
        description: "",
        category: "esports",
        format: "swiss",
        totalRounds: 3,
        topCut: 4,
      });
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("建立賽事發生錯誤");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteTournament(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`⚠️ 確定要刪除盃賽「${name}」嗎？\n此動作將一併清除該盃賽之所有賽程與報名紀錄，無法復原。`)) {
      return;
    }
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");
      alert(data.message || "盃賽已成功刪除！");
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("刪除賽事發生錯誤");
      }
    }
  }

  const filteredTournaments = tournaments.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || (t.category || "esports") === categoryFilter;
    return matchStatus && matchCategory;
  });

  const getFormatLabel = (fmt: string) => {
    switch (fmt) {
      case "swiss":
        return { label: "瑞士積分制", icon: "⚡", color: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10" };
      case "round_robin":
        return { label: "小組循環賽", icon: "⚔", color: "text-cyber-gold border-cyber-gold/40 bg-cyber-gold/10" };
      case "single_elimination":
        return { label: "標準單淘汰", icon: "🏆", color: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10" };
      default:
        return { label: fmt, icon: "⚔", color: "text-slate-400 border-slate-700" };
    }
  };

  const getCategoryMeta = (category?: string) => {
    switch (category) {
      case "esports":
        return { label: "電子競技", icon: "🎮", badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40" };
      case "sports":
        return { label: "球類運動", icon: "🏓", badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" };
      case "tcg":
        return { label: "桌上卡牌", icon: "🃏", badgeBg: "bg-amber-950/80 text-amber-300 border-amber-500/40" };
      case "chess":
        return { label: "智力棋類", icon: "♟️", badgeBg: "bg-rose-950/80 text-rose-300 border-rose-500/40" };
      case "general":
      default:
        return { label: "綜合賽事", icon: "⚡", badgeBg: "bg-purple-950/80 text-purple-300 border-purple-500/40" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40 rounded">
            報名中 (PENDING)
          </span>
        );
      case "ongoing":
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red/50 rounded shadow-neon-red animate-pulse">
            進行中 (ONGOING)
          </span>
        );
      case "playoff":
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded shadow-neon-gold">
            複賽中 (PLAYOFF)
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded">
            已完賽 (COMPLETED)
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-cyber-cyan font-mono text-sm tracking-widest animate-pulse">
          // ACCESSING TOURNAMENT REGISTRY...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyber-border pb-6 mb-8 gap-4">
        <div>
          <div className="text-xs font-mono text-cyber-red tracking-widest uppercase mb-1 flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span>ITM GAMES // 清大科管所賽事大廳</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">
            全項目賽事大廳與戰況
          </h1>
          <p className="text-xs sm:text-sm text-cyber-muted mt-1">
            支援電子競技、球類運動、桌上卡牌、棋類等多領域賽事排程、瑞士制即時算分與淘汰賽樹狀圖。
          </p>
        </div>

        {currentUser ? (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-3 bg-cyber-red hover:bg-cyber-red-hover text-white font-black text-xs uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center gap-2 self-start md:self-auto shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            發起新盃賽
          </button>
        ) : (
          <Link
            href="/login?redirect=/tournaments"
            className="px-5 py-3 bg-cyber-surface border border-cyber-border hover:border-cyber-cyan text-slate-300 hover:text-white font-bold text-xs uppercase cyber-cut-corner transition-all flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 text-cyber-cyan" />
            登入後發起盃賽
          </Link>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="mb-4">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyber-cyan" /> 項目領域分類：
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "全部領域", icon: "🌐" },
            { key: "esports", label: "電子競技", icon: "🎮" },
            { key: "sports", label: "球類運動", icon: "🏓" },
            { key: "tcg", label: "桌上卡牌", icon: "🃏" },
            { key: "chess", label: "智力棋類", icon: "♟️" },
            { key: "general", label: "綜合賽事", icon: "⚡" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3.5 py-1.5 text-xs font-bold tracking-wider transition-all cyber-cut-br flex items-center gap-1.5 ${
                categoryFilter === cat.key
                  ? "bg-cyber-surface border border-cyber-cyan text-cyber-cyan shadow-neon-cyan/20"
                  : "bg-cyber-card/60 border border-cyber-border text-slate-400 hover:text-white"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pt-3 border-t border-cyber-border/40">
        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mr-2">
          <Filter className="w-3 h-3" /> 進度狀態：
        </span>
        {[
          { key: "all", label: "全部進度" },
          { key: "ongoing", label: "進行中" },
          { key: "playoff", label: "複賽階段" },
          { key: "pending", label: "開放報名" },
          { key: "completed", label: "已結束" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1 text-[11px] font-mono tracking-wider transition-all ${
              statusFilter === tab.key
                ? "bg-cyber-border-bright text-white font-bold rounded"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-20 bg-cyber-card border border-cyber-border p-8 cyber-cut-br">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">查無符合條件的比賽</h3>
          <p className="text-xs text-slate-400">目前暫無此條件的賽事，請切換篩選分類查看。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => {
            const fmt = getFormatLabel(t.format);
            const cat = getCategoryMeta(t.category);

            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="bg-cyber-card border border-cyber-border hover:border-cyber-cyan transition-all p-6 cyber-cut-br shadow-cyber-card flex flex-col justify-between group hover:translate-y-[-2px]"
              >
                <div>
                  {/* Card Top: Category & Format & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] font-bold font-mono rounded ${cat.badgeBg}`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(t.status)}
                      {currentUser && (currentUser.role === "admin" || t.creator?.id === currentUser.id || t.createdBy === currentUser.id) && (
                        <button
                          onClick={(e) => handleDeleteTournament(e, t.id, t.name)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                          title="刪除此盃賽"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold font-mono rounded ${fmt.color}`}
                    >
                      <span>{fmt.icon}</span>
                      <span>{fmt.label}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-cyber-cyan transition-colors mb-2 leading-snug">
                    {t.name}
                  </h3>

                  {t.description && (
                    <p className="text-xs text-cyber-muted line-clamp-2 mb-4 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Organizer & Meta stats */}
                <div className="mt-4 pt-3 border-t border-cyber-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-500">主辦：</span>
                    <span className="text-slate-300 font-semibold truncate">{t.creator?.nickname || t.creator?.name || "匿名主辦"}</span>
                    {currentUser?.id === t.creator?.id && (
                      <span className="px-1.5 py-0.2 bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 text-[9px] font-bold rounded">
                        您的主辦
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-slate-500">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-cyber-border/40 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyber-cyan" />
                    <span>{t._count.participants} 位選手</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-cyber-red" />
                    <span>
                      {t.status === "pending"
                        ? "即將開賽"
                        : t.status === "playoff"
                        ? "淘汰複賽"
                        : `第 ${t.currentRound} / ${t.totalRounds} 輪`}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Tournament Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-cyber-card border border-cyber-border-bright p-6 sm:p-8 cyber-cut-corner shadow-cyber-card relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyber-border pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-cyber-cyan tracking-widest uppercase font-bold">
                  // Autonomous Tournament Creation
                </span>
                <h2 className="text-xl font-black uppercase text-white tracking-wide">
                  發起新競賽賽程 (自主主辦)
                </h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  所有登入選手均可建立賽事並獲得該賽事管理與配對推進權限。
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-cyber-red text-red-200 text-xs flex items-center gap-2 cyber-cut-br">
                <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  賽事名稱
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 2026 VALORANT 校際公開賽 / 校際羽球大獎賽"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-cyber-darkest border border-cyber-border px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  項目領域類別
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "esports", label: "電子競技", icon: "🎮" },
                    { key: "sports", label: "球類運動", icon: "🏓" },
                    { key: "tcg", label: "桌上卡牌", icon: "🃏" },
                    { key: "chess", label: "智力棋類", icon: "♟️" },
                    { key: "general", label: "綜合賽事", icon: "⚡" },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.key}
                      onClick={() => setForm({ ...form, category: cat.key as TournamentCategory })}
                      className={`p-2 border text-xs font-bold text-left flex items-center gap-2 transition-all cyber-cut-br ${
                        form.category === cat.key
                          ? "bg-cyber-surface border-cyber-cyan text-cyber-cyan shadow-neon-cyan/20"
                          : "bg-cyber-darkest border-cyber-border text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  賽事說明 / 備註 (選填)
                </label>
                <textarea
                  placeholder="例: 初賽進行 3 輪瑞士制，取前 4 名晉級單敗淘汰複賽爭奪王座..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-cyber-darkest border border-cyber-border px-4 py-2 text-sm text-white focus:outline-none focus:border-cyber-cyan h-16"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    賽制類型
                  </label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value as any })}
                    className="w-full bg-cyber-darkest border border-cyber-border p-2.5 text-xs text-white"
                  >
                    <option value="swiss">瑞士積分制</option>
                    <option value="round_robin">小組單循環賽</option>
                    <option value="single_elimination">標準單淘汰賽</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    總輪次 (瑞士制)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.totalRounds}
                    onChange={(e) => setForm({ ...form, totalRounds: parseInt(e.target.value) || 3 })}
                    className="w-full bg-cyber-darkest border border-cyber-border p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    晉級人數 (Top Cut)
                  </label>
                  <select
                    value={form.topCut}
                    onChange={(e) => setForm({ ...form, topCut: parseInt(e.target.value) })}
                    className="w-full bg-cyber-darkest border border-cyber-border p-2.5 text-xs text-white"
                  >
                    <option value={2}>Top 2 (決賽)</option>
                    <option value={4}>Top 4 (準決賽)</option>
                    <option value={8}>Top 8 (八強)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full mt-4 py-3 bg-cyber-red hover:bg-cyber-red-hover text-white font-bold text-xs uppercase cyber-cut-corner shadow-neon-red transition-all"
              >
                {createLoading ? "賽事建立中..." : "確認發布比賽"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-cyber-cyan font-mono text-sm tracking-widest animate-pulse">
            // INITIALIZING ARENA MATRIX...
          </div>
        </div>
      }
    >
      <TournamentsContent />
    </Suspense>
  );
}
