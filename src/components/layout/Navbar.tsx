"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Swords, Shield, ClipboardCheck, Zap, Calendar, LogIn, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/login");
        const data = await res.json();
        setIsAdmin(!!data.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="w-full border-b border-cyber-border/80 bg-cyber-darkest/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 via-rose-500 to-cyber-cyan flex items-center justify-center font-black text-white text-lg cyber-cut-corner shadow-neon-red group-hover:scale-105 transition-transform">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black tracking-wider text-base sm:text-lg uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-white to-cyber-cyan">
              小六週考對戰系統
            </div>
            <div className="text-[10px] text-cyber-cyan tracking-widest font-mono">
              // 補習班遊戲化作業與週考管理
            </div>
          </div>
        </Link>

        {/* Center/Right Nav Items */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 ${
              pathname === "/"
                ? "text-cyber-cyan border-b-2 border-cyber-cyan"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">學生對戰室</span>
          </Link>

          {/* Teacher links */}
          <Link
            href="/admin/homework"
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 ${
              pathname.startsWith("/admin/homework")
                ? "text-cyber-cyan border-b-2 border-cyber-cyan font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>作業登記</span>
          </Link>

          <Link
            href="/admin/settle"
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 ${
              pathname.startsWith("/admin/settle")
                ? "text-cyber-cyan border-b-2 border-cyber-cyan font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>週考結算</span>
          </Link>

          <Link
            href="/admin/weeks"
            className={`hidden md:flex px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors items-center gap-1.5 ${
              pathname.startsWith("/admin/weeks")
                ? "text-cyber-cyan border-b-2 border-cyber-cyan font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>週次管理</span>
          </Link>

          {!loading && (
            <div className="flex items-center gap-2 ml-2">
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                    <Shield className="w-3 h-3" />
                    老師管理員
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-xs"
                    title="登出老師帳號"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">登出</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/admin/login"
                  className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white border border-cyber-border-bright hover:border-cyber-cyan cyber-cut-corner transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>老師登入</span>
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
