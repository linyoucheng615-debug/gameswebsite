"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Zap,
  Save,
  MessageSquare,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
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
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
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
    setTimeout(() => setCopiedId(null), 2000);
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
    setTimeout(() => setBatchCopied(false), 2500);
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
        setTimeout(() => setSaveSuccess(false), 2500);
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
    <div className="min-h-full pb-16">
      {/* 頂部吸頂（Sticky Top）操作列 */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 左側：週次切換與單元資訊 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="week-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                週次：
              </label>
              <select
                id="week-select"
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    第 {w.weekNumber} 週：{w.title} {w.isSettled ? "(已結算)" : "(進行中)"}
                  </option>
                ))}
              </select>
            </div>

            {currentWeek && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 font-medium">
                  補交期限：<strong className="text-slate-800 font-semibold">{currentWeek.deadline}</strong>
                </span>
                {currentWeek.isSettled && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                    已完成結算
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 右側：狀態統計與主動作列 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 統計標籤 */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium">
                已繳 {completedCount}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-300 font-medium">
                缺交 {missingCount}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-300 font-medium">
                待訂正 {partialCount}
              </span>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* 一鍵複製全部未交訊息按鈕 */}
            <button
              onClick={copyAllMissingNotifications}
              disabled={uncompletedCount === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                uncompletedCount > 0
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 shadow-sm"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
              title="將所有未交與待訂正學生的家長通知合併複製"
            >
              {batchCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{batchCopied ? "已複製全部未交！" : `一鍵複製全部未交 (${uncompletedCount})`}</span>
            </button>

            {/* 儲存設定按鈕 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{saving ? "儲存中..." : saveSuccess ? "✓ 已儲存" : "儲存設定"}</span>
            </button>

            {/* 結算此週對戰按鈕 */}
            <Link
              href={`/admin/settle`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>前往週考結算</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 主體表格區域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            正在載入全班作業名冊...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">
            查無作業資料，請確認資料庫種子是否已建置。
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4 w-20">座號/學號</th>
                    <th className="py-3 px-4 w-36">學生姓名</th>
                    <th className="py-3 px-4 w-32">家長聯絡</th>
                    <th className="py-3 px-4 min-w-[340px]">作業繳交狀態 (三態藥丸切換)</th>
                    <th className="py-3 px-4 w-36">戰力加成效果</th>
                    <th className="py-3 px-4 text-right w-36">家長通知動作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {rows.map((row) => {
                    const isCompleted = row.status === "completed";
                    const isMissing = row.status === "missing";
                    const isPartial = row.status === "partial";
                    const isCopied = copiedId === row.studentId;

                    return (
                      <tr
                        key={row.studentId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isMissing
                            ? "bg-rose-50/30"
                            : isPartial
                            ? "bg-amber-50/30"
                            : ""
                        }`}
                      >
                        {/* 學號 */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {row.studentNumber}
                        </td>

                        {/* 姓名 */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 text-sm">
                            {row.name}
                          </span>
                        </td>

                        {/* 家長電話 */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {row.parentPhone || "未登錄"}
                        </td>

                        {/* 三態藥丸切換器 (Pill Segmented Control) + 展開缺交範圍 */}
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            {/* Pill Segmented Control */}
                            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                              {/* 已完成 */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(row.studentId, "completed")}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                  isCompleted
                                    ? "bg-white text-emerald-700 shadow-xs font-semibold border border-emerald-200"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                已完成
                              </button>

                              {/* 缺交 */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(row.studentId, "missing")}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                  isMissing
                                    ? "bg-white text-rose-700 shadow-xs font-semibold border border-rose-200"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                缺交
                              </button>

                              {/* 需訂正 */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(row.studentId, "partial")}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                  isPartial
                                    ? "bg-white text-amber-700 shadow-xs font-semibold border border-amber-200"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                待訂正 / 部分
                              </button>
                            </div>

                            {/* 缺交範圍文字框 (僅缺交或待訂正時展開) */}
                            {!isCompleted && (
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-[11px] text-slate-500 font-medium shrink-0">
                                  缺交範圍：
                                </span>
                                <input
                                  type="text"
                                  value={row.missingScope || ""}
                                  onChange={(e) => handleScopeChange(row.studentId, e.target.value)}
                                  placeholder="例：數習 P.32-P.35"
                                  className="bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-md w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 有效戰力加成效果 */}
                        <td className="py-3 px-4">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
                              <Shield className="w-3 h-3 text-emerald-600" />
                              <span>+5 護盾加成</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              <span>+0 無加成</span>
                            </span>
                          )}
                        </td>

                        {/* 家長通知動作 */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 預覽模板 A 按鈕 */}
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewStudentId(
                                  previewStudentId === row.studentId ? null : row.studentId
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                              title="預覽家長通知套版文字"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* 複製此學生訊息按鈕 */}
                            <button
                              type="button"
                              onClick={() => copySingleNotification(row)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                                isCopied
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs"
                              }`}
                            >
                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-slate-400" />}
                              <span>{isCopied ? "已複製" : "複製通知"}</span>
                            </button>
                          </div>

                          {/* 預覽通知小卡 */}
                          {previewStudentId === row.studentId && currentWeek && (
                            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md text-left text-xs text-slate-700 font-sans shadow-xs">
                              <div className="text-[10px] font-semibold text-indigo-600 mb-1">
                                家長提醒套版預覽：
                              </div>
                              <pre className="whitespace-pre-wrap font-sans text-xs bg-white p-2.5 rounded border border-slate-200 text-slate-800">
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
    </div>
  );
}
