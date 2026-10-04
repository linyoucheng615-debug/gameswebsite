import Link from "next/link";
import { GraduationCap, Shield } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* 乾淨白底現代 SaaS 頂部導航 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  週考成績平台
                </span>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                  國英數週考
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-sans hidden sm:block">
                學力數據分析與學習儀表板
              </div>
            </div>
          </Link>

          {/* Right Action: Teacher Entrance */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>老師入口</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Student Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Modern Clean SaaS Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 週考成績平台 • 專業學力數據分析與學習激勵系統</p>
          <p className="text-[11px] text-slate-400">
            查看歷史成績，考高分增強本週戰力
          </p>
        </div>
      </footer>
    </div>
  );
}

