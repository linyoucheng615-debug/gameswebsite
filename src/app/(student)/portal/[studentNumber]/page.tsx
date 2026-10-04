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
  BarChart3,
  Swords,
  Target,
  GraduationCap,
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

  // 分頁狀態：analytics (學力數據), arena (推演擂台), quests (自主修練)
  const [activeTab, setActiveTab] = useState<"analytics" | "arena" | "quests">("analytics");

  // 科目切換狀態：TOTAL (三科總分), CHINESE (國文), ENGLISH (英文), MATH (數學)
  const [selectedSubject, setSelectedSubject] = useState<"TOTAL" | "CHINESE" | "ENGLISH" | "MATH">("TOTAL");

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
        <p className="text-slate-600 font-semibold text-xs">正在載入週考成績平台...</p>
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
  const totalScore = Math.round(((examScore?.chineseScore ?? 0) + (examScore?.englishScore ?? 0) + (examScore?.mathScore ?? 0)) * 10) / 10;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* 浮動提示 Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-300 font-bold px-5 py-2.5 rounded-full shadow-2xl border border-amber-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 頂部導航列 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                週考成績平台
              </span>
              <span className="text-[11px] text-slate-500 font-sans hidden sm:inline ml-2">
                國英數學力儀表板
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 hidden sm:inline font-medium">第 {currentWeek.weekNumber} 週 • {currentWeek.title}</span>
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
              切換學號
            </Link>
          </div>
        </div>
      </header>

      {/* 主面板容器 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ========================================================= */}
        {/* 1. 常駐頂部：學生個人卡片                                   */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 標準像素 Sprite */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
              <PixelFighterSprite gender={student.gender} action="idle" size={64} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{student.name}</h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded border border-indigo-200">
                  {student.studentNumber}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {student.gender === "GIRL" ? "女同學" : "男同學"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                第 {currentWeek.weekNumber} 週 • 歷史戰績：
                <strong className="text-slate-800 ml-1">{stats.wins} 勝 {stats.losses} 敗 {stats.draws} 平</strong>
                <span className="text-slate-400 ml-1">（勝率 {stats.winRate}%）</span>
              </p>
            </div>
          </div>

          {/* 橫向雙指標標籤 */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* 作業狀態 */}
            <div
              className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-2 ${
                isHomeworkDone
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {isHomeworkDone ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>作業準時完成 (+10 護盾)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>待補交：{homework?.missingScope || "作業缺漏 (無護盾)"}</span>
                </>
              )}
            </div>

            {/* 週考總分與平均 */}
            <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] text-slate-500 font-medium">
                本週三科總分：<strong className="text-slate-900 font-mono text-sm">{totalScore} 分</strong>
                <span className="text-slate-400 ml-1">（平均 {avgScore} 分）</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                國 {examScore?.chineseScore ?? "-"} / 英 {examScore?.englishScore ?? "-"} / 數 {examScore?.mathScore ?? "-"}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. 核心分頁導航 (Tabs Navigation)                          */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 學力數據與成績走勢</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("arena")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "arena"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>⚔️ 本週推演擂台</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quests")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "quests"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>🎯 每週自主修練</span>
            {quests?.hasUnlockedChip && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* 分頁 1：【學力數據與成績走勢】                             */}
        {/* ========================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* 折線圖主卡片 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      學期成績趨勢與班級平均比較
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    點選下方科目切換「三科總分」或個別單科折線圖
                  </p>
                </div>

                {/* 科目切換藥丸 */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "TOTAL", label: "三科總分" },
                    { id: "CHINESE", label: "國文" },
                    { id: "ENGLISH", label: "英文" },
                    { id: "MATH", label: "數學" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubject(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSubject === sub.id
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 顯示當前折線圖說明標籤 */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-700">
                  {selectedSubject === "TOTAL" && "📌 目前檢視：三科總分趨勢（滿分 300 分）vs 全班總分平均"}
                  {selectedSubject === "CHINESE" && "📌 目前檢視：國文科成績趨勢（滿分 100 分）vs 全班國文平均"}
                  {selectedSubject === "ENGLISH" && "📌 目前檢視：英文科成績趨勢（滿分 100 分）vs 全班英文平均"}
                  {selectedSubject === "MATH" && "📌 目前檢視：數學科成績趨勢（滿分 100 分）vs 全班數學平均"}
                </span>
                <span className="text-[11px] text-slate-400">
                  虛線為全班平均線
                </span>
              </div>

              {/* Recharts 動態折線圖 */}
              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="weekNumber"
                      tickFormatter={(val) => `第${val}週`}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      domain={selectedSubject === "TOTAL" ? [100, 300] : [40, 100]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} 分`, name]}
                      labelFormatter={(val) => `第 ${val} 週紀錄`}
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />

                    {/* 三科總分模式 */}
                    {selectedSubject === "TOTAL" && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="學生三科總分"
                          stroke="#4F46E5"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#4F46E5" }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalClassAvg"
                          name="全班總分平均"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </>
                    )}

                    {/* 國文科模式 */}
                    {selectedSubject === "CHINESE" && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="chinese"
                          name="國文成績"
                          stroke="#2563EB"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#2563EB" }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="chineseClassAvg"
                          name="全班國文平均"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </>
                    )}

                    {/* 英文科模式 */}
                    {selectedSubject === "ENGLISH" && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="english"
                          name="英文成績"
                          stroke="#EA580C"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#EA580C" }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="englishClassAvg"
                          name="全班英文平均"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </>
                    )}

                    {/* 數學科模式 */}
                    {selectedSubject === "MATH" && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="math"
                          name="數學成績"
                          stroke="#DC2626"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#DC2626" }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="mathClassAvg"
                          name="全班數學平均"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 近 5 週作業繳交歷程 (時間軸條列) */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>近 5 週作業繳交歷程：</span>
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {chartData.slice(-5).map((w: any) => {
                    const isComp = w.homeworkStatus === "COMPLETED";
                    const isPart = w.homeworkStatus === "PARTIAL";

                    return (
                      <div
                        key={w.weekNumber}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                          isComp
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : isPart
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        <span>第{w.weekNumber}週</span>
                        <span>{isComp ? "✔ 準時" : isPart ? "⚠️ 待訂正" : "✕ 缺交"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 本週戰力因果三格圖解 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>本週學力與戰力因果結構圖解</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  推演結果由「週考成績」、「作業紀律」與「自主練習」三者客觀決定，絕無隨機抽卡
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. 週考平均分 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">基礎血量來源</span>
                    <span className="text-xs font-mono font-bold text-indigo-600">{avgScore} HP</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">週考三科平均分</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    血量直接錨定卷面成績（國 {examScore?.chineseScore ?? "-"}、英 {examScore?.englishScore ?? "-"}、數 {examScore?.mathScore ?? "-"}）。
                  </p>
                </div>

                {/* 2. 作業護盾加成 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">防禦護盾機制</span>
                    <span className={`text-xs font-mono font-bold ${isHomeworkDone ? "text-emerald-600" : "text-slate-400"}`}>
                      {isHomeworkDone ? "減免 15%" : "+0%"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">按時繳交作業</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isHomeworkDone
                      ? "本週作業準時繳交，推演第二回合自動啟用金色能量護盾，吸收 15% 傷害！"
                      : "本週作業缺漏或待補交，無護盾庇護，防禦力降低。"}
                  </p>
                </div>

                {/* 3. 自主修練晶片 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">大招奧義機制</span>
                    <span className="text-xs font-mono font-bold text-amber-600">
                      {quests?.hasUnlockedChip ? "已解鎖" : "未解鎖"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">自主練習核心晶片</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    完成自主修練道場任務或單科達 85 分，解鎖專屬大招晶片，支援逆境反殺。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 分頁 2：【本週推演擂台】                                   */}
        {/* ========================================================= */}
        {activeTab === "arena" && (
          <div className="space-y-6">
            {/* 本週對戰資訊與推演啟動卡 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      第 {currentWeek.weekNumber} 週 • 學力推演對決
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    系統依照全班週考平均成績進行實力相近配對，模擬 3 回合推演過程
                  </p>
                </div>

                {match && (
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    本週對手：{match.player1?.studentNumber === student.studentNumber ? match.player2?.name : match.player1?.name}
                  </span>
                )}
              </div>

              {/* 嵌入式 30 秒推演擂台播放器 */}
              {match ? (
                <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-md">
                  <BattleArenaPlayer
                    battleLog={match.battleLog}
                    currentStudentNumber={student.studentNumber}
                    autoStart={false}
                  />
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <Swords className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">本週尚未完成配對結算</p>
                  <p className="text-slate-400 text-[11px]">老師在後台匯入成績後，將自動生成 30 秒推演對決。</p>
                </div>
              )}
            </div>

            {/* 雙軌戰術晶片選擇器 (1/1) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>戰術晶片裝備庫 (1/1)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    每週限裝備 1 枚核心晶片，戰鬥 Round 3 大招將釋放專屬奧義機制與動畫
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  目前裝備：{TACTICAL_CHIPS[selectedChip]?.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {chips.map((c: any) => {
                  const isSelected = selectedChip === c.id;
                  const isUnlocked = c.unlocked;

                  return (
                    <div
                      key={c.id}
                      onClick={() => isUnlocked && handleEquipChip(c.id)}
                      className={`p-3.5 rounded-xl border text-xs transition-all relative ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-400/50 shadow-xs cursor-pointer"
                          : isUnlocked
                          ? "bg-white hover:bg-slate-50 border-slate-200 cursor-pointer"
                          : "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                          <span>{c.icon}</span>
                          <span>{c.name}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isUnlocked ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"
                        }`}>
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{c.effectDesc}</p>
                      {!isUnlocked && (
                        <p className="text-[11px] text-rose-600 mt-1.5 font-medium">🔒 {c.lockReason}</p>
                      )}
                      {isSelected && (
                        <div className="mt-2.5 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> 已裝備至本週推演
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 分頁 3：【每週自主修練】                                   */}
        {/* ========================================================= */}
        {activeTab === "quests" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      每週自主修練道場（開卷翻書挑戰）
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    開卷翻書答題，任一任務答對率達 60% 即可解鎖翻盤核心【逆境破甲焰】晶片！
                  </p>
                </div>

                {quests?.hasUnlockedChip ? (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>🎉 勤勉達標！翻盤晶片已解鎖</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold">
                    完成任一科即可解鎖晶片
                  </span>
                )}
              </div>

              {/* 4 個任務大卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "math", icon: "🧮", title: "數學精熟道場", sub: "3 題錯題挑戰", completed: quests.math.completed, qCount: quests.math.questions.length },
                  { key: "chinese", icon: "📜", title: "國文語感秘卷", sub: "3 題錯題挑戰", completed: quests.chinese.completed, qCount: quests.chinese.questions.length },
                  { key: "english", icon: "🔤", title: "英文句型修煉", sub: "3 題錯題挑戰", completed: quests.english.completed, qCount: quests.english.questions.length },
                  { key: "vocab", icon: "📖", title: "小六單字快閃", sub: "10 題 4 選 1 測驗", completed: quests.vocab.completed, qCount: quests.vocab.questions.length },
                ].map((q) => (
                  <div
                    key={q.key}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      q.completed
                        ? "bg-emerald-50/70 border-emerald-300"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-2xl">{q.icon}</div>
                      <h4 className="font-bold text-slate-900 text-sm">{q.title}</h4>
                      <p className="text-xs text-slate-500">{q.sub}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuestModal(q.key as any);
                        setQuestAnswers({});
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        q.completed
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      }`}
                    >
                      {q.completed ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>已通過 (可重做)</span>
                        </>
                      ) : (
                        <>
                          <span>開始作答</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 自主修練答題 Modal                                         */}
      {/* ========================================================= */}
      {activeQuestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>📖 自主修練作答室（開卷挑戰）</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveQuestModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                關閉
              </button>
            </div>

            <div className="space-y-4">
              {quests[activeQuestModal].questions.map((q: any, qIdx: number) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <p className="font-bold text-slate-800 text-sm leading-relaxed">
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
                          className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{opt}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 ml-2 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveQuestModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submittingQuest || Object.keys(questAnswers).length === 0}
                onClick={() => handleSubmitQuest(activeQuestModal)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submittingQuest ? "批改中..." : "確認提交答案"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 獨立彈窗播放器 Modal (備用) */}
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
