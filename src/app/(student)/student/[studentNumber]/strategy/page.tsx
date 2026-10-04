"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Shield,
  Zap,
  Swords,
  Flame,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Dice5,
} from "lucide-react";
import { getAvatarMeta } from "@/lib/avatars";

type CardType = "charge" | "attack" | "defend" | "break" | "ultimate";

interface CardMeta {
  type: CardType;
  name: string;
  icon: string;
  costDesc: string;
  effect: string;
  counterDesc: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const CARDS_INFO: Record<CardType, CardMeta> = {
  charge: {
    type: "charge",
    name: "集氣",
    icon: "⚡",
    costDesc: "獲得 +2 氣",
    effect: "為角色蓄能，施放必殺技必備",
    counterDesc: "⚠️ 懼怕【攻擊】中斷",
    bgColor: "from-blue-900/60 to-indigo-950/80",
    borderColor: "border-blue-500/60 hover:border-blue-400",
    textColor: "text-blue-300",
  },
  attack: {
    type: "attack",
    name: "攻擊",
    icon: "⚔️",
    costDesc: "消耗 0 氣",
    effect: "標準普攻打擊，克制【瓦解】與【集氣】",
    counterDesc: "⚠️ 被【防守】格擋減傷",
    bgColor: "from-rose-950/70 to-red-950/90",
    borderColor: "border-rose-500/60 hover:border-rose-400",
    textColor: "text-rose-300",
  },
  defend: {
    type: "defend",
    name: "防守",
    icon: "🛡️",
    costDesc: "消耗 0 氣",
    effect: "堅固盾牆，擋下【攻擊】並大幅削弱【必殺】",
    counterDesc: "⚠️ 被【瓦解】完全破防擊潰",
    bgColor: "from-emerald-950/70 to-teal-950/90",
    borderColor: "border-emerald-500/60 hover:border-emerald-400",
    textColor: "text-emerald-300",
  },
  break: {
    type: "break",
    name: "瓦解",
    icon: "🌀",
    costDesc: "消耗 0 氣",
    effect: "專破龜縮防禦！對【防守】造成雙倍暴擊重創",
    counterDesc: "⚠️ 懼怕【攻擊】直接反打中斷",
    bgColor: "from-purple-950/70 to-fuchsia-950/90",
    borderColor: "border-purple-500/60 hover:border-purple-400",
    textColor: "text-purple-300",
  },
  ultimate: {
    type: "ultimate",
    name: "必殺技",
    icon: "💥",
    costDesc: "消耗 3 氣",
    effect: "爆發職業最強奧義！造成毀滅性巨額傷害",
    counterDesc: "⚠️ 需氣充足，被【防守】擋下則威力減半",
    bgColor: "from-amber-950/70 to-yellow-950/90",
    borderColor: "border-amber-400/80 hover:border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    textColor: "text-amber-300",
  },
};

export default function StudentStrategyPage() {
  const params = useParams();
  const router = useRouter();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  // 5 回合的出牌序列
  const [selectedCards, setSelectedCards] = useState<CardType[]>([
    "charge",
    "attack",
    "defend",
    "charge",
    "ultimate",
  ]);
  const [isLocked, setIsLocked] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number>(0); // 目前選中的卡槽 (0~4)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function fetchStrategy() {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/${studentNumber}/strategy`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.strategy?.cards) {
          setSelectedCards(json.strategy.cards);
        }
        setIsLocked(Boolean(json.strategy?.isLocked));
      } else {
        setStatusMsg({ type: "error", text: json.error || "載入戰術資料失敗" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "連線至伺服器失敗" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentNumber) {
      fetchStrategy();
    }
  }, [studentNumber]);

  function handleSelectCardForSlot(cardType: CardType) {
    if (isLocked) return;
    const next = [...selectedCards];
    next[activeSlot] = cardType;
    setSelectedCards(next);
    // 自動跳到下一個未滿或下一個槽位
    if (activeSlot < 4) {
      setActiveSlot(activeSlot + 1);
    }
  }

  function handleRandomize() {
    if (isLocked) return;
    const types: CardType[] = ["charge", "attack", "defend", "break", "ultimate"];
    // 智能隨機組合：確保有集氣才能放必殺
    const preset = [
      "charge" as CardType,
      types[Math.floor(Math.random() * 4)],
      types[Math.floor(Math.random() * 4)],
      "charge" as CardType,
      "ultimate" as CardType,
    ];
    setSelectedCards(preset);
    setStatusMsg({ type: "success", text: "已為您隨機生成一組平衡出招策略！" });
  }

  async function handleSave(lockNow: boolean = false) {
    try {
      setSaving(true);
      setStatusMsg(null);
      const res = await fetch(`/api/student/${studentNumber}/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: selectedCards,
          isLocked: lockNow ? true : isLocked,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: "error", text: json.error || "儲存失敗" });
        return;
      }
      setIsLocked(json.isLocked);
      setStatusMsg({ type: "success", text: json.message });
    } catch {
      setStatusMsg({ type: "error", text: "儲存發生錯誤" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlock() {
    try {
      setSaving(true);
      const res = await fetch(`/api/student/${studentNumber}/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: selectedCards,
          isLocked: false,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setIsLocked(false);
        setStatusMsg({ type: "success", text: "已解除鎖定，您可以重新調整出招！" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "解鎖失敗" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-pixel text-xs text-amber-400 tracking-widest">
          LOADING TACTICAL ROOM...
        </div>
      </div>
    );
  }

  const opp = data?.opponent;
  const oppAvatar = getAvatarMeta(opp?.avatarId || "pixel-knight");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 font-sans">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/student/${studentNumber}`}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回冒險者大廳</span>
        </Link>
        <span className="font-pixel text-xs text-amber-400">
          5-ROUND TACTICAL DECK
        </span>
      </div>

      {/* 標題橫幅 */}
      <div className="bg-[#101726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <span>🃏</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                本週出牌戰術室
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              第 {data?.weekNumber} 週 • 觀察對手出牌習慣，精心編排 5 回合行動卡！
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>本週已鎖定出牌</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300 text-xs font-bold">
                <Unlock className="w-3.5 h-3.5" />
                <span>編輯中 (尚未鎖定)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 狀態提示 */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50"
              : "bg-rose-950/90 text-rose-300 border border-rose-500/50"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 【情報區：配對對手上週出牌歷史與風格標籤】 */}
      <div className="bg-[#12192a] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              {oppAvatar.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">本週對決對手：{opp?.name}</span>
                <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                  {opp?.isBot ? "BOT" : "MATCHED"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                職業：{oppAvatar.name} • 奧義：【{oppAvatar.skillName}】
              </p>
            </div>
          </div>

          {/* 風格標籤 */}
          <div className="text-left sm:text-right space-y-0.5">
            <span className="inline-block text-xs font-black text-amber-300 bg-slate-900 border border-amber-400/40 px-2.5 py-1 rounded-lg">
              {opp?.styleTag}
            </span>
            <p className="text-[11px] text-slate-400">{opp?.styleDesc}</p>
          </div>
        </div>

        {/* 對手上週 5 回合出牌序列 */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-medium">📜 對手上週出牌歷史序列 (Round 1 ~ 5)：</span>
            <span className="text-[11px] text-slate-500">供本週戰術博弈參考</span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {opp?.pastCards?.map((cardType: CardType, idx: number) => {
              const meta = CARDS_INFO[cardType] || CARDS_INFO.attack;
              return (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-b ${meta.bgColor} border ${meta.borderColor} text-center space-y-1 shadow-md`}
                >
                  <div className="text-[10px] text-slate-400 font-pixel">R{idx + 1}</div>
                  <div className="text-xl sm:text-2xl">{meta.icon}</div>
                  <div className={`font-bold text-xs ${meta.textColor}`}>{meta.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 【下半部：5 個出招卡槽 (Round 1 至 Round 5)】 */}
      <div className="bg-[#101726] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>🎯</span>
              <span>我的 5 回合出招卡槽</span>
            </h2>
            <p className="text-xs text-slate-400">
              點擊欲更換的卡槽（R1~R5），再從下方選擇行動卡填入。
            </p>
          </div>

          {!isLocked && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                <span>隨機推薦出招</span>
              </button>
            </div>
          )}
        </div>

        {/* 5 個卡槽 */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {selectedCards.map((cardType, idx) => {
            const meta = CARDS_INFO[cardType];
            const isCurrent = activeSlot === idx;
            return (
              <div
                key={idx}
                onClick={() => !isLocked && setActiveSlot(idx)}
                className={`relative p-3 sm:p-4 rounded-xl bg-gradient-to-b ${meta.bgColor} border-2 transition-all cursor-pointer text-center space-y-1 sm:space-y-2 select-none ${
                  isCurrent
                    ? "border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-xl shadow-amber-400/20"
                    : `${meta.borderColor} hover:scale-[1.02]`
                } ${isLocked ? "cursor-default" : ""}`}
              >
                <div className="text-[10px] font-pixel text-amber-300">
                  ROUND {idx + 1}
                </div>
                <div className="text-2xl sm:text-3xl my-1">{meta.icon}</div>
                <div className={`font-black text-xs sm:text-sm ${meta.textColor}`}>
                  {meta.name}
                </div>
                <div className="text-[10px] text-slate-400 hidden sm:block truncate">
                  {meta.costDesc}
                </div>

                {isCurrent && !isLocked && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-black font-pixel text-[8px] font-bold">
                    SELECTING
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 下方卡片庫：可點選填入所選卡槽 */}
        {!isLocked && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>點選填入第 {activeSlot + 1} 回合卡槽：</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {(Object.keys(CARDS_INFO) as CardType[]).map((type) => {
                const meta = CARDS_INFO[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectCardForSlot(type)}
                    className={`p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border ${meta.borderColor} text-left space-y-1 transition-all active:scale-95 group`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{meta.icon}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {meta.costDesc}
                      </span>
                    </div>
                    <div className={`font-bold text-xs ${meta.textColor} group-hover:underline`}>
                      {meta.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      {meta.effect}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 出牌相剋指南迷你提示 */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>相剋博弈速查口訣：</span>
          </div>
          <p className="leading-relaxed">
            🛡️ <strong className="text-slate-200">防守</strong> 擋攻擊與必殺 • 🌀 <strong className="text-slate-200">瓦解</strong> 破防守重傷 • ⚔️ <strong className="text-slate-200">攻擊</strong> 斷瓦解與集氣 • 💥 <strong className="text-slate-200">必殺</strong> 需耗 3 氣。
          </p>
        </div>

        {/* 底部操作按鈕 */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          {isLocked ? (
            <button
              type="button"
              onClick={handleUnlock}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>解除鎖定並重新編排</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>儲存為草稿</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>鎖定本週出招策略</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
