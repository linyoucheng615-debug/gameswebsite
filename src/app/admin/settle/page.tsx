"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Swords,
  Trophy,
  Bot,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Users,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";
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
        if (data.week) {
          setCurrentWeek(data.week);
        }
        if (data.students) {
          setStudents(data.students);
        }
        if (data.matches) {
          setMatches(data.matches);
        }
      } catch (err) {
        console.error("載入結算資料失敗:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettleData();
  }, [selectedWeekId]);

  // 載入 30 人模擬成績 (方便測試)
  function handleLoadSampleScores() {
    // 產生 30 位學生的真實小六成績 (70 ~ 98 分)
    const sampleScores: Record<string, number> = {
      S101: 96,
      S102: 95,
      S103: 92,
      S104: 88, // 缺交作業 (+0)
      S105: 89,
      S106: 87,
      S107: 86,
      S108: 84,
      S109: 83, // 需訂正 (+0)
      S110: 85,
      S111: 82,
      S112: 80,
      S113: 81,
      S114: 79,
      S115: 78,
      S116: 77,
      S117: 76,
      S118: 75, // 缺交 (+0)
      S119: 75,
      S120: 74,
      S121: 73,
      S122: 72, // 部分 (+0)
      S123: 71,
      S124: 70,
      S125: 69,
      S126: 68,
      S127: 67, // 缺交 (+0)
      S128: 66,
      S129: 65,
      S130: 64,
    };

    const lines = Object.entries(sampleScores)
      .map(([sNum, score]) => `${sNum} ${score}`)
      .join("\n");

    setScoresText(lines);
  }

  // 執行一鍵配對與結算
  async function handleSettle() {
    if (!currentWeek) return;
    if (!scoresText.trim()) {
      setErrorMsg("請先在下方輸入成績文字或載入示範數據");
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

      // 重新載入最新配對結果
      const refreshRes = await fetch(`/api/admin/settle?weekId=${currentWeek.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.week) setCurrentWeek(refreshData.week);
      if (refreshData.matches) setMatches(refreshData.matches);
      if (refreshData.students) setStudents(refreshData.students);
    } catch (err: any) {
      setErrorMsg("連線異常，請稍後重試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* 頂部標題 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border/80">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono tracking-wider uppercase mb-1">
            <Zap className="w-4 h-4" />
            <span>老師後台 • 週考戰力結算中心</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            實力配對與對戰結算
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            將原始卷面分數加上作業護盾 (+5
            分)，由高至低自動嚴格相鄰兩兩配對並生成戰鬥日誌。
          </p>
        </div>

        {/* 週次切換 */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-300">選擇週次：</label>
          <select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            className="bg-cyber-darkest border border-cyber-border-bright text-white text-xs font-bold py-2 pl-3 pr-8 rounded focus:outline-none focus:border-cyber-cyan"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                第 {w.weekNumber} 週：{w.title} {w.isSettled ? "(已結算)" : "(未結算)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 當週狀態面板 */}
      {currentWeek && (
        <div className="my-6 p-4 bg-cyber-card border border-cyber-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                第 {currentWeek.weekNumber} 週
              </span>
              <h2 className="text-base font-bold text-white">{currentWeek.title}</h2>
              {currentWeek.isSettled ? (
                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  已完成結算 ({matches.length} 組對戰)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold">
                  待匯入成績與結算
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              補交期限：<span className="text-white font-mono">{currentWeek.deadline}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">名冊學生數：</span>
            <span className="font-mono text-sm font-bold text-white bg-cyber-darkest px-2.5 py-1 rounded border border-cyber-border">
              {students.length} 人
            </span>
          </div>
        </div>
      )}

      {/* 提示訊息 */}
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-950/70 border border-red-500 text-red-200 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-3 bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 成績批次輸入區塊 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-cyber-card border border-cyber-border p-5 rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyber-cyan" />
                <span>批次成績輸入區 (學號 成績)</span>
              </label>

              <button
                type="button"
                onClick={handleLoadSampleScores}
                className="text-[11px] px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>帶入 30 人示範成績</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              支援「學號 成績」、「學號,成績」或 CSV 貼上，例如：
              <code className="text-cyber-cyan bg-black/40 px-1 py-0.5 rounded font-mono ml-1">
                S101 95
              </code>
            </p>

            <textarea
              rows={12}
              value={scoresText}
              onChange={(e) => setScoresText(e.target.value)}
              placeholder="S101 96&#10;S102 95&#10;S103 92&#10;S104 88&#10;..."
              className="w-full bg-cyber-darkest border border-cyber-border-bright text-white font-mono text-xs p-3 rounded focus:outline-none focus:border-amber-400 resize-none"
            />

            <div className="mt-4 pt-4 border-t border-cyber-border flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                作業已完成者將自動獲得{" "}
                <strong className="text-amber-400 font-bold">+5 護盾</strong>
              </span>

              <button
                type="button"
                onClick={handleSettle}
                disabled={submitting || !scoresText.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded uppercase tracking-wider cyber-cut-corner shadow-neon-red transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Swords className="w-4 h-4" />
                <span>{submitting ? "計算與結算中..." : "一鍵實力配對與結算"}</span>
              </button>
            </div>
          </div>

          {/* 演算法說明卡片 */}
          <div className="p-4 bg-cyber-darkest/60 border border-cyber-border rounded-lg text-xs space-y-2 text-slate-400">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>結算與配對規則說明：</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>
                <strong>有效戰力</strong> = 卷面原始分數 + 作業護盾 (+5 分，若缺交為 +0 分)。
              </li>
              <li>
                <strong>實力分層兩兩配對</strong>：系統嚴格依照有效戰力由高至低排序，相鄰成組（1v2,
                3v4 ...）。
              </li>
              <li>
                <strong>奇數守門機器人</strong>：若因缺席為單數，系統自動生成同分段平均戰力之替身機器人。
              </li>
              <li>
                <strong>非即時戰鬥數據</strong>：預先換算基礎 20 滴傷害與差距加權，並生成完整
                <code className="text-cyber-cyan font-mono"> battle_log </code>
                供學生觀看 2D 像素戰鬥動畫。
              </li>
            </ul>
          </div>
        </div>

        {/* 右側：結算結果呈現區 */}
        <div className="lg:col-span-7">
          <div className="bg-cyber-card border border-cyber-border p-5 rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  對戰配對清單 {matches.length > 0 && `(共 ${matches.length} 組)`}
                </h3>
              </div>

              {currentWeek?.isSettled && (
                <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  當週已完成結算
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-24 text-center text-slate-400 text-xs">載入結算資料中...</div>
            ) : matches.length === 0 ? (
              <div className="py-24 text-center text-slate-500 text-xs space-y-2">
                <Swords className="w-8 h-8 mx-auto text-slate-600" />
                <p>本週尚未執行對戰結算</p>
                <p className="text-[11px] text-slate-600">
                  請在左側貼入成績文字，並點擊「一鍵實力配對與結算」生成戰鬥！
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {matches.map((m, idx) => {
                  const log = m.battleLog;
                  const pA = log.playerA;
                  const pB = log.playerB;
                  const avatarA = getAvatarMeta(pA.avatarId);
                  const avatarB = getAvatarMeta(pB.avatarId);

                  return (
                    <div
                      key={m.id || idx}
                      className="p-3 bg-cyber-darkest border border-cyber-border-bright rounded hover:border-cyber-cyan transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
                        <span className="font-bold text-amber-400">第 {idx + 1} 組對決</span>
                        <span>
                          {log.winner === "DRAW" ? (
                            <span className="text-amber-400 font-bold">雙方平手 (Draw)</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              獲勝者：{log.winnerName}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-11 items-center gap-2">
                        {/* 選手 A */}
                        <div className="col-span-5 p-2 bg-black/40 rounded border border-cyber-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{avatarA.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                                <span>{pA.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({pA.studentNumber})
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>原始: {pA.rawScore}</span>
                                {pA.buff > 0 ? (
                                  <span className="text-amber-300 font-bold">+5護盾</span>
                                ) : (
                                  <span className="text-slate-500">+0</span>
                                )}
                                <span className="font-bold text-white font-mono">
                                  戰力 {pA.effectivePower}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* VS */}
                        <div className="col-span-1 text-center font-black font-mono text-xs text-cyber-cyan">
                          VS
                        </div>

                        {/* 選手 B (或替身機器人) */}
                        <div className="col-span-5 p-2 bg-black/40 rounded border border-cyber-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {pB.isBot ? "🤖" : avatarB.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                                <span>{pB.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({pB.studentNumber})
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>原始: {pB.rawScore}</span>
                                {pB.buff > 0 ? (
                                  <span className="text-amber-300 font-bold">+5護盾</span>
                                ) : (
                                  <span className="text-slate-500">+0</span>
                                )}
                                <span className="font-bold text-white font-mono">
                                  戰力 {pB.effectivePower}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 戰報摘記與前往連結 */}
                      <div className="mt-2 pt-2 border-t border-cyber-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-sm">
                          戰果：{log.summary}
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/battle/${pA.studentNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-cyber-cyan hover:underline font-mono"
                          >
                            預覽 {pA.name} 動畫 ↗
                          </a>
                          {!pB.isBot && (
                            <a
                              href={`/battle/${pB.studentNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-cyber-cyan hover:underline font-mono"
                            >
                              預覽 {pB.name} 動畫 ↗
                            </a>
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
