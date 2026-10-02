"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Layers,
  Sparkles,
  Save,
  MessageSquare,
  ChevronDown,
  Info,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";
import { generateParentNotification, generateBatchNotifications } from "@/lib/notificationHelper";
import { AcademicWeek, HomeworkStatus } from "@/types";

interface HomeworkStudentRow {
  id: string;
  studentId: string;
  studentNumber: string;
  name: string;
  avatarId: string;
  parentPhone?: string | null;
  status: HomeworkStatus;
  missingScope?: string | null;
  hasBuff: boolean;
}

export default function AdminHomeworkPage() {
  const [weeks, setWeeks] = useState<AcademicWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [currentWeek, setCurrentWeek] = useState<AcademicWeek | null>(null);
  const [rows, setRows] = useState<HomeworkStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [batchCopied, setBatchCopied] = useState(false);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        console.error("載入週次列表失敗:", err);
      }
    }
    fetchWeeks();
  }, []);

  // 載入當週作業名單
  useEffect(() => {
    if (!selectedWeekId) return;

    async function fetchHomework() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/homework?weekId=${selectedWeekId}`);
        const data = await res.json();
        if (data.week) {
          setCurrentWeek(data.week);
        }
        if (data.records) {
          setRows(data.records);
        }
      } catch (err) {
        console.error("載入作業資料失敗:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomework();
  }, [selectedWeekId]);

  // 更新某學生的狀態
  function handleStatusChange(studentId: string, newStatus: HomeworkStatus) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.studentId === studentId) {
          const isComp = newStatus === "completed";
          return {
            ...row,
            status: newStatus,
            hasBuff: isComp,
            missingScope: isComp ? "" : row.missingScope || "數習 P.32-P.35",
          };
        }
        return row;
      })
    );
  }

  // 更新缺交範圍文字
  function handleScopeChange(studentId: string, newScope: string) {
    setRows((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, missingScope: newScope } : row))
    );
  }

  // 複製單一學生家長提醒文字
  function copySingleNotification(row: HomeworkStudentRow) {
    if (!currentWeek) return;
    const text = generateParentNotification({
      studentName: row.name,
      unitTitle: currentWeek.title,
      missingScope: row.missingScope,
      deadline: currentWeek.deadline,
    });

    navigator.clipboard.writeText(text);
    setCopiedId(row.studentId);
    setTimeout(() => setCopiedId(null), 2500);
  }

  // 一鍵複製全部未交訊息
  function copyAllMissingNotifications() {
    if (!currentWeek) return;
    const missingRows = rows.filter((r) => r.status !== "completed");
    const text = generateBatchNotifications(
      missingRows.map((r) => ({
        studentName: r.name,
        unitTitle: currentWeek.title,
        missingScope: r.missingScope,
        deadline: currentWeek.deadline,
        studentNumber: r.studentNumber,
      }))
    );

    navigator.clipboard.writeText(text);
    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 3000);
  }

  // 儲存至資料庫
  async function handleSave() {
    if (!currentWeek) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/homework", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekId: currentWeek.id,
          records: rows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            missingScope: r.missingScope,
          })),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("儲存失敗:", err);
    } finally {
      setSaving(false);
    }
  }

  const completedCount = rows.filter((r) => r.status === "completed").length;
  const missingCount = rows.filter((r) => r.status === "missing").length;
  const partialCount = rows.filter((r) => r.status === "partial").length;
  const uncompletedCount = missingCount + partialCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* 頂部標題與週次選擇 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border/80">
        <div>
          <div className="flex items-center gap-2 text-cyber-cyan text-xs font-mono tracking-wider uppercase mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>老師後台 • 作業登記與家長通知</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            小六週考作業管理盤
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            完成作業獲得週考 <strong className="text-amber-400 font-bold">有效戰力 +5 護盾</strong>
            ；缺交或需訂正即時生成模板通知。
          </p>
        </div>

        {/* 週次切換器 */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-300">選擇週次：</label>
          <div className="relative">
            <select
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="bg-cyber-darkest border border-cyber-border-bright text-white text-xs font-bold py-2 pl-3 pr-8 rounded focus:outline-none focus:border-cyber-cyan"
            >
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  第 {w.weekNumber} 週：{w.title} {w.isSettled ? "(已結算)" : "(進行中)"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentWeek && (
        <div className="my-6 p-4 bg-cyber-card border border-cyber-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 font-bold">
                第 {currentWeek.weekNumber} 週
              </span>
              <h2 className="text-base font-bold text-white">{currentWeek.title}</h2>
              {currentWeek.isSettled && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold">
                  ✓ 已結算
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              補交期限：<span className="text-amber-300 font-mono font-medium">{currentWeek.deadline}</span>
            </p>
          </div>

          {/* 統計與快捷動作 */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-darkest border border-cyber-border rounded text-xs">
              <span className="text-slate-400">總計：</span>
              <strong className="text-white font-mono">{rows.length}人</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>已完成：</span>
              <strong className="font-mono font-bold">{completedCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/50 border border-red-500/30 rounded text-xs text-red-300">
              <XCircle className="w-3.5 h-3.5" />
              <span>缺交：</span>
              <strong className="font-mono font-bold">{missingCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/50 border border-amber-500/30 rounded text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>部分：</span>
              <strong className="font-mono font-bold">{partialCount}</strong>
            </div>

            {/* 一鍵複製全部未交訊息 */}
            <button
              onClick={copyAllMissingNotifications}
              className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-md ${
                uncompletedCount > 0
                  ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
              disabled={uncompletedCount === 0}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{batchCopied ? "✓ 已複製全部未交！" : `一鍵複製全部未交 (${uncompletedCount}人)`}</span>
            </button>

            {/* 儲存按鈕 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-cyber-cyan/20 hover:bg-cyber-cyan/30 text-cyber-cyan border border-cyber-cyan font-bold text-xs rounded transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "儲存中..." : saveSuccess ? "✓ 已儲存成功" : "儲存設定"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 提示訊息 */}
      <div className="mb-4 p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-xs text-blue-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <strong>說明：</strong>
          作業狀態預設為「已完成」（自動獲得 +5
          戰力護盾）。當切換為「缺交」或「部分完成」時，該列會展開「缺交範圍」自訂文字框。點擊右側「複製此學生訊息」即可將套版家長通知複製至剪貼簿直接發送至
          LINE 群組。
        </div>
      </div>

      {/* 學生作業表格 */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          載入全班名單中...
        </div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          查無學生資料，請確認資料庫種子或新增學生。
        </div>
      ) : (
        <div className="bg-cyber-card border border-cyber-border rounded-lg overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-cyber-darkest/90 border-b border-cyber-border text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">學號</th>
                  <th className="py-3 px-4">學生姓名</th>
                  <th className="py-3 px-4">外觀職業</th>
                  <th className="py-3 px-4 min-w-[280px]">作業繳交狀態 (三態)</th>
                  <th className="py-3 px-4">有效戰力加成</th>
                  <th className="py-3 px-4 text-right">家長通知動作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {rows.map((row) => {
                  const avatar = getAvatarMeta(row.avatarId);
                  const isCompleted = row.status === "completed";
                  const isMissing = row.status === "missing";
                  const isPartial = row.status === "partial";
                  const isCopied = copiedId === row.studentId;

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-cyber-darkest/60 transition-colors ${
                        isMissing
                          ? "bg-red-950/15"
                          : isPartial
                          ? "bg-amber-950/15"
                          : ""
                      }`}
                    >
                      {/* 學號 */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {row.studentNumber}
                      </td>

                      {/* 姓名與電話 */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{row.name}</span>
                          {row.parentPhone && (
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                              ({row.parentPhone})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 外觀職業 */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${avatar.bgColor} ${avatar.color} ${avatar.border}`}
                        >
                          <span>{avatar.emoji}</span>
                          <span>{avatar.name}</span>
                        </span>
                      </td>

                      {/* 三態勾選與缺交範圍 */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          {/* 三態單選按鈕組 */}
                          <div className="inline-flex rounded-md shadow-sm border border-cyber-border overflow-hidden">
                            {/* 已完成 */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentId, "completed")}
                              className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                                isCompleted
                                  ? "bg-emerald-600 text-white"
                                  : "bg-cyber-darkest text-slate-400 hover:text-white"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>已完成</span>
                            </button>

                            {/* 缺交 */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentId, "missing")}
                              className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 border-l border-r border-cyber-border ${
                                isMissing
                                  ? "bg-red-600 text-white"
                                  : "bg-cyber-darkest text-slate-400 hover:text-white"
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>缺交</span>
                            </button>

                            {/* 部分完成/需訂正 */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(row.studentId, "partial")}
                              className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                                isPartial
                                  ? "bg-amber-600 text-white"
                                  : "bg-cyber-darkest text-slate-400 hover:text-white"
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>需訂正/部分</span>
                            </button>
                          </div>

                          {/* 展開缺交範圍文字框 */}
                          {!isCompleted && (
                            <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                              <span className="text-[11px] text-amber-300 font-bold shrink-0">
                                缺交範圍：
                              </span>
                              <input
                                type="text"
                                value={row.missingScope || ""}
                                onChange={(e) => handleScopeChange(row.studentId, e.target.value)}
                                placeholder="例：數習 P.32-P.35、單元一訂正"
                                className="bg-cyber-darkest border border-amber-500/60 text-white text-xs px-2.5 py-1 rounded w-full max-w-xs focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 有效戰力加成 */}
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Shield className="w-3 h-3 text-amber-400" />
                            +5 護盾加成
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-500 bg-slate-900 border border-slate-700">
                            +0 無加成
                          </span>
                        )}
                      </td>

                      {/* 動作：複製此學生訊息 */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPreviewId(
                                  expandedPreviewId === row.studentId ? null : row.studentId
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-cyber-darkest transition-colors"
                              title="預覽通知"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => copySingleNotification(row)}
                            className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isCopied
                                ? "bg-emerald-600 text-white shadow-neon-cyan"
                                : !isCompleted
                                ? "bg-cyber-red hover:bg-cyber-red-hover text-white shadow-neon-red"
                                : "bg-cyber-darkest hover:bg-slate-800 text-slate-300 border border-cyber-border"
                            }`}
                          >
                            <Copy className="w-3 h-3" />
                            <span>{isCopied ? "已複製！" : "複製此學生訊息"}</span>
                          </button>
                        </div>

                        {/* 預覽通知小卡 */}
                        {expandedPreviewId === row.studentId && currentWeek && (
                          <div className="mt-2 p-3 bg-cyber-darkest border border-cyber-border-bright rounded text-left text-xs font-sans text-slate-300 space-y-1">
                            <div className="text-[10px] text-cyber-cyan font-mono font-bold">
                              ▼ 模板 A 預覽：
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-xs bg-black/40 p-2 rounded text-slate-200">
                              {generateParentNotification({
                                studentName: row.name,
                                unitTitle: currentWeek.title,
                                missingScope: row.missingScope,
                                deadline: currentWeek.deadline,
                              })}
                            </pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
