"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Swords,
  Shield,
  Zap,
} from "lucide-react";
import PixelFighterSprite, {
  SkinGender,
  SkinClass,
  SkinColor,
  FighterAction,
} from "@/components/PixelFighterSprite";

const GENDER_OPTIONS: { id: SkinGender; name: string; desc: string; icon: string }[] = [
  { id: "boy", name: "男冒險者", desc: "剛毅短髮，經典熱血勇者體型", icon: "👦" },
  { id: "girl", name: "女冒險者", desc: "靈動馬尾，敏捷矯健戰鬥英姿", icon: "👧" },
];

const CLASS_OPTIONS: { id: SkinClass; name: string; desc: string; weapon: string; icon: string }[] = [
  {
    id: "warrior",
    name: "劍士",
    desc: "精鋼重鎧，手持巨型雙手大劍，攻擊為強勁半月揮斬",
    weapon: "雙手精鋼大劍",
    icon: "⚔️",
  },
  {
    id: "mage",
    name: "法師",
    desc: "奧術長袍，手持寶石晶核法杖，攻擊為聚能魔法球射擊",
    weapon: "寶石晶核法杖",
    icon: "🔮",
  },
  {
    id: "ranger",
    name: "遊俠",
    desc: "羽翼斗篷，手持長弓與箭袋，攻擊為蓄力疾風三連射",
    weapon: "疾風長弓",
    icon: "🏹",
  },
  {
    id: "assassin",
    name: "刺客",
    desc: "夜行蒙面，手持逆握雙刃匕首，攻擊為瞬身破甲雙刺",
    weapon: "暗影雙持匕首",
    icon: "🗡️",
  },
];

const COLOR_OPTIONS: { id: SkinColor; name: string; hex: string; bgClass: string }[] = [
  { id: "blue", name: "經典皇家藍", hex: "#2563eb", bgClass: "bg-blue-600" },
  { id: "red", name: "狂暴烈焰紅", hex: "#dc2626", bgClass: "bg-red-600" },
  { id: "green", name: "自然翡翠綠", hex: "#059669", bgClass: "bg-emerald-600" },
  { id: "purple", name: "暗影虛空紫", hex: "#7c3aed", bgClass: "bg-purple-600" },
  { id: "gold", name: "黃金聖光金", hex: "#d97706", bgClass: "bg-amber-500" },
];

const ACTION_PREVIEWS: { id: FighterAction; name: string }[] = [
  { id: "idle", name: "待機 (Idle)" },
  { id: "attack", name: "攻擊 (Attack)" },
  { id: "defend", name: "防禦 (Defend)" },
  { id: "hurt", name: "受傷 (Hurt)" },
  { id: "win", name: "勝利 (Win)" },
  { id: "die", name: "倒地 (Die)" },
];

export default function CharacterCustomizationPage() {
  const params = useParams();
  const router = useRouter();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentName, setStudentName] = useState("");

  // 自訂狀態
  const [selectedGender, setSelectedGender] = useState<SkinGender>("boy");
  const [selectedClass, setSelectedClass] = useState<SkinClass>("warrior");
  const [selectedColor, setSelectedColor] = useState<SkinColor>("blue");

  // 動作預覽
  const [previewAction, setPreviewAction] = useState<FighterAction>("idle");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    async function fetchCurrentSkin() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/${studentNumber}/character`);
        const json = await res.json();
        if (res.ok) {
          setSelectedGender(json.skinGender || "boy");
          setSelectedClass(json.skinClass || "warrior");
          setSelectedColor(json.skinColor || "blue");
          setStudentName(json.name || "");
        }
      } catch {
        setStatusMsg({ type: "error", text: "無法連線載入當前角色外觀" });
      } finally {
        setLoading(false);
      }
    }

    if (studentNumber) {
      fetchCurrentSkin();
    }
  }, [studentNumber]);

  async function handleSave() {
    try {
      setSaving(true);
      setStatusMsg(null);
      const res = await fetch(`/api/student/${studentNumber}/character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinGender: selectedGender,
          skinClass: selectedClass,
          skinColor: selectedColor,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: "error", text: json.error || "儲存失敗" });
        return;
      }
      setStatusMsg({ type: "success", text: "外觀設定已成功儲存！所有對決將採用新造型！" });
    } catch {
      setStatusMsg({ type: "error", text: "儲存請求發生錯誤" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-pixel text-xs text-amber-400 tracking-widest">
          ENTERING DRESSING ROOM...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 font-sans">
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
          CHARACTER DRESSING ROOM
        </span>
      </div>

      {/* 頁面標題 */}
      <div className="bg-[#101726]/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <span>🧙‍♂️</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                角色更衣室與自訂外觀
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {studentName}（{studentNumber}），自由挑選你的冒險者體型、戰鬥職業與專屬配色！
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "儲存中..." : "儲存自訂外觀"}</span>
          </button>
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

      {/* 核心佈局：左側即時預覽舞台 / 右側自訂選項控制台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左側：即時預覽舞台 (5 格) */}
        <div className="lg:col-span-5 bg-[#0f1523] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
          {/* 背景微光 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-amber-500/5 pointer-events-none" />

          <div className="text-center w-full z-10 space-y-1">
            <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
              LIVE PREVIEW
            </span>
            <div className="text-base font-bold text-white mt-1">
              {studentName} 的戰鬥立繪
            </div>
          </div>

          {/* 角色展示中央基座 */}
          <div className="my-8 flex flex-col items-center justify-center relative min-h-[220px]">
            <PixelFighterSprite
              gender={selectedGender}
              charClass={selectedClass}
              color={selectedColor}
              action={previewAction}
              size={180}
            />
            {/* 發光石階地磚基座 */}
            <div className="w-36 h-6 -mt-3 bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20 rounded-full blur-[2px] border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.5)]" />
          </div>

          {/* 動作切換測試按鈕群 */}
          <div className="w-full z-10 space-y-2">
            <div className="text-[11px] text-slate-400 font-medium text-center">
              點擊預覽不同戰鬥動作姿態：
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACTION_PREVIEWS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setPreviewAction(act.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    previewAction === act.id
                      ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {act.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側：3 大自訂面板 (7 格) */}
        <div className="lg:col-span-7 bg-[#101726] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-7 shadow-xl">
          {/* 維度 1：性別 / 體型 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="text-amber-400">1.</span>
              <span>選擇冒險者性別與體型</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGender(g.id)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                    selectedGender === g.id
                      ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/30"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        selectedGender === g.id ? "text-amber-300" : "text-white"
                      }`}
                    >
                      {g.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {g.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 維度 2：戰鬥職業 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="text-amber-400">2.</span>
              <span>選擇戰鬥職業（影響武器與攻擊動作）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLASS_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClass(c.id)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all space-y-1 cursor-pointer ${
                    selectedClass === c.id
                      ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/30"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <span className={selectedClass === c.id ? "text-amber-300" : ""}>
                        {c.name}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {c.weapon}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {c.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 維度 3：配色主題 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="text-amber-400">3.</span>
              <span>選擇專屬配色光暈</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedColor(col.id)}
                  className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    selectedColor === col.id
                      ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 scale-105"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full ${col.bgClass} shadow-md`}
                    style={{ backgroundColor: col.hex }}
                  />
                  <span
                    className={`text-[11px] font-bold ${
                      selectedColor === col.id ? "text-amber-300" : "text-slate-300"
                    }`}
                  >
                    {col.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 儲存按鈕 */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "正在儲存外觀..." : "確認並套用外觀"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

