"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Zap,
  Calendar,
  ExternalLink,
  LogOut,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* SaaS Minimalist Header (Hidden on Login page) */}
      {!isLoginPage && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-8">
              <Link href="/admin/homework" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm tracking-tight">
                    小六週考管理系統
                  </span>
                  <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                    SaaS 控制台
                  </span>
                </div>
              </Link>

              {/* Navigation Items */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/admin/homework"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname.startsWith("/admin/homework")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>作業登記與家長通知</span>
                </Link>

                <Link
                  href="/admin/settle"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname.startsWith("/admin/settle")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>週考結算與配對</span>
                </Link>

                <Link
                  href="/admin/quests"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname.startsWith("/admin/quests")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>自主修練出題</span>
                </Link>

                <Link
                  href="/admin/weeks"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname.startsWith("/admin/weeks")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>週次進度管理</span>
                </Link>
              </nav>
            </div>

            {/* Right: Quick Preview & Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/portal/S101"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="在新分頁開啟學生整合看板"
              >
                <span>學生看板預覽 (S101)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                title="登出後台"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">登出</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main SaaS Content Container */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}

