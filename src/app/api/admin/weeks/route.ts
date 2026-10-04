import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const weeks = await prisma.academicWeek.findMany({
      orderBy: { weekNumber: "desc" },
      include: {
        _count: {
          select: {
            homeworkRecords: true,
            examScores: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json({ weeks });
  } catch (error: any) {
    console.error("GET /api/admin/weeks error:", error);
    return NextResponse.json({ error: "取得週次列表失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權操作" }, { status: 401 });
    }

    const body = await req.json();
    const { weekNumber, title } = body;

    if (!weekNumber || !title) {
      return NextResponse.json({ error: "請填妥週次編號與單元名稱" }, { status: 400 });
    }

    const existing = await prisma.academicWeek.findUnique({
      where: { weekNumber: Number(weekNumber) },
    });

    if (existing) {
      return NextResponse.json({ error: `第 ${weekNumber} 週已存在` }, { status: 400 });
    }

    const week = await prisma.academicWeek.create({
      data: {
        weekNumber: Number(weekNumber),
        title: title.trim(),
        isSettled: false,
      },
    });

    // 自動為全班學生建立預設作業記錄 (COMPLETED)
    const students = await prisma.student.findMany({
      where: {
        studentNumber: { not: "BOT-999" },
      },
    });

    if (students.length > 0) {
      await prisma.$transaction(
        students.map((s) =>
          prisma.homeworkRecord.create({
            data: {
              weekId: week.id,
              studentId: s.id,
              status: "COMPLETED",
              missingScope: null,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, week });
  } catch (error: any) {
    console.error("POST /api/admin/weeks error:", error);
    return NextResponse.json({ error: "建立週次失敗" }, { status: 500 });
  }
}

