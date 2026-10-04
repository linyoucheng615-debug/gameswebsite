"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { StudentBattleViewData } from "@/types";
import BattleArenaPlayer from "@/components/BattleArenaPlayer";

export default function StudentBattlePage() {
  const params = useParams();
  const router = useRouter();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [data, setData] = useState<StudentBattleViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!studentNumber) return;

    async function fetchBattleData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/battle/${studentNumber}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || "查無此學號資料");
          return;
        }
        setData(json);
      } catch {
        setErrorMsg("連線至伺服器失敗，請稍後重試");
      } finally {
        setLoading(false);
      }
    }

    fetchBattleData();
  }, [studentNumber]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-pixel text-xs text-amber-400 tracking-widest">
          LOADING 5-ROUND STRATEGY ARENA...
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111827] border-2 border-rose-500/60 p-8 rounded-2xl text-center space-y-5 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">查無學生資料</h2>
          <p className="text-xs text-slate-300 font-sans">{errorMsg}</p>
          <Link
            href={`/student/${studentNumber || ""}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回冒險者大廳</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <Link
          href={`/student/${studentNumber}`}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回冒險者大廳</span>
        </Link>
        <span className="font-pixel text-xs text-amber-400">
          5-ROUND ARCADE CLASH
        </span>
      </div>

      <BattleArenaPlayer
        data={data}
        onClose={() => router.push(`/student/${studentNumber}`)}
        autoStart={true}
      />
    </div>
  );
}

