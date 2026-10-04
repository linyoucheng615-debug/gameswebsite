import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekId = searchParams.get("weekId");

    let whereClause: any = {};
    if (weekId) {
      whereClause.weekId = weekId;
    }

    const challenges = await (prisma as any).weeklyChallenge.findMany({
      where: whereClause,
      include: {
        week: true,
        answers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const weeks = await prisma.academicWeek.findMany({
      orderBy: { weekNumber: "desc" },
    });

    return NextResponse.json({
      challenges: challenges.map((ch: any) => {
        let parsedOptions = [];
        try {
          parsedOptions = typeof ch.options === "string" ? JSON.parse(ch.options) : ch.options;
        } catch {
          parsedOptions = ["A", "B", "C", "D"];
        }
        return {
          id: ch.id,
          weekId: ch.weekId,
          weekNumber: ch.week?.weekNumber,
          weekTitle: ch.week?.title,
          subject: ch.subject,
          questionText: ch.questionText,
          options: parsedOptions,
          correctAnswer: ch.correctAnswer,
          explanation: ch.explanation,
          answersCount: ch.answers?.length || 0,
        };
      }),
      weeks,
    });
  } catch (error: any) {
    console.error("GET /api/admin/challenges error:", error);
    return NextResponse.json({ error: "取得挑戰題目失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await req.json();
    const { id, weekId, subject, questionText, options, correctAnswer, explanation } = body;

    if (!weekId || !subject || !questionText || !options || !correctAnswer) {
      return NextResponse.json({ error: "請填寫完整題目欄位" }, { status: 400 });
    }

    const optionsStr = typeof options === "string" ? options : JSON.stringify(options);

    if (id) {
      // 更新題目
      const updated = await (prisma as any).weeklyChallenge.update({
        where: { id },
        data: {
          weekId,
          subject,
          questionText,
          options: optionsStr,
          correctAnswer,
          explanation: explanation || null,
        },
      });
      return NextResponse.json({ success: true, challenge: updated });
    } else {
      // 新增題目
      const created = await (prisma as any).weeklyChallenge.create({
        data: {
          weekId,
          subject,
          questionText,
          options: optionsStr,
          correctAnswer,
          explanation: explanation || null,
        },
      });
      return NextResponse.json({ success: true, challenge: created });
    }
  } catch (error: any) {
    console.error("POST /api/admin/challenges error:", error);
    return NextResponse.json({ error: error.message || "儲存挑戰題目失敗" }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: "缺少題目 ID" }, { status: 400 });
    }

    await (prisma as any).weeklyChallenge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/challenges error:", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
