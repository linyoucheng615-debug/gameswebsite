"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Swords,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import { AcademicWeek, BattleLog } from "@/types";

interface SettleStudent {
  id: string;
  studentNumber: string;
  name: string;
  avatarId: string;
  hasBuff: boolean;
  homeworkStatus: string;
  existingScore: number | null;
  existingPower: number | null;
}

interface SettleMatch {
  id: string;
  playerA: any;
  playerB: any;
  botName?: string;
  botPower?: number;
  winner?: any;
  isDraw: boolean;
  battleLog: BattleLog;
}

export default function AdminSettlePage() {
  const [weeks, setWeeks] = useState<AcademicWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [currentWeek, setCurrentWeek] = useState<AcademicWeek | null>(null);
  const [students, setStudents] = useState<SettleStudent[]>([]);
  const [matches, setMatches] = useState<SettleMatch[]>([]);
  const [scoresText, setScoresText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 載入週次列表
  useEffect(() => {
    async function fetchWeeks() {
      try {
        const res = await fetch("/api/admin/weeks");
        const data = await res.json();
        if (data.weeks && data.weeks.length > 0) {
          setWeeks(data.weeks);
          setSelectedWeekId(data.weeks[0].id);
        }
      } catch (err) {
        console.error("載入週次失敗:", err);
      }
    }
    fetchWeeks();
  }, []);

  // 載入當週結算資料
  useEffect(() => {
    if (!selectedWeekId) return;

    async function fetchSettleData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/admin/settle?weekId=${selectedWeekId}`);
        const data = await res.json();
        if (data.week) setCurrentWeek(data.week);
        if (data.students) setStudents(data.students);
        if (data.matches) setMatches(data.matches);
      } catch (err) {
        console.error("載入結算資料失敗:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettleData();
  }, [selectedWeekId]);

  // 載入 30 人國英數模擬成績
  function handleLoadSampleScores() {
    const sampleScores: Record<string, [number, number, number]> = {
      S101: [96, 98, 95],
      S102: [94, 96, 95],
      S103: [92, 90, 94],
      S104: [88, 86, 90], // 缺交作業 (+0)
      S105: [89, 92, 86],
      S106: [87, 88, 86],
      S107: [86, 85, 87],
      S108: [84, 82, 86],
      S109: [83, 85, 81], // 需訂正 (+0)
      S110: [85, 84, 86],
      S111: [82, 80, 84],
      S112: [80, 82, 78],
      S113: [81, 79, 83],
      S114: [79, 81, 77],
      S115: [78, 80, 76],
      S116: [77, 75, 79],
      S117: [76, 78, 74],
      S118: [75, 73, 77], // 缺交 (+0)
      S119: [75, 76, 74],
      S120: [74, 72, 76],
      S121: [73, 75, 71],
      S122: [72, 70, 74], // 部分 (+0)
      S123: [71, 73, 69],
      S124: [70, 68, 72],
      S125: [69, 71, 67],
      S126: [68, 66, 70],
      S127: [67, 69, 65], // 缺交 (+0)
      S128: [66, 64, 68],
      S129: [65, 67, 63],
      S130: [64, 62, 66],
    };

    const lines = Object.entries(sampleScores)
      .map(([sNum, [c, e, m]]) => `${sNum} ${c} ${e} ${m}`)
      .join("\n");

    setScoresText(lines);
  }

  // 執行結算
  async function handleSettle() {
    if (!currentWeek) return;
    if (!scoresText.trim()) {
      setErrorMsg("請先輸入成績文字或帶入示範成績");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekId: currentWeek.id,
          scoresText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "結算失敗");
        return;
      }

      setSuccessMsg(data.message || "結算成功！");

      // 重新取得最新結果
      const refreshRes = await fetch(`/api/admin/settle?weekId=${currentWeek.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.week) setCurrentWeek(refreshData.week);
      if (refreshData.matches) setMatches(refreshData.matches);
      if (refreshData.students) setStudents(refreshData.students);
    } catch {
      setErrorMsg("伺服器連線異常，請稍後重試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* 頂部導航與週次狀態 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            <Zap className="w-4 h-4" />
            <span>週考戰力結算中心</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            實力相近配對與戰鬥生成
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            系統依照全班「最終有效戰力」由高至低嚴格排序，兩兩相鄰自動成組，生成 5~7 秒 2D 像素戰鬥日誌。
          </p>
        </div>

        {/* 週次切換器 */}
        <div className="flex items-center gap-3">
          <label htmlFor="settle-week-select" className="text-xs font-semibold text-slate-500 uppercase">
            選擇週次：
          </label>
          <select
            id="settle-week-select"
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                第 {w.weekNumber} 週：{w.title} {w.isSettled ? "(已結算)" : "(未結算)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 提示訊息列 */}
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

      {/* 雙欄主架構：左側成績匯入，右側對戰清單 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：批次成績輸入區 (5 欄寬) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="batch-scores-input" className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>週考成績批次貼入</span>
              </label>

              <button
                type="button"
                onClick={handleLoadSampleScores}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>帶入 30 人模擬成績</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              支援「學號 國文 英文 數學」或「學號 單科」或 CSV 格式（例：<code className="text-indigo-600 bg-slate-100 px-1 py-0.5 rounded font-mono">S101 92 95 90</code>）：
            </p>

            <textarea
              id="batch-scores-input"
              rows={13}
              value={scoresText}
              onChange={(e) => setScoresText(e.target.value)}
              placeholder="S101 96 98 95&#10;S102 94 96 95&#10;S103 92 90 94&#10;..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-mono text-xs p-3 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                作業完成 <strong className="text-emerald-700 font-semibold">+10 護盾</strong> / 錯題全對 <strong className="text-amber-600 font-semibold">+15 奧義</strong>
              </div>

              <button
                type="button"
                onClick={handleSettle}
                disabled={submitting || !scoresText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                <Swords className="w-4 h-4" />
                <span>{submitting ? "計算與結算中..." : "一鍵實力配對與結算"}</span>
              </button>
            </div>
          </div>

          {/* 結算規則說明卡 */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-lg p-4 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>演算法規則：</span>
            </div>
            <p>1. 基礎血量 = 週考三科平均成績；有效戰力 = 三科平均 + (作業準時 ? 10 : 0) + (錯題全對 ? 15 : 0) + (進步幅度 * 1.5)。</p>
            <p>2. 嚴格由高至低排序，相鄰成對（1v2, 3v4 ...）。</p>
            <p>3. 奇數人數自動生成同分段平均戰力「守門機器人」。</p>
            <p>4. 35 秒 3 回合演繹：普攻試探 ➔ 學科絕技 ➔ 逆轉奧義 Super Flash (-50 暴擊)。</p>
          </div>
        </div>

        {/* 右側：配對與戰況清單 (7 欄寬) */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  實力配對清單 {matches.length > 0 && `(共 ${matches.length} 組)`}
                </h3>
              </div>

              {currentWeek?.isSettled && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                  ✓ 本週已結算
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-24 text-center text-slate-400 text-xs">載入配對戰報中...</div>
            ) : matches.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs space-y-2">
                <Swords className="w-8 h-8 text-slate-300 mx-auto" />
                <p>本週尚未執行對戰結算</p>
                <p className="text-[11px] text-slate-400">
                  請在左側貼入成績文字後，點擊「一鍵實力配對與結算」。
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {matches.map((m, idx) => {
                  const log = m.battleLog;
                  const pA = log.playerA;
                  const pB = log.playerB;

                  return (
                    <div
                      key={m.id || idx}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg transition-colors space-y-2.5"
                    >
                      {/* 第 X 組與勝負標籤 */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 font-mono">
                          對決 #{idx + 1}
                        </span>
                        <div>
                          {log.winner === "DRAW" ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                              雙方平手 (Draw)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                              獲勝：{log.winnerName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 雙方戰力比較列 */}
                      <div className="grid grid-cols-11 items-center gap-2">
                        {/* 選手 A */}
                        <div className="col-span-5 p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 truncate">
                              {pA.name} ({pA.studentNumber})
                            </span>
                            <span className="font-mono font-bold text-indigo-700">
                              {pA.effectivePower}分
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                            <span>卷面 {pA.rawScore}</span>
                            <span>{pA.buff > 0 ? "+5 護盾" : "+0"}</span>
                          </div>
                        </div>

                        {/* VS */}
                        <div className="col-span-1 text-center font-bold text-xs text-slate-400 font-mono">
                          VS
                        </div>

                        {/* 選手 B */}
                        <div className="col-span-5 p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 truncate">
                              {pB.name} {pB.isBot ? "[機器人]" : `(${pB.studentNumber})`}
                            </span>
                            <span className="font-mono font-bold text-indigo-700">
                              {pB.effectivePower}分
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                            <span>卷面 {pB.rawScore}</span>
                            <span>{pB.buff > 0 ? "+5 護盾" : "+0"}</span>
                          </div>
                        </div>
                      </div>

                      {/* 戰鬥動畫預覽捷徑 */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 truncate max-w-xs">
                          {log.summary}
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/battle/${pA.studentNumber}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <span>預覽 {pA.name}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          {!pB.isBot && (
                            <Link
                              href={`/battle/${pB.studentNumber}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              <span>預覽 {pB.name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
