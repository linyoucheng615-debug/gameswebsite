import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#1e293b] text-slate-100 font-sans antialiased flex flex-col relative selection:bg-amber-400 selection:text-black">
      {/* 16-bit Arcade Subtle Grid Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Top Arcade Status Bar */}
      <header className="relative z-20 border-b border-slate-800 bg-[#070b14]/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand with Pixel Font */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center text-white text-base">
              ⚔️
            </div>
            <div>
              <div className="font-pixel text-[11px] sm:text-xs text-amber-400 tracking-wider">
                WEEKLY BATTLE ARENA
              </div>
              <div className="text-[11px] text-slate-400 font-sans tracking-wide">
                小六週考像素格鬥場
              </div>
            </div>
          </Link>

          {/* Right Action: Teacher Entrance & Mode Indicator */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SEASON 1 • JRPG MODE
            </span>

            <Link
              href="/admin/login"
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>老師入口</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Student Page Content */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

      {/* Retro Arcade Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#070b14]/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 補習班小六「遊戲化週考對戰與作業管理系統」</p>
          <p className="font-mono text-[11px] text-slate-400">
            按時繳交作業即可充能 +5 護盾戰力！
          </p>
        </div>
      </footer>
    </div>
  );
}
