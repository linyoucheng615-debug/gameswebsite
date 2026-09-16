"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Swords, Shield, User, LogIn, UserPlus, LogOut, Trophy, BookOpen } from "lucide-react";
import { UserProfile } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="w-full border-b border-cyber-border/80 bg-cyber-darkest/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-cyber-red via-rose-500 to-cyber-cyan flex items-center justify-center font-black text-white text-lg cyber-cut-corner shadow-neon-red group-hover:scale-105 transition-transform">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black tracking-wider text-lg uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyber-cyan">
              ITM games
            </div>
            <div className="text-[9px] text-cyber-cyan tracking-widest font-mono uppercase">
              // 清大科管所賽事系統
            </div>
          </div>
        </Link>

        {/* Center/Right Nav Items */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/tournaments"
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 ${
              pathname.startsWith("/tournaments")
                ? "text-cyber-cyan border-b-2 border-cyber-cyan"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">賽事專區</span>
          </Link>

          <Link
            href="/guide"
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 ${
              pathname.startsWith("/guide")
                ? "text-cyber-cyan border-b-2 border-cyber-cyan"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>使用教學</span>
          </Link>

          {!loading && user ? (
            <div className="flex items-center gap-2 sm:gap-3 ml-2">
              {/* Admin Panel Link */}
              {user.role === "admin" && (
                <Link
                  href="/admin/users"
                  className={`px-2.5 py-1.5 text-xs font-bold tracking-wider cyber-cut-corner transition-all flex items-center gap-1.5 ${
                    pathname.startsWith("/admin")
                      ? "bg-cyber-red text-white shadow-neon-red"
                      : "border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">管理後台</span>
                </Link>
              )}

              {/* Profile Link */}
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 bg-cyber-card border border-cyber-border-bright hover:border-cyber-cyan cyber-cut-br transition-all text-xs"
              >
                <div className="w-5 h-5 rounded-full bg-cyber-cyan/20 flex items-center justify-center text-xs">
                  {user.avatar ? (
                    user.avatar === "cyber-fox" ? "🦊" :
                    user.avatar === "cyber-dragon" ? "🐉" :
                    user.avatar === "cyber-wolf" ? "🐺" :
                    user.avatar === "cyber-samurai" ? "⚡" :
                    user.avatar === "cyber-hawk" ? "🦅" :
                    user.avatar === "cyber-aegis" ? "🛡️" :
                    user.avatar === "cyber-crown" ? "👑" :
                    user.avatar === "cyber-mage" ? "🔮" : "🦊"
                  ) : (
                    user.nickname.slice(0, 1)
                  )}
                </div>
                <span className="font-bold text-white max-w-[100px] truncate">
                  {user.nickname}
                </span>
                {user.role === "admin" && (
                  <span className="text-[9px] bg-cyber-red text-white px-1 py-0.2 rounded font-mono font-bold">
                    ADM
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                title="登出"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : !loading && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white font-semibold tracking-wider transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                登入
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-xs font-bold text-white bg-cyber-red hover:bg-cyber-red-hover cyber-cut-corner shadow-neon-red transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                註冊
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

