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
  Swords,
  Flame,
  ArrowRight,
  BookOpen,
  Calendar,
  Zap,
  Award,
  Layers,
  Check,
  AlertTriangle,
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
import PixelFighterSprite, {
  SkinGender,
  SkinClass,
  SkinColor,
} from "@/components/PixelFighterSprite";
import BattleArenaPlayer from "@/components/BattleArenaPlayer";
import { PortalData } from "@/types";

export default function StudentPortalPage() {
  const params = useParams();
  const router = useRouter();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [showClassAvg, setShowClassAvg] = useState(true);
  const [selectedChallengeAnswers, setSelectedChallengeAnswers] = useState<Record<string, string>>({});
  const [answeringMap, setAnsweringMap] = useState<Record<string, boolean>>({});
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 載入看板資料
  async function loadPortalData() {
    if (!studentNumber) return;
    try {
      const res = await fetch(`/api/portal/${studentNumber}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("無法取得學生看板資料");
      }
      const json = await res.json();
      setData(json);

      // 初始化已作答紀錄
      if (json.challenges) {
        const initialAnswers: Record<string, string> = {};
        for (const ch of json.challenges) {
          if (ch.userAnswer) {
            // 已有作答紀錄
          }
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortalData();
  }, [studentNumber]);

  // 提交錯題挑戰作答
  async function handleOptionSelect(challengeId: string, option: string) {
    if (!data) return;
    setSelectedChallengeAnswers((prev) => ({ ...prev, [challengeId]: option }));
    setAnsweringMap((prev) => ({ ...prev, [challengeId]: true }));

    try {
      const res = await fetch(`/api/portal/${studentNumber}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, selectedOption: option }),
      });
      const result = await res.json();

      if (res.ok) {
        // 更新本地 challenges 狀態
        setData((prev) => {
          if (!prev) return null;
          const updatedChallenges = prev.challenges.map((ch) => {
            if (ch.id === challengeId) {
              return {
                ...ch,
                userAnswer: { isCorrect: result.isCorrect },
                explanation: result.explanation,
              };
            }
            return ch;
          });

          const allCorrect = result.allChallengesCorrect;
          if (allCorrect) {
            setToastMessage("🔥 太棒了！3 題作業錯題挑戰全部答對！已解鎖本週對決逆轉奧義！");
            setTimeout(() => setToastMessage(null), 5000);
          }

          return {
            ...prev,
            challenges: updatedChallenges,
            allChallengesCorrect: allCorrect,
            hasUltimate: allCorrect || prev.hasUltimate,
          };
        });
      }
    } catch (err) {
      console.error("提交題目錯誤:", err);
    } finally {
      setAnsweringMap((prev) => ({ ...prev, [challengeId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm">正在載入親師生整合看板...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-800 mb-2">查無學號「{studentNumber}」</h2>
          <p className="text-xs text-slate-500 mb-6">請確認學號輸入是否正確（如 S101）。</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors"
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
    currentHomework,
    currentScore,
    stats,
    chartData,
    challenges,
    allChallengesCorrect,
    hasUltimate,
    ultimateReason,
    match,
  } = data;

  const isHomeworkDone = currentHomework?.hasBuff ?? true;
  const avgScore = currentScore?.averageScore || currentScore?.rawScore || 75;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* 提示 Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold px-6 py-3 rounded-full shadow-2xl border border-amber-300 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 fill-current" />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* 頂部導航列 (家長與學生清晰資訊列) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl">⚔️</span>
              <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                數學戰力擂台
              </span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              親師生透明整合看板
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/student/${student.studentNumber}/character`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200"
            >
              <span>🧙‍♂️ 角色更衣室</span>
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              切換學號
            </Link>
          </div>
        </div>
      </header>

      {/* 主版面容器 */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ========================================================= */}
        {/* 【頂部：個人與本週概況卡片】                                */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* 左側：學生頭像與基本資訊 */}
          <div className="flex items-center gap-4">
            <Link
              href={`/student/${student.studentNumber}/character`}
              title="點擊前往角色更衣室自訂外觀"
              className="relative p-2 bg-gradient-to-br from-indigo-50 to-slate-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl shadow-inner transition-transform hover:scale-105 group"
            >
              <PixelFighterSprite
                gender={(student.skinGender as SkinGender) || "boy"}
                charClass={(student.skinClass as SkinClass) || "warrior"}
                color={(student.skinColor as SkinColor) || "blue"}
                action="idle"
                size={72}
              />
              <span className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm group-hover:bg-indigo-700">
                換裝
              </span>
            </Link>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-xs font-bold rounded border border-slate-200">
                  {student.studentNumber}
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-bold rounded border border-amber-200">
                  第 {currentWeek.weekNumber} 週 • {currentWeek.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>
                  戰績：<strong className="text-slate-800">{stats.wins}勝 {stats.losses}敗 {stats.draws}平</strong>（勝率 {stats.winRate}%）
                </span>
              </p>
            </div>
          </div>

          {/* 右側：狀態徽章與三科成績 */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* 作業狀態徽章 */}
            <div
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border flex items-center gap-2 ${
                isHomeworkDone
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {isHomeworkDone ? (
                <>
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-[11px] font-bold">🛡️ 作業已準時完成</div>
                    <div className="text-[10px] text-emerald-600 font-medium">開局 +1 氣量 & +10 戰力</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <div>
                    <div className="text-[11px] font-bold">⚠️ 作業缺交</div>
                    <div className="text-[10px] text-rose-600 font-medium">無護盾 (損失 10 戰力)</div>
                  </div>
                </>
              )}
            </div>

            {/* 本週三科成績徽章 */}
            <div className="flex-1 sm:flex-initial px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] font-bold text-slate-500">週考三科平均</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-slate-900 font-mono">{avgScore}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  (國 {currentScore?.chineseScore ?? "-"} / 英 {currentScore?.englishScore ?? "-"} / 數 {currentScore?.mathScore ?? "-"})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 【區塊二：學習行為與戰力連動因果圖（3 張卡片）】          */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              學習態度與戰力連動機制（親師生透明準則）
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 卡片 1：按時繳交作業 */}
            <div className={`p-4 rounded-xl border transition-all ${
              isHomeworkDone ? "bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-200" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                  1
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isHomeworkDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {isHomeworkDone ? "✔ 已達成" : "未達成"}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🛡️ 按時繳交作業</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                按時完成當週作業，解鎖開局<strong>「+1 氣量槽」</strong>與<strong>「+10 戰力護盾」</strong>，避免首回合被破防。
              </p>
            </div>

            {/* 卡片 2：作業 3 題錯題挑戰 */}
            <div className={`p-4 rounded-xl border transition-all ${
              allChallengesCorrect ? "bg-white border-amber-300 shadow-xs ring-1 ring-amber-200" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-black flex items-center justify-center text-sm">
                  2
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  allChallengesCorrect ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {allChallengesCorrect ? "🔥 奧義就緒" : "未完成"}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>⚡ 3 題錯題挑戰全對</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                完成每週國英數 3 題錯題精熟挑戰，解鎖<strong>「第 3 回合逆轉必殺奧義 (+15 戰力)」</strong>，擁有絕地反攻力量。
              </p>
            </div>

            {/* 卡片 3：週考三科平均 */}
            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm">
                  3
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  基礎體魄
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>❤️ 週考三科平均分數</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                三科平均成績直接決定角色的<strong>「基礎血量（HP）」</strong>（本週為 {avgScore} HP），且成績進步享有 1.5 倍戰力加乘！
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 【區塊一：學期成長趨勢折線圖（Recharts）】                 */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  學期學科成長趨勢圖
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                追蹤國文、英文、數學三科隨週次成長曲線與全班基準線
              </p>
            </div>

            {/* 全班平均切換勾選 */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showClassAvg}
                onChange={(e) => setShowClassAvg(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>顯示全班平均（灰色虛線）</span>
            </label>
          </div>

          {/* 折線圖主體 */}
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="weekNumber"
                  tickFormatter={(val) => `第 ${val} 週`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  stroke="#cbd5e1"
                />
                <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: "#64748b" }} stroke="#cbd5e1" />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} 分`, name]}
                  labelFormatter={(val) => `第 ${val} 週成績紀錄`}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="chinese"
                  name="國文"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="english"
                  name="英文"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f97316" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="math"
                  name="數學"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 6 }}
                />
                {showClassAvg && (
                  <Line
                    type="monotone"
                    dataKey="classAverage"
                    name="全班平均"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 圖表下方：最近 5 週作業繳交圓點時間軸 */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>近 5 週作業繳交時間軸：</span>
            </span>

            <div className="flex items-center gap-4 flex-wrap">
              {chartData.slice(-5).map((w) => {
                const isComp = w.homeworkStatus === "completed";
                const isPart = w.homeworkStatus === "partial";
                const dotColor = isComp ? "bg-emerald-500" : isPart ? "bg-amber-400" : "bg-rose-500";
                const textDesc = isComp ? "按時完成" : isPart ? "訂正完成" : "缺交";

                return (
                  <div key={w.weekNumber} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${dotColor} shadow-xs`} />
                    <span className="font-mono text-slate-600">第{w.weekNumber}週</span>
                    <span className="text-[11px] text-slate-500">({textDesc})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 【區塊三：作業精熟錯題挑戰修練道場（3 題錯題挑戰）】       */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  本週作業錯題挑戰道場（國英數各 1 題）
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                精選本週班級易錯觀念，3 題全數答對即可啟動對決逆轉奧義！
              </p>
            </div>

            {/* 奧義狀態指示 */}
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
              allChallengesCorrect
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}>
              <Flame className={`w-4 h-4 ${allChallengesCorrect ? "text-amber-500" : "text-slate-400"}`} />
              <span>{allChallengesCorrect ? "🔥 本週對決必殺奧義：已就緒" : "奧義未就緒 (需全對)"}</span>
            </div>
          </div>

          {/* 3 題挑戰卡片清單 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((ch, idx) => {
              const subName = ch.subject === "CHINESE" ? "國文科" : ch.subject === "ENGLISH" ? "英文科" : "數學科";
              const subBadgeColor =
                ch.subject === "CHINESE"
                  ? "bg-blue-100 text-blue-800"
                  : ch.subject === "ENGLISH"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-rose-100 text-rose-800";

              const isAnswered = !!ch.userAnswer;
              const isCorrect = ch.userAnswer?.isCorrect ?? false;
              const isAnswering = answeringMap[ch.id];

              return (
                <div
                  key={ch.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isAnswered
                      ? isCorrect
                        ? "bg-emerald-50/50 border-emerald-300"
                        : "bg-rose-50/50 border-rose-300"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${subBadgeColor}`}>
                        {subName} • 挑戰 {idx + 1}
                      </span>
                      {isAnswered && (
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          isCorrect ? "text-emerald-700" : "text-rose-700"
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{isCorrect ? "答對精熟" : "需再訂正"}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                      {ch.questionText}
                    </p>

                    {/* 4 個選項 */}
                    <div className="space-y-2 pt-1">
                      {ch.options.map((opt) => {
                        const isSelected = selectedChallengeAnswers[ch.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={isAnswered || isAnswering}
                            onClick={() => handleOptionSelect(ch.id, opt)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : isAnswered
                                ? "bg-white text-slate-600 border-slate-200 opacity-80 cursor-default"
                                : "bg-white hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 解析區塊 (作答後立即展示) */}
                  {isAnswered && ch.explanation && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 text-[11px] text-slate-600 leading-relaxed font-sans">
                      <strong className="text-slate-800">💡 題目解析：</strong>
                      {ch.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 【區塊四：學科對決競技場（35 秒對戰）】                   */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-br from-[#0c1222] via-[#101a30] to-[#070b14] border-2 border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-pixel font-bold">
              <Swords className="w-3.5 h-3.5" />
              <span>ROUND {currentWeek.weekNumber} • 35 秒街機策略戰</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              <span>⚔️ 學科對決競技場</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              三回合策略對抗：普攻試探 ➔ 學科絕技 ➔ 逆轉奧義 Super Flash！
              {match ? ` 對手為「${match.opponentName}」。` : " 本週結算對局就緒。"}
            </p>
          </div>

          {/* 進入對戰擂台按鈕 */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBattleModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base sm:text-lg tracking-wider rounded-2xl shadow-xl shadow-amber-400/20 hover:shadow-amber-400/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <span>進入本週對戰擂台</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              包含完整 35 秒戰鬥演繹與親師因果分析
            </span>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 35 秒對戰 Modal 視窗 (嵌入 BattleArenaPlayer.tsx)          */}
      {/* ========================================================= */}
      {showBattleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl">
            <BattleArenaPlayer
              data={{
                student,
                currentMatch: match,
                historyScores: chartData.map((c) => ({
                  weekNumber: c.weekNumber,
                  weekTitle: c.weekTitle,
                  rawScore: c.average,
                  effectivePower: c.average + (isHomeworkDone ? 10 : 0),
                  hasBuff: isHomeworkDone,
                })),
                stats: {
                  totalMatches: stats.wins + stats.losses + stats.draws,
                  wins: stats.wins,
                  losses: stats.losses,
                  draws: stats.draws,
                  winRate: stats.winRate,
                },
              }}
              onClose={() => setShowBattleModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
