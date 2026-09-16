"use client";

import { useState } from "react";
import { Trophy, Handshake, XCircle, AlertTriangle, ShieldAlert, Check, Loader2 } from "lucide-react";
import { Match, UserProfile } from "@/types";

interface QuickReportModalProps {
  match: Match;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickReportModal({
  match,
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}: QuickReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = currentUser.role === "admin";
  const isP1 = match.player1Id === currentUser.id;
  const isP2 = match.player2Id === currentUser.id;
  const isParticipant = isP1 || isP2;
  const isFinished = match.status === "finished";

  // If user is Admin and not participant, default to Admin Mode
  const [isAdminMode, setIsAdminMode] = useState<boolean>(isAdmin && (!isParticipant || isFinished));

  // Initial values based on match existing results or defaults
  const initialP1 = match.player1Result || "win";
  const initialP2 = match.player2Result || (initialP1 === "win" ? "loss" : initialP1 === "loss" ? "win" : "draw");

  const [p1Result, setP1Result] = useState<string>(initialP1);
  const [p2Result, setP2Result] = useState<string>(initialP2);

  if (!isOpen) return null;

  const p1Name = match.player1?.nickname || match.player1?.name || "藍方選手";
  const p2Name = match.player2?.nickname || match.player2?.name || (match.player2Id ? "紅方選手" : "輪空 (BYE)");

  // 雙向連動變更：變更藍方，紅方自動互斥
  function handleP1Change(val: string) {
    setP1Result(val);
    if (val === "win") setP2Result("loss");
    else if (val === "loss") setP2Result("win");
    else if (val === "draw") setP2Result("draw");
  }

  // 雙向連動變更：變更紅方，藍方自動互斥
  function handleP2Change(val: string) {
    setP2Result(val);
    if (val === "win") setP1Result("loss");
    else if (val === "loss") setP1Result("win");
    else if (val === "draw") setP1Result("draw");
  }

  // 快速選擇按鈕設定勝負
  function handleQuickOutcome(outcome: "p1_win" | "draw" | "p2_win") {
    if (outcome === "p1_win") {
      setP1Result("win");
      setP2Result("loss");
    } else if (outcome === "p2_win") {
      setP1Result("loss");
      setP2Result("win");
    } else {
      setP1Result("draw");
      setP2Result("draw");
    }
  }

  // 選手快速回報
  async function handlePlayerReport(choice: "win" | "draw" | "loss") {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/matches/${match.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: choice }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登記失敗");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("登記失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  }

  // 管理員覆寫提交
  async function handleAdminOverride(customP1?: string, customP2?: string) {
    setLoading(true);
    setError("");

    const submitP1 = customP1 || p1Result;
    const submitP2 = customP2 || p2Result;

    // 前端防呆檢查：雙方不可皆為勝或皆為敗
    if (submitP1 === "win" && submitP2 !== "loss") {
      setError("藍方獲勝時，紅方必須為敗北！");
      setLoading(false);
      return;
    }
    if (submitP2 === "win" && submitP1 !== "loss") {
      setError("紅方獲勝時，藍方必須為敗北！");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/matches/${match.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Result: submitP1,
          player2Result: submitP2,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "覆寫失敗");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("覆寫失敗");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-cyber-card border border-cyber-border-bright p-6 sm:p-8 cyber-cut-corner shadow-cyber-card relative">
        {/* Header Tag */}
        <div className="flex items-center justify-between border-b border-cyber-border pb-4 mb-6">
          <div>
            <span className="text-[10px] font-mono text-cyber-red tracking-widest uppercase font-bold">
              // Match Protocol R{match.round}
            </span>
            <h2 className="text-xl font-black uppercase text-white tracking-wide">
              {isAdminMode ? "管理員賽果登記 / 爭議覆寫" : "登記本局對戰結果"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/60 border border-cyber-red text-red-200 text-xs flex items-center gap-2 cyber-cut-br">
            <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Players Versus Card */}
        <div className="flex items-center justify-between bg-cyber-darkest/90 border border-cyber-border p-4 mb-6 cyber-cut-br">
          <div className="text-center flex-1">
            <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan inline-block shadow-neon-cyan" />
              <span>藍方 (P1)</span> {isP1 && <span className="text-white bg-cyber-cyan/30 px-1 rounded font-bold">(您)</span>}
            </div>
            <div className={`font-bold text-sm truncate ${p1Result === "win" ? "text-emerald-400" : "text-white"}`}>
              {p1Name}
            </div>
            <div className="text-[10px] font-mono mt-1">
              {p1Result === "win" ? (
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">勝 (+1.0)</span>
              ) : p1Result === "loss" ? (
                <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded">負 (+0.0)</span>
              ) : (
                <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">和 (+0.5)</span>
              )}
            </div>
          </div>

          <div className="px-3 text-xs font-mono font-black text-cyber-red italic">
            VS
          </div>

          <div className="text-center flex-1">
            <div className="text-[11px] font-mono text-rose-400 font-bold mb-1 flex items-center justify-center gap-1">
              <span>紅方 (P2)</span> {isP2 && <span className="text-white bg-cyber-red/30 px-1 rounded font-bold">(您)</span>}
              <span className="w-2 h-2 rounded-full bg-cyber-red inline-block shadow-neon-red" />
            </div>
            <div className={`font-bold text-sm truncate ${p2Result === "win" ? "text-emerald-400" : "text-white"}`}>
              {p2Name}
            </div>
            <div className="text-[10px] font-mono mt-1">
              {p2Result === "win" ? (
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">勝 (+1.0)</span>
              ) : p2Result === "loss" ? (
                <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded">負 (+0.0)</span>
              ) : (
                <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">和 (+0.5)</span>
              )}
            </div>
          </div>
        </div>

        {/* Mode 1: Participant Quick Reporting */}
        {!isAdminMode && isParticipant && !isFinished && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center">
              請點選您的對戰成績，系統將自動反向同步對手結果：
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePlayerReport("win")}
                className="py-4 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/60 text-emerald-300 font-bold cyber-cut-br flex flex-col items-center justify-center gap-2 hover:shadow-neon-cyan transition-all group"
              >
                <Trophy className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">我方勝利</span>
                <span className="text-[10px] font-mono text-emerald-400/80">勝 +1.0 / 對方負</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handlePlayerReport("draw")}
                className="py-4 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-600 text-slate-200 font-bold cyber-cut-br flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <Handshake className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
                <span className="text-sm">雙方和局</span>
                <span className="text-[10px] font-mono text-slate-400">雙方各 +0.5</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handlePlayerReport("loss")}
                className="py-4 bg-red-950/40 hover:bg-red-900/60 border border-cyber-red/60 text-red-300 font-bold cyber-cut-br flex flex-col items-center justify-center gap-2 hover:shadow-neon-red transition-all group"
              >
                <XCircle className="w-6 h-6 text-cyber-red group-hover:scale-110 transition-transform" />
                <span className="text-sm">我方敗北</span>
                <span className="text-[10px] font-mono text-red-400/80">負 +0.0 / 對方勝</span>
              </button>
            </div>
          </div>
        )}

        {/* Notice for already finished matches (if player) */}
        {!isAdminMode && isFinished && (
          <div className="text-center py-4 bg-slate-900/50 border border-cyber-border p-4 cyber-cut-br">
            <p className="text-sm text-slate-300 font-semibold mb-1">
              本場對局已鎖定完成
            </p>
            <p className="text-xs text-slate-500">
              結果：白方【{match.player1Result === "win" ? "勝" : match.player1Result === "loss" ? "負" : "和"}】 / 
              黑方【{match.player2Result === "win" ? "勝" : match.player2Result === "loss" ? "負" : "和"}】
            </p>
          </div>
        )}

        {/* Mode 2: Admin Override / Third-party Reporting */}
        {isAdminMode && (
          <div className="space-y-5">
            {/* Quick 1-Click Buttons for Admin */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                一鍵指定賽果（自動連鎖互斥）：
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickOutcome("p1_win")}
                  className={`py-2.5 px-2 border text-xs font-bold cyber-cut-br transition-all flex flex-col items-center gap-1 ${
                    p1Result === "win"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-neon-cyan/20"
                      : "bg-cyber-darkest border-cyber-border text-slate-400 hover:text-white"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span className="truncate max-w-full">藍方勝出 (P1)</span>
                  <span className="text-[9px] font-mono opacity-70">藍勝 / 紅負</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickOutcome("draw")}
                  className={`py-2.5 px-2 border text-xs font-bold cyber-cut-br transition-all flex flex-col items-center gap-1 ${
                    p1Result === "draw"
                      ? "bg-slate-800 border-slate-400 text-white"
                      : "bg-cyber-darkest border-cyber-border text-slate-400 hover:text-white"
                  }`}
                >
                  <Handshake className="w-4 h-4 text-slate-300" />
                  <span>雙方平局</span>
                  <span className="text-[9px] font-mono opacity-70">雙方皆和</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickOutcome("p2_win")}
                  className={`py-2.5 px-2 border text-xs font-bold cyber-cut-br transition-all flex flex-col items-center gap-1 ${
                    p2Result === "win"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-neon-cyan/20"
                      : "bg-cyber-darkest border-cyber-border text-slate-400 hover:text-white"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span className="truncate max-w-full">紅方勝出 (P2)</span>
                  <span className="text-[9px] font-mono opacity-70">藍負 / 紅勝</span>
                </button>
              </div>
            </div>

            {/* Synchronized Dropdown Selectors */}
            <div className="p-3.5 bg-cyber-darkest/70 border border-cyber-border cyber-cut-br space-y-3">
              <div className="text-[10px] font-mono text-cyber-cyan uppercase tracking-wider">
                // 精確調整（任選一方，另一方自動變更）
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-cyan-400 mb-1.5 font-bold">
                    藍方結果 ({p1Name})
                  </label>
                  <select
                    value={p1Result}
                    onChange={(e) => handleP1Change(e.target.value)}
                    className="w-full bg-cyber-card border border-cyber-border p-2.5 text-xs text-white focus:border-cyber-cyan"
                  >
                    <option value="win">勝利 (Win)</option>
                    <option value="draw">平手 (Draw)</option>
                    <option value="loss">敗北 (Loss)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-rose-400 mb-1.5 font-bold">
                    紅方結果 ({p2Name})
                  </label>
                  <select
                    value={p2Result}
                    onChange={(e) => handleP2Change(e.target.value)}
                    className="w-full bg-cyber-card border border-cyber-border p-2.5 text-xs text-white focus:border-cyber-cyan"
                  >
                    <option value="loss">敗北 (Loss)</option>
                    <option value="draw">平手 (Draw)</option>
                    <option value="win">勝利 (Win)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleAdminOverride()}
              className="w-full py-3 bg-cyber-red hover:bg-cyber-red-hover text-white font-bold text-xs uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>確認儲存賽果並連鎖重算積分</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Mode Switch for Admin */}
        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-cyber-border flex justify-between items-center text-xs">
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="text-cyber-cyan hover:underline flex items-center gap-1 font-mono"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAdminMode ? "切換至選手模式" : "切換至管理員覆寫模式"}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-mono"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
