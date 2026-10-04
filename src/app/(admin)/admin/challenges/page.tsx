"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { AcademicWeek } from "@/types";

interface ChallengeItem {
  id: string;
  weekId: string;
  weekNumber: number;
  weekTitle: string;
  subject: "CHINESE" | "ENGLISH" | "MATH";
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
  answersCount: number;
}

export default function AdminChallengesPage() {
  const [weeks, setWeeks] = useState<AcademicWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 新增題目表單狀態
  const [subject, setSubject] = useState<"CHINESE" | "ENGLISH" | "MATH">("CHINESE");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");

  async function fetchChallenges(weekId?: string) {
    setLoading(true);
    try {
      const url = weekId ? `/api/admin/challenges?weekId=${weekId}` : "/api/admin/challenges";
      const res = await fetch(url);
      const data = await res.json();
      if (data.weeks) {
        setWeeks(data.weeks);
        if (!selectedWeekId && data.weeks.length > 0) {
          setSelectedWeekId(data.weeks[0].id);
        }
      }
      if (data.challenges) {
        setChallenges(data.challenges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChallenges(selectedWeekId);
  }, [selectedWeekId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWeekId || !questionText.trim() || !correctAnswer.trim()) {
      setErrorMsg("請填寫完整題目與正確答案");
      return;
    }

    const opts = [
      optionA.trim() || "A",
      optionB.trim() || "B",
      optionC.trim() || "C",
      optionD.trim() || "D",
    ];

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekId: selectedWeekId,
          subject,
          questionText: questionText.trim(),
          options: opts,
          correctAnswer: correctAnswer.trim(),
          explanation: explanation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "儲存題目失敗");
        return;
      }

      setSuccessMsg("✔ 成功新增題目！");
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      setExplanation("");
      fetchChallenges(selectedWeekId);
    } catch {
      setErrorMsg("網路異常，請重試");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此道挑戰題目嗎？")) return;
    try {
      const res = await fetch(`/api/admin/challenges?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchChallenges(selectedWeekId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* 標題與週次選擇 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            <BookOpen className="w-4 h-4" />
            <span>每週作業錯題挑戰題庫</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            每週國英數 3 題錯題修練場維護
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            設定當週國文、英文、數學作業錯題，學生 3 題全對即可啟動本週對決「第 3 回合逆轉必殺奧義 (+15 戰力)」。
          </p>
        </div>

        {/* 週次切換器 */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase">選擇週次：</label>
          <select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                第 {w.weekNumber} 週 • {w.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 提示訊息 */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 兩欄配置：左側新增題目，右側現有題目列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側表單 (5 欄寬) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">新增週次錯題挑戰題目</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">科目類型</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "CHINESE", label: "國文科" },
                  { key: "ENGLISH", label: "英文科" },
                  { key: "MATH", label: "數學科" },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSubject(s.key as any)}
                    className={`py-2 rounded-md font-bold text-xs transition-colors border ${
                      subject === s.key
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">題目文字敘述</label>
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="例如：下列各組「」中的成語，何者用字完全正確？"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-600 mb-0.5">選項 A</label>
                <input
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="A. 墨守成規"
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-0.5">選項 B</label>
                <input
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="B. 迫不及待"
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-0.5">選項 C</label>
                <input
                  type="text"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="C. 膾炙人口"
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-0.5">選項 D</label>
                <input
                  type="text"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="D. 濫竽充數"
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">正確答案 (需與選項文字吻合)</label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="例如：C. 膾炙人口"
                className="w-full bg-slate-50 border border-slate-300 p-2 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-emerald-800"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">題目解析說明 (學生作答後顯示)</label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="簡短錯題解析或破題關鍵技巧..."
                className="w-full bg-slate-50 border border-slate-300 p-2 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? "儲存中..." : "新增挑戰題目"}</span>
            </button>
          </form>
        </div>

        {/* 右側現有題目列表 (7 欄寬) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              當週題目列表 (共 {challenges.length} 題)
            </h2>
            <span className="text-[11px] text-slate-500">
              建議國文、英文、數學各設置 1 題
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">載入題目中...</div>
          ) : challenges.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>本週尚無錯題挑戰題目</p>
              <p className="text-[11px] text-slate-400">請由左側表單新增題目。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((ch, idx) => {
                const badgeColor =
                  ch.subject === "CHINESE"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : ch.subject === "ENGLISH"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-rose-50 text-rose-700 border-rose-200";

                const subName =
                  ch.subject === "CHINESE" ? "國文科" : ch.subject === "ENGLISH" ? "英文科" : "數學科";

                return (
                  <div
                    key={ch.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeColor}`}>
                        {subName} • 題目 #{idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDelete(ch.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="刪除此題"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-800">{ch.questionText}</p>

                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                      {ch.options.map((opt) => (
                        <span
                          key={opt}
                          className={`px-2 py-1 rounded border text-[11px] ${
                            opt.trim() === ch.correctAnswer.trim()
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>

                    {ch.explanation && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-mono">
                        💡 解析：{ch.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
