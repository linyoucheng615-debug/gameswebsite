"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Trophy,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  ArrowRight,
  BookOpen,
  Calendar,
  Zap,
  Layers,
  Check,
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PixelFighterSprite from "@/components/PixelFighterSprite";
import BattleArenaPlayer from "@/components/BattleArenaPlayer";
import { TACTICAL_CHIPS, ChipId } from "@/lib/chips";

export default function StudentPortalPage() {
  const params = useParams();
  const router = useRouter();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showClassAvg, setShowClassAvg] = useState(true);

  // 晶片裝備狀態
  const [selectedChip, setSelectedChip] = useState<ChipId>("ADVERSITY_SHATTER");
  const [equipping, setEquipping] = useState(false);

  // 自主修練答題 Modal
  const [activeQuestModal, setActiveQuestModal] = useState<"math" | "chinese" | "english" | "vocab" | null>(null);
  const [questAnswers, setQuestAnswers] = useState<Record<string, string>>({});
  const [submittingQuest, setSubmittingQuest] = useState(false);

  // 對戰 Modal
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function loadPortalData() {
    if (!studentNumber) return;
    try {
      const res = await fetch(`/api/portal/${studentNumber}`, { cache: "no-store" });
      if (!res.ok) throw new Error("無法取得資料");
      const json = await res.json();
      setData(json);
      if (json.equippedChip) {
        setSelectedChip(json.equippedChip);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortalData();
  }, [studentNumber]);

  // 裝備晶片
  async function handleEquipChip(chipId: ChipId) {
    if (!data) return;
    setEquipping(true);
    try {
      const res = await fetch(`/api/portal/${studentNumber}/loadout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equippedChip: chipId }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "裝備失敗");
        return;
      }
      setSelectedChip(chipId);
      setToastMessage(`✔ 已裝備【${TACTICAL_CHIPS[chipId].name}】核心晶片！`);
      setTimeout(() => setToastMessage(null), 4000);
      loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setEquipping(false);
    }
  }

  // 提交自主修練答案
  async function handleSubmitQuest(category: "math" | "chinese" | "english" | "vocab") {
    if (!data) return;
    setSubmittingQuest(true);
    try {
      const catUpper = category.toUpperCase();
      const res = await fetch(`/api/portal/${studentNumber}/quest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catUpper, answers: questAnswers }),
      });
      const result = await res.json();
      if (result.passed) {
        setToastMessage("🎉 勤勉達標！【逆境破甲】晶片已解鎖！");
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(result.message || "未達 60% 門檻，可翻書再次作答！");
      }
      setActiveQuestModal(null);
      setQuestAnswers({});
      loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuest(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-semibold text-xs">正在載入親師生透明看板...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">查無學號「{studentNumber}」</h2>
          <Link
            href="/"
            className="inline-block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs"
          >
            返回首頁重新輸入
          </Link>
        </div>
      </div>
    );
  }

  const {
    student,
    currentWeek,
    homework,
    examScore,
    stats,
    chartData,
    quests,
    chips,
    match,
  } = data;

  const isHomeworkDone = homework?.status === "COMPLETED";
  const avgScore = examScore?.averageScore ?? 75;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans">
      {/* 浮動提示 Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-300 font-bold px-5 py-2.5 rounded-full shadow-2xl border border-amber-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 頂部導航列 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
              學力推演看板
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 hidden sm:inline">第 {currentWeek.weekNumber} 週 • {currentWeek.title}</span>
            <Link href="/" className="text-indigo-600 hover:underline font-medium">
              切換學號
            </Link>
          </div>
        </div>
      </header>

      {/* 主面板容器 (直式 RWD，適配手機 LINE) */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* ========================================================= */}
        {/* 1. 頂部資訊列                                             */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* 標準男女像素冒險者 Sprite (無更衣室入口) */}
            <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
              <PixelFighterSprite gender={student.gender} action="idle" size={60} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{student.name}</h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-xs font-bold rounded">
                  {student.studentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                第 {currentWeek.weekNumber} 週 • 歷史戰績：
                <strong className="text-slate-800">{stats.wins}勝 {stats.losses}敗 {stats.draws}平</strong>（勝率 {stats.winRate}%）
              </p>
            </div>
          </div>

          {/* 橫向三狀態標籤 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* 作業狀態 */}
            <div
              className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 ${
                isHomeworkDone
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {isHomeworkDone ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✅ 已準時繳交</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>⚠️ 待補交：{homework?.missingScope || "作業有缺漏"}</span>
                </>
              )}
            </div>

            {/* 週考三科平均 */}
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 font-medium">週考三科平均：</span>
              <strong className="text-slate-900 font-mono ml-1">{avgScore} 分</strong>
              <span className="text-[11px] text-slate-400 ml-1 font-mono">
                (國 {examScore?.chineseScore ?? "-"} / 英 {examScore?.englishScore ?? "-"} / 數 {examScore?.mathScore ?? "-"})
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. 區塊一：【學期成長趨勢分析】（家長核心）               */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">學期成長趨勢分析</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">國文、英文、數學歷次週考折線與班級平均比較</p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showClassAvg}
                onChange={(e) => setShowClassAvg(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>顯示班級平均線（灰色虛線）</span>
            </label>
          </div>

          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="weekNumber" tickFormatter={(val) => `第${val}週`} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} 分`, name]}
                  labelFormatter={(val) => `第 ${val} 週紀錄`}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                <Line type="monotone" dataKey="chinese" name="國文" stroke="#2563EB" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="english" name="英文" stroke="#EA580C" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="math" name="數學" stroke="#DC2626" strokeWidth={2.2} dot={{ r: 3 }} />
                {showClassAvg && (
                  <Line type="monotone" dataKey="classAverage" name="全班平均" stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="5 5" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 近 5 週作業繳交歷程 (時間軸條列) */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>近 5 週作業繳交歷程：</span>
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {chartData.slice(-5).map((w: any) => {
                const isComp = w.homeworkStatus === "COMPLETED";
                const isPart = w.homeworkStatus === "PARTIAL";
                const dotColor = isComp ? "bg-emerald-500" : isPart ? "bg-amber-400" : "bg-rose-500";
                const text = isComp ? "已完成" : isPart ? "待訂正" : "缺交";
                return (
                  <div key={w.weekNumber} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                    <span className="font-mono text-slate-600">第{w.weekNumber}週</span>
                    <span className="text-[11px] text-slate-400">({text})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. 區塊二：【本週戰力因果三格圖解】（學生一眼看懂）       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className={`p-4 rounded-xl border ${isHomeworkDone ? "bg-emerald-50/50 border-emerald-300" : "bg-white border-slate-200"}`}>
            <div className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1">
              <span>📝 作業準時完成</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              開局自帶<strong>護盾（減傷 15%）</strong>與 1 顆氣量，防止開場被壓制。
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${quests.hasUnlockedChip ? "bg-amber-50/50 border-amber-300" : "bg-white border-slate-200"}`}>
            <div className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1">
              <span>📖 自主修練達標</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              開卷完成任一修練題目，解鎖<strong>【逆境破甲】</strong>晶片（傷害 +35% 逆轉翻盤）。
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-white border-slate-200">
            <div className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1">
              <span>💯 週考三科平均</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              平均分數轉化為推演<strong>初始血量 ({avgScore} HP)</strong>，基礎實力堅實。
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. 區塊三：【每週自主修練道場】（學生主要操作區）         */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">每週自主修練道場（開卷翻書查答案）</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">完成任一任務即解鎖【逆境破甲】翻盤晶片！</p>
            </div>
            {quests.hasUnlockedChip && (
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-md text-xs font-bold">
                🎉 勤勉達標！
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "math", icon: "📕", title: "數學挑戰 (3題)", completed: quests.math.completed, qCount: quests.math.questions.length },
              { key: "chinese", icon: "📘", title: "國文挑戰 (3題)", completed: quests.chinese.completed, qCount: quests.chinese.questions.length },
              { key: "english", icon: "📙", title: "英文語法 (3題)", completed: quests.english.completed, qCount: quests.english.questions.length },
              { key: "vocab", icon: "🔤", title: "單字快閃 (10題)", completed: quests.vocab.completed, qCount: quests.vocab.questions.length },
            ].map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => {
                  setActiveQuestModal(q.key as any);
                  setQuestAnswers({});
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  q.completed
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-900"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div className="text-xl mb-1">{q.icon}</div>
                <div className="font-bold text-xs">{q.title}</div>
                <div className="text-[11px] mt-1 font-semibold flex items-center gap-1">
                  {q.completed ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <Check className="w-3 h-3 stroke-[3]" /> 已完成
                    </span>
                  ) : (
                    <span className="text-indigo-600">點擊作答 ➔</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. 區塊四：【本週學力推演擂台】（30 秒成果回放）         */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">本週學力推演擂台（30 秒成果回放）</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                限裝備 1 個戰術晶片，對決招式與勝負將直接錨定本週學習成果
              </p>
            </div>

            {match && (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                對手：{match.player1?.studentNumber === student.studentNumber ? match.player2?.name : match.player1?.name}
              </span>
            )}
          </div>

          {/* 晶片選擇器 (1/1) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">
              裝備戰術晶片 (1/1)：目前裝備【{TACTICAL_CHIPS[selectedChip]?.name}】
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {chips.map((c: any) => {
                const isSelected = selectedChip === c.id;
                const isUnlocked = c.unlocked;

                return (
                  <div
                    key={c.id}
                    onClick={() => isUnlocked && handleEquipChip(c.id)}
                    className={`p-3 rounded-xl border text-xs transition-all relative ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/50 shadow-xs cursor-pointer"
                        : isUnlocked
                        ? "bg-white hover:bg-slate-50 border-slate-200 cursor-pointer"
                        : "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isUnlocked ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"
                      }`}>
                        {c.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight">{c.effectDesc}</p>
                    {!isUnlocked && (
                      <p className="text-[10px] text-rose-600 mt-1 font-mono">🔒 {c.lockReason}</p>
                    )}
                    {isSelected && (
                      <div className="mt-2 text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> 已裝備至本週推演
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 啟動推演按鈕 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              推演為純被動 30 秒動畫回放，支援右上角「⏩ 跳過動畫」直接查看結算因果卡。
            </p>
            <button
              type="button"
              onClick={() => setShowBattleModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider rounded-xl shadow-md shadow-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>▶ 觀看本週 30 秒推演成果</span>
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 自主修練答題 Modal                                         */}
      {/* ========================================================= */}
      {activeQuestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>📖 自主修練（開卷翻書挑戰）</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveQuestModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                關閉
              </button>
            </div>

            <div className="space-y-4">
              {quests[activeQuestModal].questions.map((q: any, qIdx: number) => (
                <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-slate-800">
                    第 {qIdx + 1} 題：{q.questionText}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt: string) => {
                      const isChecked = questAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setQuestAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`w-full text-left p-2 rounded-lg border transition-all text-xs flex items-center justify-between ${
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{opt}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveQuestModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submittingQuest || Object.keys(questAnswers).length === 0}
                onClick={() => handleSubmitQuest(activeQuestModal)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50"
              >
                {submittingQuest ? "批改中..." : "確認提交答案"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 30 秒推演成果播放 Modal                                   */}
      {/* ========================================================= */}
      {showBattleModal && match && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl">
            <BattleArenaPlayer
              battleLog={match.battleLog}
              currentStudentNumber={student.studentNumber}
              onClose={() => setShowBattleModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
