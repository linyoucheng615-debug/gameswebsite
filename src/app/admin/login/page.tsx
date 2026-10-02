"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, ArrowRight, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("請輸入管理者密碼");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登入失敗，請確認密碼");
        return;
      }

      router.push("/admin/homework");
      router.refresh();
    } catch {
      setError("連線伺服器失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border-bright p-8 shadow-2xl relative cyber-cut-corner">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-red/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-cyber-red to-orange-500 rounded-xl flex items-center justify-center text-white mb-4 shadow-neon-red">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            老師後台管理系統
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            週次進度管理 • 作業登記通知 • 週考戰力結算
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-500/50 text-red-200 text-xs rounded-lg flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              管理者密碼
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入後台密碼 (預設 admin888)"
                className="w-full bg-cyber-darkest border border-cyber-border-bright text-white pl-10 pr-4 py-2.5 text-sm rounded focus:outline-none focus:border-cyber-cyan transition-colors"
                autoFocus
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
              <span>環境變數：ADMIN_PASSWORD</span>
              <button
                type="button"
                onClick={() => setPassword("admin888")}
                className="text-cyber-cyan hover:underline"
              >
                帶入預設密碼 (admin888)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyber-red to-orange-600 hover:from-cyber-red-hover hover:to-orange-500 text-white font-bold text-sm tracking-wider uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "驗證中..." : "解鎖進入後台"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cyber-border/40 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← 返回學生首頁
          </a>
        </div>
      </div>
    </div>
  );
}
