"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Swords,
  Trophy,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  Users,
  HelpCircle,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Flame,
  UserCheck,
  CalendarDays,
  Target,
  FileSpreadsheet,
} from "lucide-react";

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<"quickstart" | "player" | "organizer" | "faq">("quickstart");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 sm:px-8 py-8 w-full">
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-4 rounded-full border border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan text-xs font-mono tracking-widest uppercase shadow-neon-cyan/20">
          <BookOpen className="w-3.5 h-3.5 text-cyber-cyan animate-pulse" />
          <span>ITM GAMES // 清大科管所賽事系統</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase mb-4">
          平台完整使用指南與教學
        </h1>
        <p className="text-sm sm:text-base text-cyber-muted max-w-2xl mx-auto leading-relaxed">
          不論您是第一次參賽的選手、或是準備策劃多輪熱血賽事的主辦人，這裡將為您詳細引導所有核心功能與自動化流程。
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-10 pb-4 border-b border-cyber-border">
        <button
          onClick={() => setActiveTab("quickstart")}
          className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold cyber-cut-corner transition-all flex items-center gap-2 ${
            activeTab === "quickstart"
              ? "bg-cyber-cyan text-cyber-darkest shadow-neon-cyan font-black"
              : "bg-cyber-surface border border-cyber-border text-slate-300 hover:text-white hover:border-cyber-cyan/50"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>🔰 3 分鐘快速起步</span>
        </button>

        <button
          onClick={() => setActiveTab("player")}
          className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold cyber-cut-corner transition-all flex items-center gap-2 ${
            activeTab === "player"
              ? "bg-cyber-red text-white shadow-neon-red font-black"
              : "bg-cyber-surface border border-cyber-border text-slate-300 hover:text-white hover:border-cyber-red/50"
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>⚔️ 選手參賽篇 (含智慧約戰)</span>
        </button>

        <button
          onClick={() => setActiveTab("organizer")}
          className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold cyber-cut-corner transition-all flex items-center gap-2 ${
            activeTab === "organizer"
              ? "bg-amber-500 text-cyber-darkest shadow-lg shadow-amber-500/20 font-black"
              : "bg-cyber-surface border border-cyber-border text-slate-300 hover:text-white hover:border-amber-500/50"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>🏆 主辦人辦賽篇 (四大賽制)</span>
        </button>

        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold cyber-cut-corner transition-all flex items-center gap-2 ${
            activeTab === "faq"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black"
              : "bg-cyber-surface border border-cyber-border text-slate-300 hover:text-white hover:border-purple-500/50"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>❓ 常見問題 FAQ</span>
        </button>
      </div>

      {/* TAB 1: QUICKSTART */}
      {activeTab === "quickstart" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Hero introduction */}
          <div className="bg-gradient-to-br from-cyber-card via-cyber-surface to-cyber-darkest border border-cyber-cyan/40 p-6 sm:p-8 cyber-cut-br shadow-cyber-card">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-cyber-cyan" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                歡迎來到 ITM games 清大科管所賽事系統
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              ITM games 專為 <span className="text-cyber-cyan font-bold">電子競技</span>、
              <span className="text-emerald-400 font-bold">球類運動</span>、
              <span className="text-amber-400 font-bold">桌上卡牌 (TCG)</span> 與
              <span className="text-rose-400 font-bold">智力棋類</span> 等對抗型運動量身打造。
              從選手報名、智慧對戰約期、即時成績登錄到冠軍榜自動結算，全流程由系統自動化驅動。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-cyber-darkest/70 border border-cyber-border rounded">
                <span className="text-cyber-cyan font-bold block mb-1">⚡ 永久雲端保存</span>
                採用 Turso 分散式雲端資料庫，資料永不遺失，換裝置或手機無縫讀取。
              </div>
              <div className="p-3.5 bg-cyber-darkest/70 border border-cyber-border rounded">
                <span className="text-emerald-400 font-bold block mb-1">🤖 電腦自動比對空檔</span>
                首創下週可用時段交叉分析，電腦即時為雙方挑選最合適開戰時段。
              </div>
              <div className="p-3.5 bg-cyber-darkest/70 border border-cyber-border rounded">
                <span className="text-rose-400 font-bold block mb-1">🛡️ 雙向互斥上鎖</span>
                選手填報勝負後立即自動上鎖連動，防止賽後竄改或成績爭議。
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-cyber-card border border-cyber-border p-6 cyber-cut-br relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-cyber-cyan/15 text-cyber-cyan font-mono font-black flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="text-lg font-bold text-white mb-2">註冊選手帳號</h3>
                <p className="text-xs text-cyber-muted leading-relaxed mb-4">
                  輸入您的學號或使用者 ID、暱稱與安全密碼。系統會自動驗證唯一性，第一位註冊者享有系統最高管理員權限。
                </p>
              </div>
              <Link
                href="/register"
                className="w-full py-2 bg-cyber-surface border border-cyber-cyan/40 text-cyber-cyan text-center text-xs font-bold cyber-cut-corner hover:bg-cyber-cyan/10 transition-all flex items-center justify-center gap-1.5"
              >
                前往註冊席位 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-cyber-card border border-cyber-border p-6 cyber-cut-br relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-cyber-red/15 text-cyber-red font-mono font-black flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="text-lg font-bold text-white mb-2">個性化選手中心</h3>
                <p className="text-xs text-cyber-muted leading-relaxed mb-4">
                  進入「選手中心」，自選 8 款專屬賽博頭像 (狐狸、夜狼、天鷹、武士等)，設定您的勝戰座右銘，並隨時查看大數據生涯勝率與對戰分析。
                </p>
              </div>
              <Link
                href="/profile"
                className="w-full py-2 bg-cyber-surface border border-cyber-red/40 text-cyber-red text-center text-xs font-bold cyber-cut-corner hover:bg-cyber-red/10 transition-all flex items-center justify-center gap-1.5"
              >
                前往選手中心 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-cyber-card border border-cyber-border p-6 cyber-cut-br relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-amber-500/15 text-amber-400 font-mono font-black flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="text-lg font-bold text-white mb-2">參賽或發起盃賽</h3>
                <p className="text-xs text-cyber-muted leading-relaxed mb-4">
                  前往「賽事專區」一鍵報名進行中的盃賽；或者人人皆可點選「發起新盃賽」，自己當主辦人邀請各路好手同台競技！
                </p>
              </div>
              <Link
                href="/tournaments"
                className="w-full py-2 bg-cyber-surface border border-amber-500/40 text-amber-400 text-center text-xs font-bold cyber-cut-corner hover:bg-amber-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                探索賽事大廳 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYER GUIDE */}
      {activeTab === "player" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section 1: Tournament Joining */}
          <div className="bg-cyber-card border border-cyber-border p-6 sm:p-8 cyber-cut-br">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-cyber-cyan/15 text-cyber-cyan">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">第 1 步：尋找與報名賽事</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
              <div>
                <p className="leading-relaxed mb-3">
                  在「賽事專區」可依據 <strong className="text-white">電競、球類、卡牌、棋類、綜合</strong> 篩選您想參與的盃賽。
                </p>
                <ul className="space-y-2 text-xs text-cyber-muted font-mono list-disc list-inside">
                  <li>狀態為「報名中」之盃賽，點擊卡片進入詳情。</li>
                  <li>登入狀態下直接點擊「立即報名參賽」即可完成登錄。</li>
                  <li>在賽事正式啟動前，您可以隨時點選「退出報名」。</li>
                </ul>
              </div>
              <div className="p-4 bg-cyber-darkest border border-cyber-border/70 rounded-lg text-xs space-y-2">
                <span className="text-cyber-cyan font-mono font-bold block">// 賽事狀態說明</span>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-bold rounded">報名中</span>
                  <span className="text-slate-400">開放所有選手報名席位</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">進行中</span>
                  <span className="text-slate-400">賽程已鎖定，配對已生成，選手進入約戰與競賽階段</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded">已結束</span>
                  <span className="text-slate-400">賽事完結，頒獎台榜單與各選手名次已確立</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Smart Matchmaking & Scheduling Feature */}
          <div className="bg-cyber-card border border-cyber-red/50 p-6 sm:p-8 cyber-cut-br shadow-cyber-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-cyber-red/15 text-cyber-red">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  第 2 步：智慧對戰約期系統（電腦交叉比對空檔）
                  <span className="text-xs bg-cyber-red text-white px-2 py-0.5 rounded font-mono font-bold">
                    核心特色
                  </span>
                </h2>
                <p className="text-xs text-cyber-muted mt-1">
                  不再需要在通訊軟體裡來回詢問「你何時有空？」，系統為雙方精準計算重疊時段！
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                  <div className="text-cyber-cyan font-bold font-mono text-xs mb-1">STEP 2-1</div>
                  <h4 className="font-bold text-white mb-1">打開約戰彈窗</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    在賽程對戰卡片上點擊「📅 約定對戰時段」，進入下週 7 天 × 4 時段的互動式選擇矩陣。
                  </p>
                </div>
                <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                  <div className="text-cyber-cyan font-bold font-mono text-xs mb-1">STEP 2-2</div>
                  <h4 className="font-bold text-white mb-1">勾選下週可用時段</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    提供晨間、下午、晚間、深夜 4 大時段。可使用「⚡平日晚間」或「⚡週末全天」一秒批次全選。
                  </p>
                </div>
                <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                  <div className="text-cyber-cyan font-bold font-mono text-xs mb-1">STEP 2-3</div>
                  <h4 className="font-bold text-white mb-1">電腦自動交集比對</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    對手也填寫後，電腦立即計算重疊空檔。頂端會跳出綠色推薦按鈕，點擊即可「一鍵約定開戰」！
                  </p>
                </div>
              </div>

              {/* Visual Mockup of the Scheduler Matrix */}
              <div className="p-5 bg-cyber-surface border border-cyber-border-bright rounded-lg font-mono">
                <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-cyber-cyan font-bold">
                    <Target className="w-4 h-4 text-cyber-cyan" />
                    矩陣顏色圖例說明：
                  </span>
                  <span className="text-[11px] text-slate-500">週一 至 週日 (共 28 格)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-cyber-card border border-cyber-border rounded">
                    <span className="w-3.5 h-3.5 rounded bg-cyber-cyan/30 border border-cyber-cyan"></span>
                    <span className="text-white">青色框：您已勾選的空檔</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-cyber-card border border-cyber-border rounded">
                    <span className="w-3.5 h-3.5 rounded bg-purple-500/30 border border-purple-500"></span>
                    <span className="text-white">紫色框：對手已勾選的時段</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-500 rounded">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-neon-emerald"></span>
                    <span className="text-emerald-300 font-bold">綠色發光：雙方重疊共同空檔</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Result Reporting */}
          <div className="bg-cyber-card border border-cyber-border p-6 sm:p-8 cyber-cut-br">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-amber-500/15 text-amber-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">第 3 步：比分登錄與互斥上鎖</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                比賽結束後，對戰雙方任一人皆可在該場對戰卡片上回報勝負（獲勝、落敗、或和局）：
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
                <div className="p-3 bg-cyber-darkest border border-cyber-border rounded">
                  <strong className="text-emerald-400 block mb-1">✓ 雙向互斥自動連動</strong>
                  當一方回報「獲勝」，系統自動將對手成績判定為「落敗」，並即時寫入雲端防範重複登錄。
                </div>
                <div className="p-3 bg-cyber-darkest border border-cyber-border rounded">
                  <strong className="text-cyber-red block mb-1">✓ 爭議覆寫安全機制</strong>
                  若雙方因操作不當發生比分誤報，該盃賽主辦人或系統管理員具備人工覆寫權限，可立即進入修正。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORGANIZER GUIDE */}
      {activeTab === "organizer" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section: Creating tournament */}
          <div className="bg-cyber-card border border-amber-500/40 p-6 sm:p-8 cyber-cut-br shadow-cyber-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-amber-500/15 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">全民皆為主辦人：如何發起新盃賽</h2>
                <p className="text-xs text-cyber-muted mt-1">
                  只要註冊登入平台，您就能成為該盃賽的主辦人（Organizer），享受全套自動化賽事推進工具。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                <span className="text-amber-400 font-bold block mb-1">1. 點擊發起</span>
                於盃賽列表頁點選「＋ 發起新盃賽」。
              </div>
              <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                <span className="text-amber-400 font-bold block mb-1">2. 設定規程</span>
                填寫賽事名稱、選擇 5 大領域與賽制規則。
              </div>
              <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                <span className="text-amber-400 font-bold block mb-1">3. 啟動賽程</span>
                選手報名滿額或截止後，一鍵「啟動賽事」生成首輪對局。
              </div>
              <div className="p-4 bg-cyber-darkest border border-cyber-border rounded">
                <span className="text-amber-400 font-bold block mb-1">4. 輪次推進與結算</span>
                每輪賽畢一鍵「配對下一輪」，完賽自動結算冠亞季軍。
              </div>
            </div>
          </div>

          {/* Section: 4 Tournament Formats */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyber-cyan" />
              四大賽制演算法深度解析
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Format 1 */}
              <div className="bg-cyber-card border border-cyan-500/30 p-6 cyber-cut-br">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">♟️</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-cyan-500 text-cyan-400 bg-cyber-darkest">
                    SWISS SYSTEM
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">瑞士制 (積分同分池配對)</h4>
                <p className="text-xs text-cyber-muted leading-relaxed mb-3">
                  最適合大群選手但時間有限的賽事。每輪由積分相同的選手互相交鋒，且嚴格限制「防重複對戰」。
                </p>
                <div className="p-3 bg-cyber-darkest rounded border border-cyber-border text-[11px] font-mono text-slate-400 space-y-1">
                  <div>• 適用：寶可夢卡牌、西洋棋、電競海選預賽</div>
                  <div>• 排位規則：勝場積分優先，同分時自動計算 Buchholz 輔分 (對手勝率總和)</div>
                </div>
              </div>

              {/* Format 2 */}
              <div className="bg-cyber-card border border-emerald-500/30 p-6 cyber-cut-br">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🏓</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-500 text-emerald-400 bg-cyber-darkest">
                    ROUND ROBIN
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">S型蛇形分組循環賽</h4>
                <p className="text-xs text-cyber-muted leading-relaxed mb-3">
                  依據種子序採用 S 型蛇形（Snake Seed）平衡分配至各小組，組內進行全員單循環賽，保證賽局公平。
                </p>
                <div className="p-3 bg-cyber-darkest rounded border border-cyber-border text-[11px] font-mono text-slate-400 space-y-1">
                  <div>• 適用：羽球小組賽、桌球聯賽、校際杯</div>
                  <div>• 排位規則：小組勝場與淨勝局分，各組前 1~2 名晉級</div>
                </div>
              </div>

              {/* Format 3 */}
              <div className="bg-cyber-card border border-rose-500/30 p-6 cyber-cut-br">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🎮</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-rose-500 text-rose-400 bg-cyber-darkest">
                    SINGLE ELIMINATION
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">單淘汰樹狀圖 (Bracket Tree)</h4>
                <p className="text-xs text-cyber-muted leading-relaxed mb-3">
                  高張力一戰定生死！系統自動繪製動態互動式晉級樹狀圖，勝者無縫晉級下一輪對戰節點。
                </p>
                <div className="p-3 bg-cyber-darkest rounded border border-cyber-border text-[11px] font-mono text-slate-400 space-y-1">
                  <div>• 適用：格鬥電競 (SF6)、大專盃決賽、熱血快節奏挑戰</div>
                  <div>• 特色：全螢幕高畫質 Bracket 視覺動態連線</div>
                </div>
              </div>

              {/* Format 4 */}
              <div className="bg-cyber-card border border-amber-500/30 p-6 cyber-cut-br">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">👑</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-amber-500 text-amber-400 bg-cyber-darkest">
                    TOP-CUT PLAYOFF
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Top-Cut 季後複賽無縫切換</h4>
                <p className="text-xs text-cyber-muted leading-relaxed mb-3">
                  瑞士制或小組循環結束後，主辦人可一鍵將排名前 4 強或 8 強種子自動載入單淘汰季後賽樹狀圖。
                </p>
                <div className="p-3 bg-cyber-darkest rounded border border-cyber-border text-[11px] font-mono text-slate-400 space-y-1">
                  <div>• 適用：正式國際賽事、職業聯賽季後賽</div>
                  <div>• 特色：預賽海選 + 決賽高潮雙軌合一</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto">
          {[
            {
              q: "我的選手帳號與戰績會不會消失？",
              a: "完全不會！本平台已全面遷移至雲端分散式 Turso (LibSQL) 全球邊緣資料庫，帳號、密碼雜湊、選手中心頭像、座右銘與所有歷史對戰紀錄皆由雲端永續保存，不會因伺服器重啟或部署而遺失。",
            },
            {
              q: "在約戰系統中，如果我和對手勾選的時間完全沒有交集該怎麼辦？",
              a: "如果電腦分析顯示雙方空檔無重疊，雙方選手可以隨時再次打開約戰彈窗，多勾選幾個可彈性調整的時段。此外，盃賽主辦人亦可在該場對局直接手動協調，並由主辦人直接點選最終確認時間。",
            },
            {
              q: "比分如果不小心填錯了，該如何修正？",
              a: "系統為了防止賽後爭議，在選手登錄比分後會先自動鎖定。若有誤填，請立即向該盃賽之「主辦人」或「系統管理員」反應，主辦人在該場對戰卡片上擁有「覆寫比分」專屬權限，可直接解鎖並更新正確賽果。",
            },
            {
              q: "一般註冊使用者也可以自己發起盃賽嗎？",
              a: "可以！只要在網站右上角登入後，前往「賽事專區」，右上角即可點擊「＋ 發起新盃賽」。您所建立的盃賽，您就是該賽事的主辦人，享有啟動賽事、輪次推進與比分調解的完整管理權限。",
            },
            {
              q: "瑞士制的 Buchholz (輔分) 是如何計算的？",
              a: "Buchholz 輔分是國際棋類與卡牌賽事最標準的同分破平指標。它的定義為「該選手所有交手過之對手的最終勝場總和」。若兩名選手勝場相同，則遭遇過更強大對手的選手將獲得更高的 Buchholz 輔分，排位更加靠前。",
            },
            {
              q: "如何更換我的選手賽博頭像與座右銘？",
              a: "點擊右上角導覽列中的個人暱稱進入「選手中心」，即可看到 8 款極具未來感的賽博頭像徽章（狐狸、夜狼、天鷹、武士、神盾、王冠、秘法師等），點擊選中後輸入您的專屬座右銘，點選儲存即可全站即時更新！",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-cyber-card border border-cyber-border cyber-cut-br overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-white font-bold text-sm sm:text-base hover:text-cyber-cyan transition-colors"
              >
                <span className="flex items-center gap-3">
                  <span className="text-cyber-red font-mono text-xs font-black">Q{idx + 1}.</span>
                  {item.q}
                </span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-cyber-muted leading-relaxed border-t border-cyber-border/40 pt-3 animate-fadeIn">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA Card */}
      <div className="mt-14 p-8 bg-gradient-to-r from-cyber-red/10 via-cyber-card to-cyber-cyan/10 border border-cyber-border-bright cyber-cut-br text-center">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
          準備好迎接您的下一場榮耀對決了嗎？
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6">
          立即進入賽事大廳尋找熱門競賽，或發起您專屬的跨界挑戰盃賽！
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tournaments"
            className="px-6 py-3 bg-cyber-red hover:bg-cyber-red-hover text-white font-black tracking-wider text-xs sm:text-sm cyber-cut-corner shadow-neon-red transition-all flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            進入賽事大廳
          </Link>
          <Link
            href="/profile"
            className="px-6 py-3 bg-cyber-surface border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 font-bold tracking-wider text-xs sm:text-sm cyber-cut-corner hover:shadow-neon-cyan transition-all flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            設定個人選手中心
          </Link>
        </div>
      </div>
    </div>
  );
}

