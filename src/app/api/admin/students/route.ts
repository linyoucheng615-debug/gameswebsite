import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      where: {
        studentNumber: { not: "BOT-999" },
      },
      orderBy: { studentNumber: "asc" },
    });
    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("GET /api/admin/students error:", error);
    return NextResponse.json({ error: "取得學生列表失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "未授權操作" }, { status: 401 });
    }

    const body = await req.json();
    const { studentNumber, name, gender } = body;

    if (!studentNumber || !name) {
      return NextResponse.json({ error: "學號與姓名為必填" }, { status: 400 });
    }

    const formattedNumber = studentNumber.trim().toUpperCase();
    const existing = await prisma.student.findUnique({
      where: { studentNumber: formattedNumber },
    });

    if (existing) {
      return NextResponse.json({ error: `學號 ${formattedNumber} 已存在` }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        studentNumber: formattedNumber,
        name: name.trim(),
        gender: gender === "GIRL" ? "GIRL" : "BOY",
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error("POST /api/admin/students error:", error);
    return NextResponse.json({ error: "新增學生失敗" }, { status: 500 });
  }
}

