"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface WordItem {
  id: string;
  english: string;
  chinese: string;
  createdAt: string;
}

export default function AdminWordsPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [rawText, setRawText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function fetchWords() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/words");
      const json = await res.json();
      if (res.ok) {
        setWords(json.words || []);
      }
    } catch {
      setStatusMsg({ type: "error", text: "連線失敗，無法取得單字庫" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWords();
  }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) {
      setStatusMsg({ type: "error", text: "請先輸入或貼上單字內容" });
      return;
    }

    try {
      setImporting(true);
      setStatusMsg(null);
      const res = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: "error", text: json.error || "匯入失敗" });
        return;
      }

      setStatusMsg({ type: "success", text: json.message });
      setRawText("");
      fetchWords();
    } catch {
      setStatusMsg({ type: "error", text: "匯入請求發生錯誤" });
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此單字嗎？")) return;
    try {
      const res = await fetch(`/api/admin/words?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWords((prev) => prev.filter((w) => w.id !== id));
        setStatusMsg({ type: "success", text: "單字已成功刪除" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "刪除失敗" });
    }
  }

  async function handleClearAll() {
    if (!confirm("⚠️ 警告：這將清空題庫內所有單字，確定清空嗎？")) return;
    try {
      const res = await fetch("/api/admin/words?clearAll=true", { method: "DELETE" });
      if (res.ok) {
        setWords([]);
        setStatusMsg({ type: "success", text: "題庫已清空" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "清空失敗" });
    }
  }

  function handleInsertSample() {
    setRawText(`hero, 英雄
victory, 勝利
shield, 護盾
warrior, 戰士
dragon, 巨龍
castle, 城堡
sword, 寶劍
magic, 魔法
knight, 騎士
quest, 冒險任務`);
  }

  const filteredWords = words.filter(
    (w) =>
      w.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.chinese.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* 標題與操作概覽 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">單字題庫管理</h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
              共 {words.length} 題
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            提供學生在「單字修練道場」進行四選一隨機測驗。學生答對可累積 EXP 升等與金幣！
          </p>
        </div>

        {words.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="self-start sm:self-auto text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200 transition-colors"
          >
            清空所有單字
          </button>
        )}
      </div>

      {/* 狀態訊息提示 */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* 核心工作區：左側批次匯入 / 右側單字庫清單 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左側：批次貼上匯入 (佔 5 格) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>批次匯入單字</span>
            </h2>
            <button
              type="button"
              onClick={handleInsertSample}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>帶入範例</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            請輸入單字清單，格式為「<code className="text-indigo-600 font-bold">英文, 中文</code>」（一行一個）：
          </p>

          <form onSubmit={handleImport} className="space-y-4">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`apple, 蘋果\nbanana, 香蕉\nwarrior, 戰士\nshield, 護盾`}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={importing || !rawText.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{importing ? "正在匯入資料庫..." : "一鍵匯入題庫"}</span>
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">💡 測驗四選一出題機制：</div>
            <p>
              系統每次抽 10 題，題庫內其他單字將自動洗牌作為錯誤選項干擾項。
              建議題庫數量維持在 15 題以上，以獲得最佳隨機體驗！
            </p>
          </div>
        </div>

        {/* 右側：目前題庫清單 (佔 7 格) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>已收錄單字清單</span>
              <span className="text-xs text-slate-500 font-normal">
                ({filteredWords.length} / {words.length})
              </span>
            </h2>

            {/* 搜尋欄位 */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋英文或中文..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* 表格清單 */}
          <div className="flex-1 overflow-x-auto min-h-[360px] border border-slate-100 rounded-lg">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                載入單字題庫中...
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 stroke-1" />
                <span>
                  {searchQuery ? "找不到符合條件的單字" : "目前題庫尚無單字，請從左側匯入"}
                </span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                    <th className="py-2.5 px-4 font-semibold">英文單字</th>
                    <th className="py-2.5 px-4 font-semibold">中文釋義</th>
                    <th className="py-2.5 px-4 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredWords.map((word, idx) => (
                    <tr key={word.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-indigo-700">
                        {word.english}
                      </td>
                      <td className="py-2 px-4 text-slate-900 font-medium">
                        {word.chinese}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(word.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
