"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Swords,
  TrendingUp,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  X,
  Award,
  ChevronRight,
  Lock,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";
import { StudentBattleViewData } from "@/types";
import BattleArenaPlayer from "@/components/BattleArenaPlayer";

export default function StudentLobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [data, setData] = useState<StudentBattleViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 彈窗控制
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);

  // 是否已觀看過本週對戰
  const [hasWatched, setHasWatched] = useState(true);

  useEffect(() => {
    if (!studentNumber) return;

    async function fetchStudentData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/battle/${studentNumber}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || "查無此學號資料");
          return;
        }
        setData(json);

        // 檢查是否已觀看過最新對戰
        if (json.currentMatch) {
          const storageKey = `watched_${studentNumber}_m_${json.currentMatch.matchId}`;
          const watched = localStorage.getItem(storageKey);
          setHasWatched(watched === "true");

          // 如果 URL 帶有 ?openBattle=true 則自動開啟
          if (searchParams.get("openBattle") === "true") {
            setShowBattleModal(true);
            localStorage.setItem(storageKey, "true");
            setHasWatched(true);
          }
        }
      } catch {
        setErrorMsg("連線至伺服器失敗，請稍後重試");
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [studentNumber, searchParams]);

  function handleOpenBattle() {
    if (!data?.currentMatch) return;
    setShowBattleModal(true);
    // 標記為已觀看
    const storageKey = `watched_${studentNumber}_m_${data.currentMatch.matchId}`;
    localStorage.setItem(storageKey, "true");
    setHasWatched(true);
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-pixel text-xs text-amber-400 tracking-widest">
          ENTERING LOBBY...
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111827] border-2 border-rose-500/60 p-8 rounded-2xl text-center space-y-5 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">查無學生資料</h2>
          <p className="text-xs text-slate-300 font-sans">{errorMsg}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回登入頁</span>
          </Link>
        </div>
      </div>
    );
  }

  const { student, currentMatch, historyScores, stats, currentWeekHomework } = data;
  const avatar = getAvatarMeta(student.avatarId);
  const hasHomeworkShield = currentWeekHomework?.hasBuff ?? true;
  const hasMatchToWatch = Boolean(currentMatch?.battleLog);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 font-sans">
      {/* 頂部輕量導航 */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] text-amber-400">冒險者大廳</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-400">#{student.studentNumber}</span>
        </div>
        <Link
          href="/"
          className="hover:text-amber-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>切換學號</span>
        </Link>
      </div>

      {/* 【區塊一：個人角色卡片】 */}
      <div className="bg-[#101726]/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        {/* 背景微光光暈 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* 像素角色頭像與底座 */}
          <div className="relative flex flex-col items-center shrink-0">
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl bg-gradient-to-br ${avatar.bgGradient} border-2 ${avatar.border} shadow-lg relative z-10`}
            >
              {avatar.emoji}
            </div>
            {/* 圓形發光基座 */}
            <div className="w-28 h-5 -mt-2.5 bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20 rounded-full blur-[2px] border border-sky-400/30" />
            <span className="text-[11px] font-bold text-cyan-400 mt-2 font-mono">
              {avatar.name}
            </span>
          </div>

          {/* 學生資訊與徽章 */}
          <div className="space-y-3.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {student.name}
              </h1>
              <span className="inline-block self-center sm:self-auto font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                學號 {student.studentNumber}
              </span>
            </div>

            {/* 戰績標籤 */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm">
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono font-medium">
                {student.wins} 勝 {student.losses} 敗 {student.draws} 平
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs">
                勝率 {stats.winRate}%
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                奧義：{avatar.skillName}
              </span>
            </div>

            {/* 本週狀態徽章 (二選一) */}
            <div className="pt-1">
              {hasHomeworkShield ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/10">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🛡️ 作業護盾：已啟用 (+5 戰力)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-600 text-slate-400 text-xs sm:text-sm font-medium">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>作業護盾：未啟用 (無加成)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 【區塊二：三個核心功能大卡片】 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 卡片 1【⚔️ 觀看本週對戰】 */}
        <div
          onClick={handleOpenBattle}
          className={`relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-2xl ${
            hasMatchToWatch
              ? "bg-gradient-to-b from-[#1c1811] via-[#151a28] to-[#0f1422] border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-500/5"
              : "bg-[#101726]/80 border-slate-800 hover:border-slate-700 opacity-90"
          }`}
        >
          {/* 未觀看閃爍標籤 */}
          {hasMatchToWatch && !hasWatched && (
            <div className="absolute top-4 right-4 animate-pulse">
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-pixel text-[10px] shadow-lg shadow-rose-500/30">
                NEW
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-2xl group-hover:scale-110 transition-transform">
              ⚔️
            </div>
            <div>
              <h2 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                <span>觀看本週對戰</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {currentMatch
                  ? `第 ${currentMatch.weekNumber} 週 • 對決 ${currentMatch.opponentName}`
                  : "本週對戰批改準備中"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
            <span>{hasMatchToWatch ? "點擊進入舞台" : "敬請期待"}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 卡片 2【📈 歷次成績紀錄】 */}
        <div
          onClick={() => setShowHistoryModal(true)}
          className="p-6 rounded-2xl bg-[#101726]/90 border border-slate-800 hover:border-sky-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-2xl"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 text-2xl group-hover:scale-110 transition-transform">
              📈
            </div>
            <div>
              <h2 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors">
                歷次成績紀錄
              </h2>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                已累積 {historyScores.length} 次週考戰歷，查看個人折線圖與階級段位
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
            <span>展開個人圖表</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 卡片 3【📜 本週任務目標】 */}
        <div
          onClick={() => setShowHomeworkModal(true)}
          className="p-6 rounded-2xl bg-[#101726]/90 border border-slate-800 hover:border-emerald-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-2xl"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 text-2xl group-hover:scale-110 transition-transform">
              📜
            </div>
            <div>
              <h2 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                本週任務目標
              </h2>
              <div className="text-xs text-slate-400 mt-1 space-y-1">
                <p className="truncate text-slate-300 font-medium">
                  {currentWeekHomework?.unitTitle || "第 1 週課程"}
                </p>
                <div className="pt-0.5">
                  {currentWeekHomework?.status === "completed" && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      已完成 (護盾已充能)
                    </span>
                  )}
                  {currentWeekHomework?.status === "missing" && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      缺交：{currentWeekHomework.missingScope || "請儘速補交"}
                    </span>
                  )}
                  {currentWeekHomework?.status === "partial" && (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      待訂正：{currentWeekHomework.missingScope || "請儘速完成"}
                    </span>
                  )}
                  {!currentWeekHomework && (
                    <span className="text-slate-400">目前無登記紀錄</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
            <span>檢視詳細進度</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 彈窗 1：戰鬥對決舞台 Modal */}
      {/* ========================================================================= */}
      {showBattleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <BattleArenaPlayer
              data={data}
              onClose={() => setShowBattleModal(false)}
              autoStart={true}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 彈窗 2：歷次成績紀錄 Modal */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#0d1322] border-2 border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📈</span>
                <div>
                  <h3 className="text-lg font-black text-white">個人歷次週考成績</h3>
                  <p className="text-xs text-slate-400">
                    隱私隔離保護：僅呈現個人成績，不公開班級他人資訊
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 階級段位分區說明 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300">
                <div className="font-bold">王者階級 (S)</div>
                <div className="font-mono text-[11px] text-slate-300">90分以上</div>
              </div>
              <div className="p-2 rounded bg-indigo-950/40 border border-indigo-500/40 text-indigo-300">
                <div className="font-bold">卓越階級 (A)</div>
                <div className="font-mono text-[11px] text-slate-300">80~89分</div>
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                <div className="font-bold">精銳階級 (B)</div>
                <div className="font-mono text-[11px] text-slate-300">70~79分</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                <div className="font-bold">先鋒階級 (C)</div>
                <div className="font-mono text-[11px] text-slate-400">70分以下</div>
              </div>
            </div>

            {/* 歷次成績清單與柱狀可視化 */}
            {historyScores.length > 0 ? (
              <div className="space-y-3">
                {historyScores.map((h, i) => {
                  const tier =
                    h.effectivePower >= 90
                      ? { label: "S", color: "text-amber-400 border-amber-500/50" }
                      : h.effectivePower >= 80
                      ? { label: "A", color: "text-indigo-400 border-indigo-500/50" }
                      : h.effectivePower >= 70
                      ? { label: "B", color: "text-emerald-400 border-emerald-500/50" }
                      : { label: "C", color: "text-slate-400 border-slate-600" };

                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-pixel text-[11px] text-amber-400">
                            W{h.weekNumber}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {h.weekTitle}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                          <span>卷面: {h.rawScore}</span>
                          <span>•</span>
                          {h.hasBuff ? (
                            <span className="text-emerald-400 font-bold">+5護盾</span>
                          ) : (
                            <span className="text-slate-500">+0</span>
                          )}
                          <span>•</span>
                          <span className="text-slate-200 font-bold">
                            戰力: {h.effectivePower}
                          </span>
                        </div>
                      </div>

                      {/* 段位徽章 */}
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center font-pixel text-sm font-bold bg-slate-950 ${tier.color}`}
                      >
                        {tier.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                尚未有歷次週考數據
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 彈窗 3：本週任務目標 Modal */}
      {/* ========================================================================= */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0d1322] border-2 border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="text-lg font-black text-white">本週任務目標與進度</h3>
                  <p className="text-xs text-slate-400">
                    按時繳齊作業即可啟動 +5 戰力護盾！
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHomeworkModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentWeekHomework ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs text-amber-400 font-pixel">
                    WEEK {currentWeekHomework.weekNumber}
                  </div>
                  <div className="text-base font-bold text-white">
                    {currentWeekHomework.unitTitle}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>補交期限：{currentWeekHomework.deadlineText}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400 font-medium">個人作業繳交狀態</div>
                  <div>
                    {currentWeekHomework.status === "completed" && (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          已完成（已啟動 +5 護盾）
                        </span>
                        <p className="text-xs text-slate-300">
                          太棒了！本週作業已全數繳齊，戰鬥擂台將為您提供專屬減傷護盾！
                        </p>
                      </div>
                    )}
                    {currentWeekHomework.status === "missing" && (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/50 text-rose-300 text-xs font-bold">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          缺交（無護盾加成）
                        </span>
                        <p className="text-xs text-rose-200">
                          缺交範圍：<span className="font-bold underline">{currentWeekHomework.missingScope || "整份作業"}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          請在補交期限前繳交，若有不清楚的地方可提早到班詢問老師！
                        </p>
                      </div>
                    )}
                    {currentWeekHomework.status === "partial" && (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 text-xs font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          待訂正 / 部分完成
                        </span>
                        <p className="text-xs text-amber-200">
                          待訂正範圍：<span className="font-bold underline">{currentWeekHomework.missingScope || "部分題型"}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          請儘速完成訂正，補齊後即可領取下週護盾加成！
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                本週作業目標準備中
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHomeworkModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
