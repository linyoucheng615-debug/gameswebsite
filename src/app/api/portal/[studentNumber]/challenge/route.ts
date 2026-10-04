import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    if (!rawStudentNum) {
      return NextResponse.json({ error: "請提供學號" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json({ error: "查無此學生" }, { status: 404 });
    }

    const body = await req.json();
    const { challengeId, selectedOption } = body;

    if (!challengeId || !selectedOption) {
      return NextResponse.json({ error: "缺少題目 ID 或選擇項目" }, { status: 400 });
    }

    const challenge = await (prisma as any).weeklyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: "查無此挑戰題目" }, { status: 404 });
    }

    // 檢查答案是否正確
    const isCorrect = selectedOption.trim() === challenge.correctAnswer.trim();

    // 寫入或更新作答紀錄
    await (prisma as any).studentChallengeAnswer.upsert({
      where: {
        studentId_challengeId: {
          studentId: student.id,
          challengeId: challenge.id,
        },
      },
      update: {
        isCorrect,
        answeredAt: new Date(),
      },
      create: {
        studentId: student.id,
        challengeId: challenge.id,
        isCorrect,
      },
    });

    // 檢查當週全部題目是否都已答對
    const allWeekChallenges = await (prisma as any).weeklyChallenge.findMany({
      where: { weekId: challenge.weekId },
    });

    const userAnswers = await (prisma as any).studentChallengeAnswer.findMany({
      where: {
        studentId: student.id,
        challenge: {
          weekId: challenge.weekId,
        },
      },
    });

    const allCorrect =
      allWeekChallenges.length >= 3 &&
      allWeekChallenges.every((c: any) => {
        const a = userAnswers.find((ans: any) => ans.challengeId === c.id);
        return a && a.isCorrect;
      });

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer: challenge.correctAnswer,
      explanation: challenge.explanation,
      allChallengesCorrect: allCorrect,
    });
  } catch (error: any) {
    console.error("POST /api/portal/[studentNumber]/challenge error:", error);
    return NextResponse.json({ error: error.message || "作答提交失敗" }, { status: 500 });
  }
}
