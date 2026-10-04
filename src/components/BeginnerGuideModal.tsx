"use client";

import { useState } from "react";
import {
  Shield,
  Swords,
  Zap,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  CheckCircle,
} from "lucide-react";

interface BeginnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BeginnerGuideModal({
  isOpen,
  onClose,
}: BeginnerGuideModalProps) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  function handleNext() {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onClose();
    }
  }

  function handlePrev() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-[#0d1322] border-2 border-amber-400/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-100">
        {/* 頂部進度標籤與關閉按鈕 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
              GUIDE {step} / 3
            </span>
            <span className="text-xs text-slate-400 font-bold">新手冒險者對決手冊</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 步驟內容輪播卡片 */}
        <div className="min-h-[260px] flex flex-col justify-between space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 mx-auto flex items-center justify-center text-3xl shadow-lg">
                🛡️
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white">
                  第 1 步：血量與作業護盾
                </h3>
                <p className="text-xs text-amber-300 font-pixel">
                  HEALTH & HOMEWORK SHIELD
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold text-sm">❤️</span>
                  <p>
                    <strong className="text-white">血量 (HP) = 週考原始成績</strong>
                    <br />
                    卷面考幾分，開局血量就是幾分（例如考 95 分，起始 HP 即為 95）！
                  </p>
                </div>
                <div className="flex items-start gap-2.5 pt-1 border-t border-slate-800/80">
                  <span className="text-emerald-400 font-bold text-sm">🛡️</span>
                  <p>
                    <strong className="text-white">按時繳齊作業 = 開局自帶 1 氣 + 護盾</strong>
                    <br />
                    作業全勤啟動作業護盾，戰力直接 +5，並在對抗中實質吸收 5 點傷害！
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 mx-auto flex items-center justify-center text-3xl shadow-lg">
                🃏
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white">
                  第 2 步：戰術室情報與編排
                </h3>
                <p className="text-xs text-blue-300 font-pixel">
                  TACTICAL DECK PREPARATION
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold text-sm">🔍</span>
                  <p>
                    <strong className="text-white">查看對手上週出牌與風格標籤</strong>
                    <br />
                    系統會揭露對手的風格（如【快攻型】或【防守型】）與上週 5 回合序列。
                  </p>
                </div>
                <div className="flex items-start gap-2.5 pt-1 border-t border-slate-800/80">
                  <span className="text-cyan-400 font-bold text-sm">🎯</span>
                  <p>
                    <strong className="text-white">在戰術室排好 5 張行動卡</strong>
                    <br />
                    針對敵方習慣，精準排定 R1~R5 出招，並點擊「鎖定本週出招」！
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 mx-auto flex items-center justify-center text-3xl shadow-lg">
                ⚔️
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white">
                  第 3 步：出招相剋口訣
                </h3>
                <p className="text-xs text-yellow-300 font-pixel">
                  ACTION COUNTER FORMULA
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <span>🛡️ 防守</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    擋下【攻擊】普通打擊，並大幅減免【必殺技】傷害！
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    <span>🌀 瓦解</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    專破【防守】盾牆！對防守造成雙倍破甲暴擊重創！
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1">
                    <span>⚔️ 攻擊</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    凌厲刺擊！直接中斷敵方的【瓦解】與【集氣】行動！
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1">
                    <span>💥 必殺技</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    需蓄滿 3 氣！釋放毀滅級傷害，擊潰對手血條！
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部導航按鈕與圓點指示器 */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            disabled={step === 1}
            onClick={handlePrev}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一頁</span>
          </button>

          {/* 3 個步進點 */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  step === s ? "bg-amber-400 w-6" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-md shadow-amber-400/20"
          >
            <span>{step === 3 ? "完成！開始出征" : "下一頁"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
