"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Zap,
  Award,
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  correctAnswer: string;
  options: string[];
  type: "en_to_zh" | "zh_to_en";
}

interface PlayerStatus {
  level: number;
  levelTitle: string;
  currentExp: number;
  nextLevelExp: number;
  coins: number;
  dailyQuizCount: number;
  maxDailyQuiz: number;
  canEarnRewards: boolean;
}

export default function StudentQuizPage() {
  const params = useParams();
  const studentNumber = (params?.studentNumber as string)?.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null);

  // 測驗進行狀態
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settlementResult, setSettlementResult] = useState<any>(null);

  async function loadQuizData() {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setCurrentIndex(0);
      setCorrectCount(0);
      setQuizFinished(false);
      setSettlementResult(null);

      const res = await fetch(`/api/student/${studentNumber}/quiz`);
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "無法取得單字測驗");
        return;
      }

      setQuestions(json.questions || []);
      setPlayerStatus(json.playerStatus);
    } catch {
      setErrorMsg("連線至題庫伺服器失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentNumber) {
      loadQuizData();
    }
  }, [studentNumber]);

  function handleOptionClick(opt: string) {
    if (isAnswerChecked || quizFinished) return;
    setSelectedAnswer(opt);
    setIsAnswerChecked(true);

    const currentQ = questions[currentIndex];
    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    // 延遲 1.2 秒自動進入下一題
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
      } else {
        // 完成全部 10 題，自動結算
        handleFinishQuiz(isCorrect ? correctCount + 1 : correctCount);
      }
    }, 1200);
  }

  async function handleFinishQuiz(finalScore: number) {
    setQuizFinished(true);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/${studentNumber}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctCount: finalScore }),
      });
      const json = await res.json();
      if (res.ok) {
        setSettlementResult(json);
        if (json.playerStatus) {
          setPlayerStatus(json.playerStatus);
        }
      }
    } catch (err) {
      console.error("結算失敗:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-pixel text-xs text-amber-400 tracking-widest">
          SUMMONING VOCABULARY DOJO...
        </div>
      </div>
    );
  }

  if (errorMsg || questions.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111827] border-2 border-slate-700 p-8 rounded-2xl text-center space-y-5 shadow-2xl">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">單字道場準備中</h2>
          <p className="text-xs text-slate-300 font-sans">
            {errorMsg || "題庫單字尚不足，請先請老師於後台單字庫匯入單字！"}
          </p>
          <Link
            href={`/student/${studentNumber}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回大廳</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + (isAnswerChecked ? 1 : 0)) / questions.length) * 100;
  const expPercent = playerStatus
    ? Math.min(100, Math.round((playerStatus.currentExp / playerStatus.nextLevelExp) * 100))
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 font-sans">
      {/* 頂部導航與玩家 EXP/金幣 狀態列 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/student/${studentNumber}`}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回大廳</span>
        </Link>
        <span className="font-pixel text-xs text-emerald-400">
          VOCABULARY TRAINING DOJO
        </span>
      </div>

      {/* 玩家經驗值與金幣儀表板 */}
      {playerStatus && (
        <div className="bg-[#101726]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* 等級與稱號 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md flex items-center justify-center font-pixel text-sm text-slate-950 font-black">
                Lv.{playerStatus.level}
              </div>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{playerStatus.levelTitle}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  EXP: {playerStatus.currentExp} / {playerStatus.nextLevelExp}
                </div>
              </div>
            </div>

            {/* 金幣與每日次數標籤 */}
            <div className="flex items-center gap-3">
              {/* 金幣數 */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-sm">{playerStatus.coins}</span>
                <span className="text-[10px] text-amber-400/80">金幣</span>
              </div>

              {/* 今日結算次數 */}
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">今日獎勵：</span>
                <span className="font-mono font-bold text-emerald-400">
                  {playerStatus.dailyQuizCount} / {playerStatus.maxDailyQuiz} 次
                </span>
              </div>
            </div>
          </div>

          {/* EXP 進度條 */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 測驗舞台 */}
      {!quizFinished ? (
        <div className="bg-[#101726] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* 題目進度條 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">
                QUESTION {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-slate-400">
                目前答對：<strong className="text-emerald-400">{correctCount}</strong> 題
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 題目卡片 */}
          <div className="py-6 sm:py-10 text-center space-y-2 bg-[#0c121e] rounded-xl border border-slate-800/80 shadow-inner">
            <div className="inline-block px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-mono mb-1">
              {currentQ.type === "en_to_zh" ? "請選出正確的中文釋義" : "請選出正確的英文單字"}
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-wide">
              {currentQ.question}
            </div>
          </div>

          {/* 四選一按鈕清單 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectAnswer = opt === currentQ.correctAnswer;

              let btnStyle = "bg-slate-900 border-slate-700/80 hover:border-amber-400 text-white";
              if (isAnswerChecked) {
                if (isCorrectAnswer) {
                  btnStyle = "bg-emerald-950 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20";
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = "bg-rose-950 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20";
                } else {
                  btnStyle = "bg-slate-900/60 border-slate-800 text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswerChecked}
                  onClick={() => handleOptionClick(opt)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left font-bold text-sm sm:text-base cursor-pointer active:scale-[0.98] ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs text-slate-400">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswerChecked && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isAnswerChecked && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* 結算結業報告卡片 */
        <div className="bg-[#101726] border-2 border-amber-400/80 rounded-2xl p-6 sm:p-10 space-y-6 shadow-2xl text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center text-3xl shadow-lg">
            🏆
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              單字道場修練完成！
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              本次 10 題測驗共答對{" "}
              <strong className="text-emerald-400 font-mono text-base sm:text-lg">
                {correctCount}
              </strong>{" "}
              題
            </p>
          </div>

          {/* 獎勵結算卡片 */}
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 max-w-md mx-auto space-y-3">
            <div className="text-xs font-bold text-slate-400">本次獲得修練獎勵</div>

            {settlementResult?.canEarnReward ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-0.5">
                  <div className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>獲得經驗值</span>
                  </div>
                  <div className="font-pixel text-lg text-white">
                    +{settlementResult.earnedExp} EXP
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-yellow-950/40 border border-yellow-500/40 space-y-0.5">
                  <div className="text-xs text-yellow-300 font-semibold flex items-center justify-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span>獲得金幣</span>
                  </div>
                  <div className="font-pixel text-lg text-white">
                    +{settlementResult.earnedCoins} 💰
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-800 text-slate-300 text-xs">
                ⚠️ 今日獎勵次數已達上限 (3/3)，本次測驗為純鍛鍊練習，未增加 EXP 與金幣。明天將重置次數！
              </div>
            )}

            {settlementResult?.leveledUp && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400 text-amber-300 font-bold text-xs animate-bounce flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>恭喜升等！晉升為 Lv.{playerStatus?.level} {playerStatus?.levelTitle}！</span>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadQuizData}
              className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再來挑戰一輪</span>
            </button>

            <Link
              href={`/student/${studentNumber}`}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回冒險者大廳</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
