"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, User, Lock, Tag, BadgeCheck, AlertTriangle, Crown } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    nickname: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          router.replace("/tournaments");
        }
      } catch {
        // Not logged in
      }
    }
    checkExisting();
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "註冊失敗");
      }

      router.push("/tournaments");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("註冊發生未知錯誤");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-cyber-cyan/15 border border-cyber-cyan/40 items-center justify-center font-black text-2xl text-cyber-cyan mb-3 cyber-cut-corner shadow-neon-cyan">
            ♟
          </div>
          <h1 className="text-3xl font-black tracking-wider uppercase text-white">
            Player Registration
          </h1>
          <p className="text-xs font-mono text-cyber-red tracking-widest uppercase mt-1">
            // Enlist Into The Arena
          </p>
        </div>

        {/* First User Notice Banner */}
        <div className="mb-6 p-3.5 bg-gradient-to-r from-amber-500/10 via-cyber-surface to-cyber-card border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 cyber-cut-br">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>系統規則</strong>：首位完成註冊者將自動獲取系統最高管理員 (<span className="text-amber-400 font-bold">Admin</span>) 權限。
          </span>
        </div>

        {/* Form Card */}
        <div className="bg-cyber-card border border-cyber-border-bright p-8 cyber-cut-br shadow-cyber-card relative">
          {error && (
            <div className="mb-6 p-3 bg-red-950/60 border border-cyber-red text-red-200 text-sm flex items-center gap-2 cyber-cut-br">
              <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                學號 / Student ID (唯一參賽識別碼)
              </label>
              <div className="relative">
                <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="studentId"
                  required
                  placeholder="例: B11200001"
                  value={form.studentId}
                  onChange={handleChange}
                  className="w-full bg-cyber-darkest border border-cyber-border pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  真實姓名 / Real Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="例: 王大明"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-cyber-darkest border border-cyber-border pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  競賽暱稱 / Nickname
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="nickname"
                    required
                    placeholder="例: CheckmateKing"
                    value={form.nickname}
                    onChange={handleChange}
                    className="w-full bg-cyber-darkest border border-cyber-border pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                設定密碼 / Password (至少 6 位元)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-cyber-darkest border border-cyber-border pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyber-cyan to-blue-600 hover:brightness-110 text-cyber-darkest font-black tracking-wider text-sm uppercase cyber-cut-corner shadow-neon-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>註冊建立中...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>確認註冊並進入賽事</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyber-border/80 text-center">
            <p className="text-xs text-slate-400">
              已有參賽帳號？{" "}
              <Link
                href="/login"
                className="text-cyber-red hover:underline font-semibold tracking-wider ml-1"
              >
                前往登入 ➔
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

