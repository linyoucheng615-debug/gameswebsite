import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekId = searchParams.get("weekId");

    const weeks = await prisma.academicWeek.findMany({
      orderBy: { weekNumber: "desc" },
    });

    if (weeks.length === 0) {
      return NextResponse.json({ weeks: [], questions: [] });
    }

    const targetWeekId = weekId || weeks[0].id;

    const questions = await prisma.weeklyQuizQuestion.findMany({
      where: { weekId: targetWeekId },
      orderBy: { createdAt: "asc" },
    });

    const parsedQuestions = questions.map((q) => {
      let options = ["A", "B", "C", "D"];
      try {
        options = JSON.parse(q.options);
      } catch {
        // fallback
      }
      return {
        id: q.id,
        weekId: q.weekId,
        category: q.category,
        questionText: q.questionText,
        options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        createdAt: q.createdAt,
      };
    });

    return NextResponse.json({
      weeks,
      currentWeekId: targetWeekId,
      questions: parsedQuestions,
    });
  } catch (error: any) {
    console.error("GET /api/admin/quests error:", error);
    return NextResponse.json({ error: "取得題庫失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await req.json();
    const { action, weekId } = body;

    if (!weekId) {
      return NextResponse.json({ error: "缺少 weekId" }, { status: 400 });
    }

    // 模式 1: 批次生成單字題庫
    if (action === "batch_vocab") {
      const { rawText } = body;
      if (!rawText || typeof rawText !== "string") {
        return NextResponse.json({ error: "請提供單字內容" }, { status: 400 });
      }

      // 解析單字列表：每一行支援 "apple, 蘋果" 或 "apple - 蘋果" 或 "apple 蘋果"
      const lines = rawText.split(/\r?\n/);
      const vocabList: { en: string; ch: string }[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        let parts = trimmed.split(/[,:\t\-]+/).map((s) => s.trim()).filter(Boolean);
        if (parts.length < 2) {
          parts = trimmed.split(/\s+/).map((s) => s.trim()).filter(Boolean);
        }

        if (parts.length >= 2) {
          vocabList.push({ en: parts[0], ch: parts.slice(1).join(" ") });
        }
      }

      if (vocabList.length < 4) {
        return NextResponse.json(
          { error: "請至少提供 4 個單字以產生 4 選 1 選項" },
          { status: 400 }
        );
      }

      // 先清除該週舊有的 VOCAB 題目
      await prisma.weeklyQuizQuestion.deleteMany({
        where: {
          weekId,
          category: "VOCAB",
        },
      });

      // 為每個單字建立一題
      const createdQuestions = [];
      const allChinese = vocabList.map((v) => v.ch);

      for (const item of vocabList) {
        // 從其他中文中挑選 3 個干擾選項
        const otherChinese = allChinese.filter((ch) => ch !== item.ch);
        // 洗牌
        const shuffled = [...otherChinese].sort(() => 0.5 - Math.random());
        const distractors = shuffled.slice(0, 3);

        const options = [item.ch, ...distractors].sort(() => 0.5 - Math.random());

        const created = await prisma.weeklyQuizQuestion.create({
          data: {
            weekId,
            category: "VOCAB",
            questionText: `請選出單字「${item.en}」的正確中文意思：`,
            options: JSON.stringify(options),
            correctAnswer: item.ch,
            explanation: `${item.en}：${item.ch}`,
          },
        });
        createdQuestions.push(created);
      }

      return NextResponse.json({
        success: true,
        message: `成功匯入並生成 ${createdQuestions.length} 道 4 選 1 單字測驗題！`,
        count: createdQuestions.length,
      });
    }

    // 模式 2: 新增或更新單一題目 (MATH, CHINESE, ENGLISH, VOCAB)
    const { id, category, questionText, options, correctAnswer, explanation } = body;

    if (!category || !questionText || !options || !correctAnswer) {
      return NextResponse.json({ error: "請填寫完整題目欄位" }, { status: 400 });
    }

    const optionsStr = Array.isArray(options) ? JSON.stringify(options) : options;

    if (id) {
      const updated = await prisma.weeklyQuizQuestion.update({
        where: { id },
        data: {
          category,
          questionText: questionText.trim(),
          options: optionsStr,
          correctAnswer: correctAnswer.trim(),
          explanation: explanation ? explanation.trim() : null,
        },
      });
      return NextResponse.json({ success: true, question: updated });
    } else {
      const created = await prisma.weeklyQuizQuestion.create({
        data: {
          weekId,
          category,
          questionText: questionText.trim(),
          options: optionsStr,
          correctAnswer: correctAnswer.trim(),
          explanation: explanation ? explanation.trim() : null,
        },
      });
      return NextResponse.json({ success: true, question: created });
    }
  } catch (error: any) {
    console.error("POST /api/admin/quests error:", error);
    return NextResponse.json({ error: error.message || "出題失敗" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const weekId = searchParams.get("weekId");
    const category = searchParams.get("category");

    if (id) {
      await prisma.weeklyQuizQuestion.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "題目已成功刪除" });
    }

    if (weekId && category) {
      await prisma.weeklyQuizQuestion.deleteMany({
        where: { weekId, category },
      });
      return NextResponse.json({ success: true, message: `已清空此分類所有題目` });
    }

    return NextResponse.json({ error: "缺少刪除條件" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/admin/quests error:", error);
    return NextResponse.json({ error: "刪除題目失敗" }, { status: 500 });
  }
}

