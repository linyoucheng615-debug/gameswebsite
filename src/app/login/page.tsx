"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, User, ArrowRight, AlertTriangle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/tournaments";

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          router.replace(redirectTarget);
        }
      } catch {
        // Not logged in
      }
    }
    checkExisting();
  }, [router, redirectTarget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "登入失敗");
      }

      router.push(redirectTarget);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("登入發生未知錯誤");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-cyber-red/20 border border-cyber-red/40 items-center justify-center font-black text-2xl text-cyber-red mb-3 cyber-cut-corner shadow-neon-red">
            ♚
          </div>
          <h1 className="text-3xl font-black tracking-wider uppercase text-white">
            Authentication
          </h1>
          <p className="text-xs font-mono text-cyber-cyan tracking-widest uppercase mt-1">
            // Access The Grand Arena
          </p>
        </div>

        {/* Card */}
        <div className="bg-cyber-card border border-cyber-border-bright p-8 cyber-cut-br shadow-cyber-card relative">
          <div className="absolute -top-3 right-6 px-3 py-0.5 bg-cyber-red text-white text-[10px] font-mono tracking-widest uppercase font-bold cyber-skew-btn">
            <span className="cyber-skew-content">Identity Gate</span>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-950/60 border border-cyber-red text-red-200 text-sm flex items-center gap-2 cyber-cut-br">
              <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                學號 / Student ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="例: B11200001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-cyber-darkest border border-cyber-border pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                密碼 / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cyber-darkest border border-cyber-border pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyber-red to-rose-600 hover:from-cyber-red-hover hover:to-rose-500 text-white font-black tracking-wider text-sm uppercase cyber-cut-corner shadow-neon-red transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>驗證身分中...</span>
              ) : (
                <>
                  <span>立即登入對局</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyber-border/80 text-center">
            <p className="text-xs text-slate-400">
              初次參賽？{" "}
              <Link
                href="/register"
                className="text-cyber-cyan hover:underline font-semibold tracking-wider ml-1"
              >
                註冊選手帳號 ➔
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-cyber-cyan font-mono text-sm tracking-widest animate-pulse">
            // LOADING GATEWAY...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
