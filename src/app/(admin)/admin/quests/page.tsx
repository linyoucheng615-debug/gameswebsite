"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Calculator,
  Languages,
  BookA,
  ScrollText,
  Copy,
} from "lucide-react";
import { AcademicWeek } from "@/types";

interface QuestionItem {
  id: string;
  weekId: string;
  category: "MATH" | "CHINESE" | "ENGLISH" | "VOCAB";
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
  createdAt: string;
}

const CATEGORY_TABS = [
  { id: "MATH", label: "🧮 數學道場", target: 3, icon: Calculator },
  { id: "CHINESE", label: "📜 國文秘卷", target: 3, icon: ScrollText },
  { id: "ENGLISH", label: "🔤 英文語感", target: 3, icon: Languages },
  { id: "VOCAB", label: "📖 單字試煉", target: 10, icon: BookA },
] as const;

export default function AdminQuestsPage() {
  const [weeks, setWeeks] = useState<AcademicWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<"MATH" | "CHINESE" | "ENGLISH" | "VOCAB">("MATH");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 單題出題表單
  const [questionText, setQuestionText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");

  // 單字批次生成表單
  const [batchVocabText, setBatchVocabText] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  async function fetchQuestions(weekId?: string) {
    setLoading(true);
    try {
      const url = weekId ? `/api/admin/quests?weekId=${weekId}` : "/api/admin/quests";
      const res = await fetch(url);
      const data = await res.json();
      if (data.weeks) {
        setWeeks(data.weeks);
        if (!selectedWeekId && data.weeks.length > 0) {
          setSelectedWeekId(data.weeks[0].id);
        }
      }
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("載入題目失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions(selectedWeekId);
  }, [selectedWeekId]);

  // 新增單一題目
  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWeekId || !questionText.trim() || !correctAnswer.trim()) {
      setErrorMsg("請完整填寫題目與正確答案");
      return;
    }

    const opts = [
      optA.trim() || "選項 A",
      optB.trim() || "選項 B",
      optC.trim() || "選項 C",
      optD.trim() || "選項 D",
    ];

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekId: selectedWeekId,
          category: activeCategory,
          questionText: questionText.trim(),
          options: opts,
          correctAnswer: correctAnswer.trim(),
          explanation: explanation.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "出題失敗");
        return;
      }

      setSuccessMsg("題目新增成功！");
      setQuestionText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setCorrectAnswer("");
      setExplanation("");

      fetchQuestions(selectedWeekId);
    } catch {
      setErrorMsg("伺服器連線異常");
    } finally {
      setSaving(false);
    }
  }

  // 刪除題目
  async function handleDeleteQuestion(id: string) {
    if (!confirm("確定要刪除此題目嗎？")) return;
    try {
      const res = await fetch(`/api/admin/quests?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setSuccessMsg("題目已刪除");
      }
    } catch {
      setErrorMsg("刪除失敗");
    }
  }

  // 批次單字匯入
  async function handleBatchVocab() {
    if (!batchVocabText.trim()) {
      setErrorMsg("請先輸入單字文字");
      return;
    }

    setBatchLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_vocab",
          weekId: selectedWeekId,
          rawText: batchVocabText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "單字批次生成失敗");
        return;
      }

      setSuccessMsg(data.message || "單字生成成功！");
      setBatchVocabText("");
      fetchQuestions(selectedWeekId);
    } catch {
      setErrorMsg("連線異常");
    } finally {
      setBatchLoading(false);
    }
  }

  function handleLoadSampleVocab() {
    const sample = `planet, 行星
galaxy, 銀河
astronaut, 太空人
telescope, 望遠鏡
satellite, 人造衛星
gravity, 地心引力
orbit, 運行軌道
comet, 彗星
meteor, 流星
universe, 宇宙`;
    setBatchVocabText(sample);
  }

  const currentQuestions = questions.filter((q) => q.category === activeCategory);
  const currentTab = CATEGORY_TABS.find((t) => t.id === activeCategory)!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* 頂部標題與週次選擇 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            <BookOpen className="w-4 h-4" />
            <span>自主修練題庫管理</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            每週自主修練出題中心
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            每週提供國、英、數各 3 題錯題挑戰及 10 題 4 選 1 單字測驗，學生開卷翻書答對 60% 即可解鎖翻盤晶片。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="week-select" className="text-xs font-semibold text-slate-500 uppercase">
            選擇週次：
          </label>
          <select
            id="week-select"
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                第 {w.weekNumber} 週：{w.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 提示訊息 */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 類別分頁切換 Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {CATEGORY_TABS.map((tab) => {
          const count = questions.filter((q) => q.category === tab.id).length;
          const isFull = count >= tab.target;
          const isActive = activeCategory === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? "bg-indigo-700 text-indigo-100"
                    : isFull
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {count}/{tab.target} 題
              </span>
            </button>
          );
        })}
      </div>

      {/* 主版面：雙欄佈局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：出題表單 (5 欄) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 若為 VOCAB 類別：提供批次單字快速出題 */}
          {activeCategory === "VOCAB" && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>批次單字一鍵生成 4 選 1</span>
                </h3>
                <button
                  type="button"
                  onClick={handleLoadSampleVocab}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>帶入 10 個示範單字</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                每行輸入「英文, 中文」，系統會自動將其他單字中文隨機混充為干擾選項，生成標準 4 選 1 題目：
              </p>

              <textarea
                rows={7}
                value={batchVocabText}
                onChange={(e) => setBatchVocabText(e.target.value)}
                placeholder="planet, 行星&#10;galaxy, 銀河&#10;astronaut, 太空人&#10;..."
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-mono text-xs p-3 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />

              <button
                type="button"
                onClick={handleBatchVocab}
                disabled={batchLoading || !batchVocabText.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{batchLoading ? "生成題庫中..." : "批次生成 10 題 4 選 1 測驗"}</span>
              </button>
            </div>
          )}

          {/* 單題手動出題表單 */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>新增單題 ({currentTab.label})</span>
            </h3>

            <form onSubmit={handleCreateQuestion} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  題目敘述 *
                </label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="請輸入題目內容..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2.5 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    選項 A
                  </label>
                  <input
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="選項 A"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    選項 B
                  </label>
                  <input
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="選項 B"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    選項 C
                  </label>
                  <input
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="選項 C"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    選項 D
                  </label>
                  <input
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="選項 D"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  正確答案 (需與選項內容完全相符) *
                </label>
                <div className="flex gap-2">
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    <option value="">-- 請選擇正確選項 --</option>
                    {optA && <option value={optA}>選項 A: {optA}</option>}
                    {optB && <option value={optB}>選項 B: {optB}</option>}
                    {optC && <option value={optC}>選項 C: {optC}</option>}
                    {optD && <option value={optD}>選項 D: {optD}</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  詳解說明 (學生作答後顯示)
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="簡要解題關鍵..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs p-2 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !questionText.trim() || !correctAnswer.trim()}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? "儲存中..." : "新增此題"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* 右側：題目列表 (7 欄) */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {currentTab.label} 題目列表 ({currentQuestions.length} 題)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                建議出題數：{currentTab.target} 題
              </span>
            </div>

            {loading ? (
              <div className="py-24 text-center text-slate-400 text-xs">載入題目中...</div>
            ) : currentQuestions.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p>本週目前尚無 {currentTab.label} 題目</p>
                <p className="text-[11px] text-slate-400">請在左側輸入題目或批次生成單字測驗。</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {currentQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono mt-0.5">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-relaxed">
                          {q.questionText}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="刪除此題"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 4 個選項 */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded text-xs border flex items-center justify-between ${
                              isCorrect
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                : "bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 詳解 */}
                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 bg-white/70 p-2 rounded border border-slate-200/60">
                        <strong className="text-indigo-700">解析：</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

