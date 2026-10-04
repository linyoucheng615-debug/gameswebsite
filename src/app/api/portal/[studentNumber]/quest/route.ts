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

    const week = await prisma.academicWeek.findFirst({
      orderBy: { weekNumber: "desc" },
    });

    if (!week) {
      return NextResponse.json({ error: "查無週次" }, { status: 404 });
    }

    const body = await req.json();
    const { category, answers } = body; // category: 'MATH' | 'CHINESE' | 'ENGLISH' | 'VOCAB', answers: Record<questionId, selectedOption>

    if (!category || !answers) {
      return NextResponse.json({ error: "請提供作答類別與答案" }, { status: 400 });
    }

    // 取得該類別題目
    const questions = await prisma.weeklyQuizQuestion.findMany({
      where: { weekId: week.id, category },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "該類別暫無題目" }, { status: 400 });
    }

    // 批改答案
    let correctCount = 0;
    for (const q of questions) {
      const userAns = answers[q.id];
      if (userAns && userAns.trim() === q.correctAnswer.trim()) {
        correctCount += 1;
      }
    }

    const totalCount = questions.length;
    // 開卷翻書，答對 60% 以上視為通過任務
    const passed = correctCount >= Math.ceil(totalCount * 0.6);

    if (passed) {
      const updateData: any = { hasUnlockedChip: true };
      if (category === "MATH") updateData.completedMath = true;
      if (category === "CHINESE") updateData.completedChinese = true;
      if (category === "ENGLISH") updateData.completedEnglish = true;
      if (category === "VOCAB") updateData.completedVocab = true;

      await prisma.studentWeeklyQuestLog.upsert({
        where: {
          studentId_weekId: {
            studentId: student.id,
            weekId: week.id,
          },
        },
        update: updateData,
        create: {
          studentId: student.id,
          weekId: week.id,
          completedMath: category === "MATH",
          completedChinese: category === "CHINESE",
          completedEnglish: category === "ENGLISH",
          completedVocab: category === "VOCAB",
          hasUnlockedChip: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      passed,
      correctCount,
      totalCount,
      message: passed
        ? "🎉 勤勉達標！【逆境破甲】晶片已解鎖！"
        : `完成 ${correctCount}/${totalCount} 題，未達 60% 及格門檻，可翻書再次挑戰！`,
    });
  } catch (error: any) {
    console.error("POST /api/portal/[studentNumber]/quest error:", error);
    return NextResponse.json({ error: error.message || "自主修練作答失敗" }, { status: 500 });
  }
}

