"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Check,
  AlertTriangle,
  Play,
  CheckCircle,
  Calendar,
  Layers,
  BarChart3,
  Swords,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
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

  // 三大核心功能按鈕分頁：
  // 1. prep: 🎯 挑戰與晶片備戰室 (預設頁，自主修練與晶片同頁)
  // 2. analytics: 📊 歷次學力分析 (點擊才展開成績折線圖，不預設干擾)
  // 3. arena: ⚔️ 本週推演結算 (最右邊，看對戰結果按鈕放在最下方)
  const [activeTab, setActiveTab] = useState<"prep" | "analytics" | "arena">("prep");

  // 科目切換狀態：TOTAL (三科總分), CHINESE (國文), ENGLISH (英文), MATH (數學)
  const [selectedSubject, setSelectedSubject] = useState<"TOTAL" | "CHINESE" | "ENGLISH" | "MATH">("TOTAL");

  // 晶片裝備狀態
  const [selectedChip, setSelectedChip] = useState<ChipId>("ADVERSITY_SHATTER");

  // 自主修練答題 Modal
  const [activeQuestModal, setActiveQuestModal] = useState<"math" | "chinese" | "english" | "vocab" | null>(null);
  const [questAnswers, setQuestAnswers] = useState<Record<string, string>>({});
  const [submittingQuest, setSubmittingQuest] = useState(false);

  // 展開/播放對戰播放器狀態
  const [showArenaPlayer, setShowArenaPlayer] = useState(false);
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

  // 裝備晶片：樂觀更新（Optimistic Update），瞬間切換零卡頓
  async function handleEquipChip(chipId: ChipId) {
    if (!data) return;
    const oldChip = selectedChip;
    setSelectedChip(chipId);
    setToastMessage(`✔ 已裝備【${TACTICAL_CHIPS[chipId]?.name || chipId}】核心晶片！`);
    setTimeout(() => setToastMessage(null), 3000);

    try {
      const res = await fetch(`/api/portal/${studentNumber}/loadout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equippedChip: chipId }),
      });
      const result = await res.json();
      if (!res.ok) {
        // 失敗才回滾
        setSelectedChip(oldChip);
        alert(result.error || "裝備失敗");
      }
    } catch (err) {
      console.error(err);
      setSelectedChip(oldChip);
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-semibold text-xs">正在載入學習數據與備戰室...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
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
  const mathScore = examScore?.mathScore ?? 0;
  const chineseScore = examScore?.chineseScore ?? 0;
  const englishScore = examScore?.englishScore ?? 0;
  const prevAvg = examScore?.previousAverage ?? 75;
  const avgDiff = Math.round((avgScore - prevAvg) * 10) / 10;

  // 計算每個晶片的解鎖進度與差距幅度
  function getChipProgress(chipId: string) {
    switch (chipId) {
      case "MATH_VOID": {
        const percent = Math.min(100, Math.round((mathScore / 85) * 100));
        const diff = Math.max(0, 85 - mathScore);
        const unlocked = mathScore >= 85;
        const text = unlocked
          ? `✔ 已達標 (目前 ${mathScore} 分)`
          : `數學目前 ${mathScore} 分，還差 ${diff} 分達標`;
        return { percent, text, unlocked };
      }
      case "CHINESE_INK": {
        const percent = Math.min(100, Math.round((chineseScore / 85) * 100));
        const diff = Math.max(0, 85 - chineseScore);
        const unlocked = chineseScore >= 85;
        const text = unlocked
          ? `✔ 已達標 (目前 ${chineseScore} 分)`
          : `國文目前 ${chineseScore} 分，還差 ${diff} 分達標`;
        return { percent, text, unlocked };
      }
      case "ENGLISH_STORM": {
        const percent = Math.min(100, Math.round((englishScore / 85) * 100));
        const diff = Math.max(0, 85 - englishScore);
        const unlocked = englishScore >= 85;
        const text = unlocked
          ? `✔ 已達標 (目前 ${englishScore} 分)`
          : `英文目前 ${englishScore} 分，還差 ${diff} 分達標`;
        return { percent, text, unlocked };
      }
      case "ADVERSITY_SHATTER": {
        const unlocked = quests?.hasUnlockedChip ?? false;
        const percent = unlocked ? 100 : 0;
        const text = unlocked
          ? "✔ 自主練習已達標解鎖"
          : "完成上方任一自主挑戰即可立即解鎖";
        return { percent, text, unlocked };
      }
      case "GUARDIAN_BASTION": {
        const unlocked = isHomeworkDone;
        const percent = unlocked ? 100 : 0;
        const text = unlocked
          ? "✔ 作業準時完成已解鎖"
          : "本週作業未達標 (需按時繳交解鎖)";
        return { percent, text, unlocked };
      }
      case "SELF_TRANSCENDENCE": {
        const unlocked = avgDiff > 0;
        const percent = unlocked
          ? 100
          : Math.min(99, Math.round((avgScore / Math.max(1, prevAvg)) * 100));
        const text = unlocked
          ? `✔ 突破成功 (本週均分 +${avgDiff} 分)`
          : `本週平均 ${avgScore} 分，還差 ${Math.abs(avgDiff)} 分超越上週 (${prevAvg} 分)`;
        return { percent, text, unlocked };
      }
      default:
        return { percent: 100, text: "基礎解鎖", unlocked: true };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* 浮動提示 Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-300 font-bold px-5 py-2.5 rounded-full shadow-2xl border border-amber-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 主面板容器 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ========================================================= */}
        {/* 1. 頂部：學生個人資訊卡片（無重複標題，簡潔俐落）          */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 標準像素 Sprite */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
              <PixelFighterSprite gender={student.gender} action="idle" size={60} />
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
        {/* 2. 三大核心按鈕切換（不預設在成績曲線，本週結算在最右邊）    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 按鈕 1：歷次學力分析 */}
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === "analytics" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">📊 歷次學力分析</div>
                <div className={`text-xs mt-0.5 ${activeTab === "analytics" ? "text-indigo-100" : "text-slate-400"}`}>
                  折線圖趨勢與近5週歷程
                </div>
              </div>
            </div>
            {activeTab === "analytics" && <Check className="w-4 h-4 text-white" />}
          </button>

          {/* 按鈕 2：挑戰與晶片備戰室 (備戰區同一頁) */}
          <button
            type="button"
            onClick={() => setActiveTab("prep")}
            className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "prep"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === "prep" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"}`}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>🎯 挑戰與晶片備戰室</span>
                  {quests?.hasUnlockedChip && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className={`text-xs mt-0.5 ${activeTab === "prep" ? "text-indigo-100" : "text-slate-400"}`}>
                  自主修練 + 戰術晶片庫
                </div>
              </div>
            </div>
            {activeTab === "prep" && <Check className="w-4 h-4 text-white" />}
          </button>

          {/* 按鈕 3：本週推演結算 (放在最右邊) */}
          <button
            type="button"
            onClick={() => setActiveTab("arena")}
            className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "arena"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === "arena" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-600"}`}>
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">⚔️ 本週推演結算</div>
                <div className={`text-xs mt-0.5 ${activeTab === "arena" ? "text-indigo-100" : "text-slate-400"}`}>
                  配對對決與因果分析
                </div>
              </div>
            </div>
            {activeTab === "arena" && <Check className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* ========================================================= */}
        {/* 頁面內容區塊 1：【🎯 挑戰與晶片備戰室】(自主修練與選晶片同頁)*/}
        {/* ========================================================= */}
        {activeTab === "prep" && (
          <div className="space-y-6">
            {/* 上半部：每週自主修練道場（4 個任務） */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      自主修練任務（開卷翻書挑戰）
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    開卷翻書作答，任一任務答對率達 60% 即可解鎖翻盤核心【逆境破甲焰】晶片！
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

              {/* 4 個任務卡片 */}
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

            {/* 下半部：戰術晶片裝備庫（附精確進度條，顯示離解鎖差多少幅度） */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>戰術晶片裝備庫 (1/1)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    每週限裝備 1 枚核心晶片，戰鬥 Round 3 大招將釋放專屬奧義動畫與加成
                  </p>
                </div>
                <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  目前裝備：{TACTICAL_CHIPS[selectedChip]?.name || "無"}
                </div>
              </div>

              {/* 6 大晶片卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {chips.map((c: any) => {
                  const isSelected = selectedChip === c.id;
                  const progress = getChipProgress(c.id);
                  const isUnlocked = progress.unlocked;

                  return (
                    <div
                      key={c.id}
                      onClick={() => isUnlocked && handleEquipChip(c.id)}
                      className={`p-4 rounded-2xl border text-xs transition-all relative flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400/50 shadow-sm cursor-pointer"
                          : isUnlocked
                          ? "bg-white hover:bg-slate-50 border-slate-200 cursor-pointer hover:shadow-xs"
                          : "bg-slate-100/70 border-slate-200 opacity-70 cursor-not-allowed"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* 標題與軌道標籤 */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                            <span className="text-lg">{c.icon}</span>
                            <span>{c.name}</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isUnlocked
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isUnlocked ? "已解鎖" : "未解鎖"}
                          </span>
                        </div>

                        {/* 晶片機制解說 */}
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {c.effectDesc}
                        </p>
                      </div>

                      {/* 解鎖進度條與幅度說明 */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className={isUnlocked ? "text-emerald-700 font-bold" : "text-slate-600"}>
                            {progress.text}
                          </span>
                          <span className="font-mono text-slate-400">
                            {progress.percent}%
                          </span>
                        </div>

                        {/* 進度條容器 */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isUnlocked
                                ? "bg-emerald-500"
                                : progress.percent >= 80
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>

                        {/* 裝備按鈕 / 狀態標籤 */}
                        <div className="pt-1 flex items-center justify-between">
                          {isSelected ? (
                            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> 已裝備至本週推演
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                              點擊立即裝備
                            </span>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-medium">
                              🔒 尚未達成條件
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 頁面內容區塊 2：【📊 歷次學力分析】(折線圖與近5週歷程)      */}
        {/* ========================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
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
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
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
          </div>
        )}

        {/* ========================================================= */}
        {/* 頁面內容區塊 3：【⚔️ 本週推演結算】(最右邊，看對戰結果放最下面)*/}
        {/* ========================================================= */}
        {activeTab === "arena" && (
          <div className="space-y-6">
            {/* 1. 本週對決雙方卡片 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-rose-600" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    第 {currentWeek.weekNumber} 週 • 學力推演對陣資訊
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                  {currentWeek.title}
                </span>
              </div>

              {match ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 自己 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        我方代表 ({student.studentNumber})
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {avgScore} HP
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-white border border-slate-200 rounded-lg">
                        <PixelFighterSprite gender={student.gender} action="idle" size={40} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{student.name}</div>
                        <div className="text-[11px] text-slate-500">
                          晶片：{TACTICAL_CHIPS[selectedChip]?.name || "無"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 對手 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                        對手選手 ({match.player1?.studentNumber === student.studentNumber ? match.player2?.studentNumber : match.player1?.studentNumber})
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {match.battleLog?.player2?.initialHp || match.battleLog?.player1?.initialHp || 80} HP
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-white border border-slate-200 rounded-lg">
                        <PixelFighterSprite
                          gender={
                            (match.player1?.studentNumber === student.studentNumber
                              ? match.player2?.gender
                              : match.player1?.gender) || "BOY"
                          }
                          action="idle"
                          size={40}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {match.player1?.studentNumber === student.studentNumber ? match.player2?.name : match.player1?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          晶片：{match.battleLog?.player2?.chipName || "守護壁壘"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-600">本週尚未排定對決</p>
                  <p className="text-slate-400 text-[11px] mt-1">老師匯入成績後將自動生成對戰推演。</p>
                </div>
              )}
            </div>

            {/* 2. 本週戰力因果三格圖解 */}
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
                    血量直接錨定卷面成績（國 {chineseScore}、英 {englishScore}、數 {mathScore}）。
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

            {/* 3. 最下方的【觀看本週對戰結果】醒目大按鈕與展開播放器 */}
            {match && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowArenaPlayer(!showArenaPlayer)}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wide rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    {showArenaPlayer
                      ? "收合 30 秒推演重播"
                      : "▶ 觀看本週 30 秒學力推演結果"}
                  </span>
                  {showArenaPlayer ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {/* 展開之推演播放器 */}
                {showArenaPlayer && (
                  <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <BattleArenaPlayer
                      battleLog={match.battleLog}
                      currentStudentNumber={student.studentNumber}
                      autoStart={true}
                    />
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
}
