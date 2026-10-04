import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isChipUnlocked, ChipId } from "@/lib/chips";

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
    const { equippedChip } = body as { equippedChip: ChipId };

    if (!equippedChip) {
      return NextResponse.json({ error: "請指定裝備晶片" }, { status: 400 });
    }

    // 檢查晶片是否解鎖
    const score = await prisma.examScore.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: week.id,
        },
      },
    });

    const hw = await prisma.homeworkRecord.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: week.id,
        },
      },
    });

    const questLog = await prisma.studentWeeklyQuestLog.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: week.id,
        },
      },
    });

    const chipQualificationData = {
      chineseScore: score?.chineseScore || 0,
      englishScore: score?.englishScore || 0,
      mathScore: score?.mathScore || 0,
      averageScore: score?.averageScore || 0,
      previousAverage: score?.previousAverage || 0,
      hasHomeworkCompleted: hw?.status === "COMPLETED",
      hasCompletedAnyQuest: questLog?.hasUnlockedChip ?? false,
    };

    const { unlocked, reason } = isChipUnlocked(equippedChip, chipQualificationData);
    if (!unlocked) {
      return NextResponse.json({ error: `尚未達成解鎖條件：${reason}` }, { status: 400 });
    }

    // 儲存裝備晶片 (1/1)
    await prisma.weeklyStudentLoadout.upsert({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: week.id,
        },
      },
      update: {
        equippedChip,
      },
      create: {
        studentId: student.id,
        weekId: week.id,
        equippedChip,
      },
    });

    return NextResponse.json({
      success: true,
      equippedChip,
      message: "✔ 戰術晶片已成功裝備！",
    });
  } catch (error: any) {
    console.error("POST /api/portal/[studentNumber]/loadout error:", error);
    return NextResponse.json({ error: error.message || "裝備晶片失敗" }, { status: 500 });
  }
}
