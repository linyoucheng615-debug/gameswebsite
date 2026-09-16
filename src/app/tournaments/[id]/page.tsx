"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Swords,
  Users,
  Calendar,
  Shield,
  Play,
  FastForward,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BarChart3,
} from "lucide-react";
import { UserProfile, Tournament, Match, TournamentParticipant } from "@/types";
import MatchCard from "@/components/tournament/MatchCard";
import StandingsTable from "@/components/tournament/StandingsTable";
import BracketView from "@/components/tournament/BracketView";
import QuickReportModal from "@/components/tournament/QuickReportModal";
import ChampionPodium from "@/components/tournament/ChampionPodium";

interface TournamentDetailData {
  tournament: Tournament & {
    creator: { id: string; name: string; nickname: string };
    participants: (TournamentParticipant & {
      user: { id: string; studentId: string; name: string; nickname: string; role: string };
    })[];
    matches: Match[];
  };
  currentUser: UserProfile | null;
  isJoined: boolean;
  isAdmin: boolean;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<TournamentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matches" | "standings" | "bracket" | "stats">("matches");
  const [roundFilter, setRoundFilter] = useState<number | "all">("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick report modal for bracket view selection
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const loadDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "載入賽事失敗");
      setData(resData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: "error", text: err.message });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // 報名比賽
  async function handleJoin() {
    if (!currentUser) {
      router.push(`/login?redirect=/tournaments/${id}`);
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/join`, { method: "POST" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "報名失敗");

      setFeedback({ type: "success", text: resData.message });
      loadDetails();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: "error", text: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  }

  // 管理員：啟動比賽
  async function handleStartTournament() {
    if (!confirm("確定啟動本項賽事嗎？系統將自動生成第 1 輪配對。")) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/start`, { method: "POST" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "啟動失敗");

      setFeedback({ type: "success", text: resData.message });
      loadDetails();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: "error", text: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  }

  // 管理員：推進下一輪 (瑞士制)
  async function handleNextRound() {
    if (!confirm("確定推進至下一輪嗎？請確保當前輪次對局均已完賽。")) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/next-round`, { method: "POST" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "推進失敗");

      setFeedback({ type: "success", text: resData.message });
      loadDetails();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: "error", text: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  }

  // 管理員：啟動淘汰複賽
  async function handleStartPlayoff() {
    if (!confirm(`確定依照當前積分榜選出前 ${data?.tournament.topCut} 名晉級單敗淘汰複賽嗎？`)) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/start-playoff`, { method: "POST" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "啟動複賽失敗");

      setFeedback({ type: "success", text: resData.message });
      setActiveTab("bracket");
      loadDetails();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: "error", text: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  }

  // 管理員：正式結束賽事
  async function handleCompleteTournament() {
    if (!confirm("確定正式完結本項賽事並頒布最終榮譽殿堂名單嗎？")) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/complete`, { method: "POST" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "結束賽事失敗");

      setFeedback({ type: "success", text: resData.message });
      loadDetails();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: "error", text: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-cyber-cyan font-mono text-sm tracking-widest animate-pulse">
          // ACCESSING BATTLE MATRIX...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tournament, currentUser, isJoined, isAdmin } = data;

  // Filter matches by round
  const filteredMatches = tournament.matches.filter((m) => {
    if (roundFilter === "all") return true;
    return m.round === roundFilter;
  });

  const availableRounds = Array.from(new Set(tournament.matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/tournaments"
          className="text-xs font-mono text-cyber-cyan hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 返回賽事大廳
        </Link>
      </div>

      {/* Hero Tournament Banner */}
      <div className="bg-cyber-card border border-cyber-border p-6 sm:p-8 cyber-cut-br shadow-cyber-card relative mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {(() => {
                const cat = tournament.category || "esports";
                const meta =
                  cat === "esports"
                    ? { label: "電子競技", icon: "🎮", badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40" }
                    : cat === "sports"
                    ? { label: "球類運動", icon: "🏓", badge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" }
                    : cat === "tcg"
                    ? { label: "桌上卡牌", icon: "🃏", badge: "bg-amber-950/80 text-amber-300 border-amber-500/40" }
                    : cat === "chess"
                    ? { label: "智力棋類", icon: "♟️", badge: "bg-rose-950/80 text-rose-300 border-rose-500/40" }
                    : { label: "綜合賽事", icon: "⚡", badge: "bg-purple-950/80 text-purple-300 border-purple-500/40" };
                return (
                  <span className={`px-2.5 py-0.5 text-xs font-mono font-bold border rounded flex items-center gap-1 ${meta.badge}`}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                );
              })()}

              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyber-red/20 border border-cyber-red/50 text-cyber-red rounded shadow-neon-red">
                {tournament.format === "swiss"
                  ? "瑞士積分制"
                  : tournament.format === "round_robin"
                  ? "小組單循環賽"
                  : "標準單淘汰賽"}
              </span>

              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyber-darkest border border-cyber-border text-slate-300 rounded">
                {tournament.status === "pending"
                  ? "報名中"
                  : tournament.status === "ongoing"
                  ? `進行中 (輪次 ${tournament.currentRound} / ${tournament.totalRounds})`
                  : tournament.status === "playoff"
                  ? "淘汰複賽中"
                  : "已完賽"}
              </span>

              <span className="px-2 py-0.5 text-xs font-mono text-cyber-gold border border-cyber-gold/40 bg-cyber-gold/10 rounded">
                Top {tournament.topCut} 晉級
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-wide mb-2">
              {tournament.name}
            </h1>

            {tournament.description && (
              <p className="text-xs sm:text-sm text-cyber-muted max-w-2xl mb-3">
                {tournament.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyber-cyan" />
                {tournament.participants.length} 人參賽
              </span>
              <span>主辦：{tournament.creator.nickname}</span>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Player Join Button */}
            {tournament.status === "pending" && (
              <>
                {isJoined ? (
                  <div className="px-4 py-2.5 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs font-bold cyber-cut-corner flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 您已報名參賽
                  </div>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-gradient-to-r from-cyber-cyan to-blue-600 hover:brightness-110 text-cyber-darkest font-black text-xs uppercase cyber-cut-corner shadow-neon-cyan transition-all flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4" />
                    <span>立即報名參賽</span>
                  </button>
                )}
              </>
            )}

            {/* Admin Management Toolbar */}
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-cyber-darkest/90 border border-cyber-border-bright cyber-cut-corner">
                <span className="text-[10px] font-mono text-cyber-red font-bold px-2 uppercase">
                  Admin:
                </span>

                {tournament.status === "pending" && (
                  <button
                    onClick={handleStartTournament}
                    disabled={actionLoading || tournament.participants.length < 2}
                    className="px-3.5 py-1.5 bg-cyber-red hover:bg-cyber-red-hover text-white font-bold text-xs uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center gap-1 disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    啟動比賽
                  </button>
                )}

                {tournament.status === "ongoing" && tournament.format === "swiss" && (
                  <button
                    onClick={handleNextRound}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-cyber-cyan hover:brightness-110 text-cyber-darkest font-bold text-xs uppercase cyber-cut-corner shadow-neon-cyan transition-all flex items-center gap-1"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    推進下一輪
                  </button>
                )}

                {(tournament.status === "ongoing" || tournament.status === "pending") &&
                  tournament.format !== "single_elimination" && (
                    <button
                      onClick={handleStartPlayoff}
                      disabled={actionLoading || tournament.participants.length < tournament.topCut}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cyber-cut-corner shadow-neon-gold transition-all flex items-center gap-1 disabled:opacity-40"
                    >
                      <Award className="w-3.5 h-3.5" />
                      啟動複賽 (Top {tournament.topCut})
                    </button>
                  )}

                {tournament.status !== "completed" && (
                  <button
                    onClick={handleCompleteTournament}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cyber-cut-corner shadow-md transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    完結盃賽
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Tournament Champion Podium */}
      {tournament.status === "completed" && (
        <ChampionPodium
          participants={tournament.participants}
          tournamentName={tournament.name}
        />
      )}

      {/* Status Feedback Toast */}
      {feedback && (
        <div
          className={`mb-6 p-4 text-xs font-semibold flex items-center gap-2.5 cyber-cut-br border ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
              : "bg-red-950/40 border-cyber-red/60 text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-cyber-border mb-6">
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 relative ${
            activeTab === "matches"
              ? "text-cyber-cyan border-b-2 border-cyber-cyan"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Swords className="w-4 h-4" />
          賽程對局列表 ({tournament.matches.length})
        </button>

        <button
          onClick={() => setActiveTab("standings")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 relative ${
            activeTab === "standings"
              ? "text-cyber-gold border-b-2 border-cyber-gold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4" />
          即時積分排行榜
        </button>

        <button
          onClick={() => setActiveTab("bracket")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 relative ${
            activeTab === "bracket"
              ? "text-cyber-red border-b-2 border-cyber-red"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Award className="w-4 h-4" />
          單淘汰晉級樹狀圖
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 relative ${
            activeTab === "stats"
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          賽事數據統計
        </button>
      </div>

      {/* Tab Content 1: Matches View */}
      {activeTab === "matches" && (
        <div className="space-y-6">
          {/* Round Filter Toolbar */}
          {availableRounds.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-mono text-slate-500 mr-2">輪次篩選：</span>
              <button
                onClick={() => setRoundFilter("all")}
                className={`px-3 py-1 text-xs font-mono tracking-wider cyber-cut-br ${
                  roundFilter === "all"
                    ? "bg-cyber-surface border border-cyber-cyan text-cyber-cyan font-bold"
                    : "bg-cyber-card border border-cyber-border text-slate-400 hover:text-white"
                }`}
              >
                全部輪次
              </button>

              {availableRounds.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoundFilter(r)}
                  className={`px-3 py-1 text-xs font-mono tracking-wider cyber-cut-br ${
                    roundFilter === r
                      ? "bg-cyber-surface border border-cyber-cyan text-cyber-cyan font-bold"
                      : "bg-cyber-card border border-cyber-border text-slate-400 hover:text-white"
                  }`}
                >
                  Round {r}
                </button>
              ))}
            </div>
          )}

          {filteredMatches.length === 0 ? (
            <div className="text-center py-16 bg-cyber-card border border-cyber-border p-8 cyber-cut-br">
              <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">暫無對局排程</h3>
              <p className="text-xs text-slate-400">
                {tournament.status === "pending"
                  ? "賽事尚未開賽，請由管理員在後台點擊「啟動比賽」生成首輪對局。"
                  : "此輪次尚無排程場次。"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUser={currentUser}
                  onRefresh={loadDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Standings View */}
      {activeTab === "standings" && (
        <StandingsTable
          participants={tournament.participants}
          topCut={tournament.topCut}
          format={tournament.format}
        />
      )}

      {/* Tab Content 3: Bracket View */}
      {activeTab === "bracket" && (
        <BracketView
          matches={tournament.matches}
          currentUser={currentUser}
          onSelectMatch={(m) => setSelectedMatch(m)}
        />
      )}

      {/* Tab Content 4: Tournament Analytics */}
      {activeTab === "stats" && (() => {
        const totalMatches = tournament.matches.length;
        const finishedMatches = tournament.matches.filter((m) => m.status === "finished").length;
        const pendingMatches = totalMatches - finishedMatches;
        const completionRate = totalMatches > 0 ? Math.round((finishedMatches / totalMatches) * 100) : 0;

        const finishedList = tournament.matches.filter((m) => m.status === "finished");
        const blueWins = finishedList.filter((m) => m.player1Result === "win").length;
        const redWins = finishedList.filter((m) => m.player2Result === "win").length;
        const draws = finishedList.filter((m) => m.player1Result === "draw").length;

        const blueWinRate = finishedList.length > 0 ? Math.round((blueWins / finishedList.length) * 100) : 0;
        const redWinRate = finishedList.length > 0 ? Math.round((redWins / finishedList.length) * 100) : 0;
        const drawRate = finishedList.length > 0 ? Math.round((draws / finishedList.length) * 100) : 0;

        // Top Scorer
        const sortedByScore = [...tournament.participants].sort((a, b) => b.currentScore - a.currentScore);
        const topScorer = sortedByScore[0];

        // Best Win Rate Participant (min 1 match)
        const participantWinRates = tournament.participants.map((p) => {
          const myMatches = finishedList.filter((m) => m.player1Id === p.userId || m.player2Id === p.userId);
          const myWins = myMatches.filter((m) => (m.player1Id === p.userId && m.player1Result === "win") || (m.player2Id === p.userId && m.player2Result === "win")).length;
          const wr = myMatches.length > 0 ? Math.round((myWins / myMatches.length) * 100) : 0;
          return { participant: p, played: myMatches.length, wins: myWins, winRate: wr };
        }).filter((p) => p.played > 0).sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

        const bestEfficiencyPlayer = participantWinRates[0];

        // Preliminary vs Playoff breakdown
        const prelimMatches = tournament.matches.filter((m) => m.stage === "preliminary");
        const prelimFinished = prelimMatches.filter((m) => m.status === "finished").length;
        const playoffMatches = tournament.matches.filter((m) => m.stage === "playoff");
        const playoffFinished = playoffMatches.filter((m) => m.status === "finished").length;

        return (
          <div className="space-y-6">
            {/* Overview Metric Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-cyber-card border border-cyber-border p-5 cyber-cut-br shadow-cyber-card">
                <div className="text-[11px] font-mono text-slate-400 mb-1">賽事完賽進度</div>
                <div className="text-3xl font-black font-mono text-cyber-cyan mb-2">
                  {completionRate}%
                </div>
                <div className="w-full bg-cyber-darkest h-2 rounded-full overflow-hidden border border-cyber-border">
                  <div
                    className="bg-gradient-to-r from-cyber-cyan to-blue-500 h-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-2 flex justify-between">
                  <span>已完賽: {finishedMatches} 場</span>
                  <span>待開打: {pendingMatches} 場</span>
                </div>
              </div>

              <div className="bg-cyber-card border border-cyan-500/30 p-5 cyber-cut-br shadow-cyber-card">
                <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-cyan" />
                  藍方 (P1) 勝率
                </div>
                <div className="text-3xl font-black font-mono text-cyan-300 mb-1">
                  {blueWinRate}%
                </div>
                <div className="text-xs font-mono text-slate-400">
                  共奪得 <strong className="text-white">{blueWins}</strong> 場勝利
                </div>
              </div>

              <div className="bg-cyber-card border border-red-500/30 p-5 cyber-cut-br shadow-cyber-card">
                <div className="text-[11px] font-mono text-rose-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 shadow-neon-red" />
                  紅方 (P2) 勝率
                </div>
                <div className="text-3xl font-black font-mono text-rose-300 mb-1">
                  {redWinRate}%
                </div>
                <div className="text-xs font-mono text-slate-400">
                  共奪得 <strong className="text-white">{redWins}</strong> 場勝利
                </div>
              </div>

              <div className="bg-cyber-card border border-amber-500/30 p-5 cyber-cut-br shadow-cyber-card">
                <div className="text-[11px] font-mono text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  雙方平局/和局率
                </div>
                <div className="text-3xl font-black font-mono text-amber-300 mb-1">
                  {drawRate}%
                </div>
                <div className="text-xs font-mono text-slate-400">
                  共發生 <strong className="text-white">{draws}</strong> 次平手
                </div>
              </div>
            </div>

            {/* MVPs and Breakdown Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highlight Cards */}
              <div className="bg-cyber-card border border-cyber-border p-6 cyber-cut-br space-y-4">
                <div className="text-xs font-mono text-cyber-gold uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-cyber-gold" />
                  賽事榮譽之星 (MVP)
                </div>

                {topScorer && (
                  <div className="p-4 bg-cyber-darkest border border-cyber-gold/40 flex items-center justify-between cyber-cut-br">
                    <div>
                      <div className="text-[10px] font-mono text-cyber-gold uppercase font-bold">目前積分領先者</div>
                      <div className="text-lg font-black text-white">{topScorer.user.nickname}</div>
                      <div className="text-xs text-slate-400 font-mono">{topScorer.user.name} ({topScorer.user.studentId})</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-cyber-gold">{topScorer.currentScore.toFixed(1)}</div>
                      <div className="text-[10px] font-mono text-slate-400">累積總積分</div>
                    </div>
                  </div>
                )}

                {bestEfficiencyPlayer && (
                  <div className="p-4 bg-cyber-darkest border border-cyan-500/40 flex items-center justify-between cyber-cut-br">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">最高勝率選手</div>
                      <div className="text-lg font-black text-white">{bestEfficiencyPlayer.participant.user.nickname}</div>
                      <div className="text-xs text-slate-400 font-mono">出賽 {bestEfficiencyPlayer.played} 戰 / 斬獲 {bestEfficiencyPlayer.wins} 勝</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-cyan-400">{bestEfficiencyPlayer.winRate}%</div>
                      <div className="text-[10px] font-mono text-slate-400">賽事勝率</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stage Progress Summary */}
              <div className="bg-cyber-card border border-cyber-border p-6 cyber-cut-br space-y-4">
                <div className="text-xs font-mono text-cyber-cyan uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-cyber-cyan" />
                  賽制階段完成度
                </div>

                <div className="p-4 bg-cyber-darkest border border-cyber-border cyber-cut-br space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold">預賽輪次 (瑞士制 / 小組循環)</span>
                    <span className="text-cyber-cyan font-bold">{prelimFinished} / {prelimMatches.length} 完賽</span>
                  </div>
                  <div className="w-full bg-cyber-surface h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyber-cyan h-full"
                      style={{ width: `${prelimMatches.length > 0 ? (prelimFinished / prelimMatches.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {playoffMatches.length > 0 && (
                  <div className="p-4 bg-cyber-darkest border border-cyber-border cyber-cut-br space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-amber-400 font-bold">複賽階段 (淘汰賽 Bracket)</span>
                      <span className="text-amber-400 font-bold">{playoffFinished} / {playoffMatches.length} 完賽</span>
                    </div>
                    <div className="w-full bg-cyber-surface h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${playoffMatches.length > 0 ? (playoffFinished / playoffMatches.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal for reporting directly from Bracket View if clicked */}
      {selectedMatch && currentUser && (
        <QuickReportModal
          match={selectedMatch}
          currentUser={currentUser}
          isOpen={Boolean(selectedMatch)}
          onClose={() => setSelectedMatch(null)}
          onSuccess={() => {
            setSelectedMatch(null);
            loadDetails();
          }}
        />
      )}
    </div>
  );
}

