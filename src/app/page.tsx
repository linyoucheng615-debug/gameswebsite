"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Swords,
  Trophy,
  Shield,
  Users,
  ArrowRight,
  Flame,
  Sparkles,
  UserCheck,
  Gamepad2,
  Activity,
  Layers,
  CheckCircle2,
  Zap,
  BookOpen,
} from "lucide-react";
import { UserProfile } from "@/types";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function checkUser() {
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
    checkUser();
  }, []);

  const categories = [
    {
      id: "esports",
      icon: "🎮",
      title: "電子競技",
      subtitle: "ESPORTS ARENA",
      badge: "HOT",
      desc: "英雄聯盟、VALORANT 特戰英豪、快打旋風 6、Apex 等熱門電競。支援瑞士制海選與 4/8 強單淘汰總決賽。",
      gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
      borderColor: "border-cyan-500/40 hover:border-cyan-400",
      accent: "text-cyan-400",
      popular: "VALORANT / LoL / Street Fighter",
    },
    {
      id: "sports",
      icon: "🏓",
      title: "球類運動",
      subtitle: "SPORTS TOURNAMENT",
      badge: "POPULAR",
      desc: "校際羽球公開賽、大專桌球單雙打錦標賽、網球對抗賽。S型蛇形平衡分組與循環賽主客場輪替排程。",
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "border-emerald-500/40 hover:border-emerald-400",
      accent: "text-emerald-400",
      popular: "羽球單雙打 / 桌球 / 網球",
    },
    {
      id: "tcg",
      icon: "🃏",
      title: "桌上卡牌",
      subtitle: "TCG CHAMPIONSHIP",
      badge: "SEASON",
      desc: "寶可夢卡牌 (PTCG)、遊戲王 (Yu-Gi-Oh!)、魔法風雲會。標準瑞士制防重複配對與嚴謹 Buchholz 輔分排位。",
      gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
      borderColor: "border-amber-500/40 hover:border-amber-400",
      accent: "text-amber-400",
      popular: "寶可夢 PTCG / 遊戲王 / 魔法風雲會",
    },
    {
      id: "chess",
      icon: "♟️",
      title: "智力棋類",
      subtitle: "MIND SPORTS",
      badge: "CLASSIC",
      desc: "西洋棋冬季大師邀請賽、圍棋九段快棋錦標賽、象棋對抗。精確至 0.5 和局計分與即時雙向結果連動。",
      gradient: "from-rose-500/20 via-red-500/10 to-transparent",
      borderColor: "border-rose-500/40 hover:border-rose-400",
      accent: "text-rose-400",
      popular: "西洋棋 / 圍棋 / 象棋",
    },
    {
      id: "general",
      icon: "⚡",
      title: "綜合競賽",
      subtitle: "MULTI-DISCIPLINE",
      badge: "FLEXIBLE",
      desc: "學術辯論聯賽、程式設計黑客松、機器人格鬥賽。自訂種子序與晉級規程，任何對抗制比賽皆可完美駕馭。",
      gradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
      borderColor: "border-purple-500/40 hover:border-purple-400",
      accent: "text-purple-400",
      popular: "大專辯論 / 黑客松 / 機器人格鬥",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 sm:px-8 py-4 max-w-7xl mx-auto w-full">
      {/* Top Banner Tag */}
      <section className="w-full text-center py-10 sm:py-16 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-cyber-red/50 bg-cyber-red/15 text-cyber-red text-xs font-mono tracking-widest uppercase shadow-neon-red">
          <Flame className="w-3.5 h-3.5 text-cyber-red animate-pulse" />
          <span>VERSUS ARENA // NEXT-GEN TOURNAMENT ENGINE</span>
        </div>

        {/* Impactful Persona / Cyber Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white mb-6 leading-tight">
          跨界爭霸・榮耀加冕 <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyber-red via-rose-400 to-cyber-cyan text-glow-red">
            VERSUS ARENA
          </span>
        </h1>

        <div className="max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2.5 px-6 py-3 bg-cyber-surface/90 border border-cyber-cyan/60 text-white font-mono text-base sm:text-lg cyber-cut-corner shadow-neon-cyan/20">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan inline-block animate-pulse shadow-neon-cyan" />
            <span className="font-bold tracking-wider text-slate-100">
              國立清華大學 科技管理研究所 27屆製作
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tournaments"
            className="px-8 py-3.5 bg-gradient-to-r from-cyber-red to-rose-600 text-white font-black tracking-wider text-base cyber-cut-corner shadow-neon-red hover:brightness-110 active:scale-95 transition-all flex items-center gap-2.5"
          >
            <Swords className="w-5 h-5" />
            進入全項目賽事大廳
          </Link>

          <Link
            href="/guide"
            className="px-6 py-3.5 bg-cyber-surface border border-cyber-cyan/70 text-cyber-cyan hover:bg-cyber-cyan/15 font-bold tracking-wider text-base cyber-cut-corner hover:shadow-neon-cyan transition-all flex items-center gap-2.5"
          >
            <BookOpen className="w-5 h-5 text-cyber-cyan" />
            使用教學指南
          </Link>

          {!loading && user ? (
            <Link
              href="/profile"
              className="px-6 py-3.5 bg-cyber-card border border-cyber-border-bright text-slate-200 hover:text-white hover:border-slate-400 font-bold tracking-wider text-base cyber-cut-corner transition-all flex items-center gap-2.5"
            >
              <UserCheck className="w-5 h-5 text-emerald-400" />
              選手中心 ({user.nickname})
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-6 py-3.5 bg-cyber-card border border-cyber-border-bright text-slate-200 hover:text-white hover:border-slate-400 font-bold tracking-wider text-base cyber-cut-corner transition-all flex items-center gap-2.5"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              註冊選手席位
            </Link>
          )}
        </div>
      </section>

      {/* Real-time Platform Quick Stats Bar */}
      <section className="w-full bg-cyber-card/90 border border-cyber-border p-5 mb-14 cyber-cut-br shadow-cyber-card grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="border-r border-cyber-border/40 last:border-r-0">
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyber-cyan">5 大領域</div>
          <div className="text-xs text-cyber-muted mt-1 uppercase tracking-wider">電競 / 球類 / 卡牌 / 棋類 / 綜合</div>
        </div>
        <div className="border-r border-cyber-border/40 last:border-r-0">
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">4 種賽制</div>
          <div className="text-xs text-cyber-muted mt-1 uppercase tracking-wider">瑞士制 / 循環賽 / 單淘汰 / Top-Cut</div>
        </div>
        <div className="border-r border-cyber-border/40 last:border-r-0">
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyber-red">100% 同步</div>
          <div className="text-xs text-cyber-muted mt-1 uppercase tracking-wider">雙向互斥自動連動比分上鎖</div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">即時頒獎台</div>
          <div className="text-xs text-cyber-muted mt-1 uppercase tracking-wider">完賽自動結算冠亞季軍排位</div>
        </div>
      </section>

      {/* Multi-Discipline Category Showcase */}
      <section className="w-full mb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-3 border-b border-cyber-border">
          <div>
            <span className="text-xs font-mono text-cyber-cyan uppercase tracking-widest font-bold">
              // Discipline Matrix
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
              支援全方位競賽項目
            </h2>
          </div>
          <p className="text-xs text-cyber-muted mt-2 sm:mt-0 font-mono">
            無論是個人單挑或團隊對抗，皆可無縫採用
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-cyber-card/80 border ${cat.borderColor} p-6 cyber-cut-br shadow-cyber-card transition-all relative group hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{cat.icon}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${cat.borderColor} ${cat.accent} bg-cyber-darkest`}>
                  {cat.badge}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-500 tracking-wider uppercase mb-1">
                {cat.subtitle}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-cyan transition-colors">
                {cat.title}
              </h3>
              <p className="text-sm text-cyber-muted leading-relaxed mb-4">
                {cat.desc}
              </p>

              <div className="pt-3 border-t border-cyber-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                  {cat.popular}
                </span>
                <Link
                  href={`/tournaments?category=${cat.id}`}
                  className={`inline-flex items-center gap-1 font-bold ${cat.accent} hover:underline`}
                >
                  探索賽事 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Quick Creator Card */}
          <div className="bg-gradient-to-br from-cyber-surface via-cyber-card to-cyber-darkest border border-dashed border-cyber-border-bright p-6 cyber-cut-br flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-cyber-red/20 text-cyber-red flex items-center justify-center font-bold mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">需要主辦客製化賽事？</h3>
              <p className="text-xs text-cyber-muted leading-relaxed mb-4">
                管理員具備完整排程引擎，只需設定輪次與複賽晉級人數，系統自動計算積分、分配對局與生成樹狀圖。
              </p>
            </div>
            <Link
              href="/tournaments"
              className="w-full py-2.5 bg-cyber-surface hover:bg-cyber-border border border-cyber-cyan/50 text-cyber-cyan text-center text-xs font-bold cyber-cut-corner transition-all"
            >
              進入管理與發起盃賽
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Showcase Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
        {/* Card 1 */}
        <div className="bg-cyber-card border border-cyber-border p-6 relative group hover:border-cyber-red transition-colors cyber-cut-br">
          <div className="w-12 h-12 bg-cyber-red/10 text-cyber-red flex items-center justify-center rounded mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono text-cyber-red tracking-widest uppercase mb-1">01 / Tournament Engine</div>
          <h3 className="text-xl font-bold text-white mb-2">多賽制智能配對</h3>
          <p className="text-sm text-cyber-muted leading-relaxed">
            內建完整瑞士制 (Swiss-System) 積分池與防重複配對邏輯、分組循環賽與標準單敗淘汰 Bracket 樹狀圖，一鍵推進下一輪。
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-cyber-card border border-cyber-border p-6 relative group hover:border-cyber-cyan transition-colors cyber-cut-br">
          <div className="w-12 h-12 bg-cyber-cyan/10 text-cyber-cyan flex items-center justify-center rounded mb-4">
            <Swords className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono text-cyber-cyan tracking-widest uppercase mb-1">02 / Match Reporting</div>
          <h3 className="text-xl font-bold text-white mb-2">雙向自動比分同步</h3>
          <p className="text-sm text-cyber-muted leading-relaxed">
            藍方與紅方選手皆可登記成績，任一方登記勝/負/和，自動連動對方結果並立即上鎖。管理員具備爭議強制覆寫權。
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-cyber-card border border-cyber-border p-6 relative group hover:border-cyber-purple transition-colors cyber-cut-br">
          <div className="w-12 h-12 bg-cyber-purple/10 text-cyber-purple flex items-center justify-center rounded mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono text-cyber-purple tracking-widest uppercase mb-1">03 / Role & Security</div>
          <h3 className="text-xl font-bold text-white mb-2">全站權限與防呆分流</h3>
          <p className="text-sm text-cyber-muted leading-relaxed">
            學號唯一制註冊，首位註冊者自動晉升賽事管理員，支援後台即時權限升降，選手僅能填報自身賽局，賽務安全受控。
          </p>
        </div>
      </section>

      {/* Footer Preview */}
      <footer className="w-full pt-8 border-t border-cyber-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-cyber-muted gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <p>© 2026 VERSUS ARENA // 全方位電競與多項目競賽管理平台.</p>
          <Link href="/guide" className="text-cyber-cyan hover:underline font-bold flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            新手使用教學與指南
          </Link>
        </div>
        <p className="font-mono text-[11px] text-slate-500">POWERED BY NEXT.JS 14 // TAILWIND // PRISMA // TURSO</p>
      </footer>
    </main>
  );
}
