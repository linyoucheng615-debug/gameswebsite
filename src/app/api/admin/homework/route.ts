import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekId = searchParams.get("weekId");

    // 若未指定 weekId，取得最新一週
    let targetWeek = null;
    if (weekId) {
      targetWeek = await prisma.academicWeek.findUnique({ where: { id: weekId } });
    } else {
      targetWeek = await prisma.academicWeek.findFirst({ orderBy: { weekNumber: "desc" } });
    }

    if (!targetWeek) {
      return NextResponse.json({ week: null, records: [], students: [] });
    }

    // 取得所有學生
    const students = await prisma.student.findMany({
      orderBy: { studentNumber: "asc" },
    });

    // 取得當週作業記錄
    let records = await prisma.homeworkRecord.findMany({
      where: { weekId: targetWeek.id },
      include: { student: true },
    });

    // 若有學生尚未有當週記錄，自動補建 (completed)
    const existingStudentIds = new Set(records.map((r) => r.studentId));
    const missingStudents = students.filter((s) => !existingStudentIds.has(s.id));

    if (missingStudents.length > 0) {
      for (const s of missingStudents) {
        const created = await prisma.homeworkRecord.create({
          data: {
            weekId: targetWeek.id,
            studentId: s.id,
            status: "completed",
            missingScope: null,
            hasBuff: true,
          },
          include: { student: true },
        });
        records.push(created);
      }
    }

    // 依照學號排序
    records.sort((a, b) => a.student.studentNumber.localeCompare(b.student.studentNumber, undefined, { numeric: true }));

    return NextResponse.json({
      week: targetWeek,
      records: records.map((r) => ({
        id: r.id,
        weekId: r.weekId,
        studentId: r.studentId,
        studentNumber: r.student.studentNumber,
        name: r.student.name,
        avatarId: r.student.avatarId,
        parentPhone: r.student.parentPhone,
        status: r.status,
        missingScope: r.missingScope,
        hasBuff: r.hasBuff,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/homework error:", error);
    return NextResponse.json({ error: "取得作業名單失敗" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權操作" }, { status: 401 });
    }

    const body = await req.json();
    const { weekId, records, singleUpdate } = body;

    if (!weekId) {
      return NextResponse.json({ error: "缺少 weekId" }, { status: 400 });
    }

    // 支援單筆更新
    if (singleUpdate) {
      const { studentId, status, missingScope } = singleUpdate;
      const isCompleted = status === "completed";
      const hasBuff = isCompleted;

      const updated = await prisma.homeworkRecord.upsert({
        where: {
          weekId_studentId: {
            weekId,
            studentId,
          },
        },
        update: {
          status,
          missingScope: isCompleted ? null : missingScope || null,
          hasBuff,
        },
        create: {
          weekId,
          studentId,
          status,
          missingScope: isCompleted ? null : missingScope || null,
          hasBuff,
        },
      });

      return NextResponse.json({ success: true, record: updated });
    }

    // 支援批次更新
    if (Array.isArray(records)) {
      for (const item of records) {
        const isCompleted = item.status === "completed";
        await prisma.homeworkRecord.upsert({
          where: {
            weekId_studentId: {
              weekId,
              studentId: item.studentId,
            },
          },
          update: {
            status: item.status,
            missingScope: isCompleted ? null : item.missingScope || null,
            hasBuff: isCompleted,
          },
          create: {
            weekId,
            studentId: item.studentId,
            status: item.status,
            missingScope: isCompleted ? null : item.missingScope || null,
            hasBuff: isCompleted,
          },
        });
      }
      return NextResponse.json({ success: true, count: records.length });
    }

    return NextResponse.json({ error: "未提供更新資料" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT /api/admin/homework error:", error);
    return NextResponse.json({ error: "更新作業狀態失敗" }, { status: 500 });
  }
}
