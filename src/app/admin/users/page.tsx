"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldAlert, User, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserProfile, UserRole } from "@/types";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData.user || meData.user.role !== "admin") {
          router.push("/");
          return;
        }
        setCurrentUser(meData.user);

        const usersRes = await fetch("/api/admin/users");
        const usersData = await usersRes.json();
        if (usersRes.ok) {
          setUsers(usersData.users);
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleRoleChange(targetUserId: string, newRole: UserRole) {
    setActionLoadingId(targetUserId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失敗");

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      setMessage({ type: "success", text: data.message });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "操作發生錯誤" });
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-cyber-red font-mono text-sm tracking-widest animate-pulse">
          // ACCESSING ADMIN TERMINAL...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyber-border pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-mono text-cyber-cyan hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> 返回首頁
            </Link>
            <span className="text-xs font-mono text-slate-600">//</span>
            <span className="text-xs font-mono text-cyber-red uppercase tracking-widest">
              Admin Access
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-wide">
            用戶帳號與權限管理
          </h1>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-cyber-card border border-cyber-border px-3.5 py-2 cyber-cut-br">
          當前總人數：<span className="text-white font-bold">{users.length}</span> 位選手
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 text-sm flex items-center gap-2.5 cyber-cut-br border ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
              : "bg-red-950/40 border-cyber-red/60 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="bg-cyber-card border border-cyber-border overflow-hidden cyber-cut-br shadow-cyber-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-cyber-border/80 bg-cyber-darkest/70 font-mono text-xs text-cyber-muted uppercase tracking-wider">
                <th className="py-3.5 px-4">學號</th>
                <th className="py-3.5 px-4">真實姓名</th>
                <th className="py-3.5 px-4">公開暱稱</th>
                <th className="py-3.5 px-4">當前權限</th>
                <th className="py-3.5 px-4">註冊時間</th>
                <th className="py-3.5 px-4 text-right">權限操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isTargetAdmin = u.role === "admin";
                const isBusy = actionLoadingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {u.studentId}
                    </td>
                    <td className="py-4 px-4 text-slate-300">{u.name}</td>
                    <td className="py-4 px-4 text-cyber-cyan font-medium">{u.nickname}</td>
                    <td className="py-4 px-4">
                      {isTargetAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyber-red/20 border border-cyber-red/50 text-cyber-red text-xs font-bold cyber-cut-corner">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium cyber-cut-corner">
                          <User className="w-3 h-3" /> Player
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString("zh-TW")}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isTargetAdmin ? (
                        <button
                          onClick={() => handleRoleChange(u.id, "player")}
                          disabled={isBusy}
                          className="px-3 py-1.5 border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase cyber-cut-corner transition-all disabled:opacity-40"
                          title={isSelf ? "拔除自己管理員權限" : "降為選手"}
                        >
                          {isBusy ? "處理中..." : "拔除 Admin"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(u.id, "admin")}
                          disabled={isBusy}
                          className="px-3 py-1.5 bg-cyber-red hover:bg-cyber-red-hover text-white text-xs font-bold uppercase cyber-cut-corner shadow-neon-red transition-all disabled:opacity-40"
                        >
                          {isBusy ? "處理中..." : "提升為 Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

