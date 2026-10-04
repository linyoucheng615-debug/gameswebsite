import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_GENDERS = ["boy", "girl"];
const VALID_CLASSES = ["warrior", "mage", "ranger", "assassin"];
const VALID_COLORS = ["blue", "red", "green", "purple", "gold"];

export async function GET(
  _req: NextRequest,
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

    return NextResponse.json({
      studentNumber: student.studentNumber,
      name: student.name,
      skinGender: student.skinGender || "boy",
      skinClass: student.skinClass || "warrior",
      skinColor: student.skinColor || "blue",
    });
  } catch (error: any) {
    console.error("GET /api/student/[studentNumber]/character error:", error);
    return NextResponse.json({ error: "取得角色外觀資料失敗" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    const body = await req.json();
    const { skinGender, skinClass, skinColor } = body;

    if (!VALID_GENDERS.includes(skinGender)) {
      return NextResponse.json({ error: "無效的性別選項" }, { status: 400 });
    }
    if (!VALID_CLASSES.includes(skinClass)) {
      return NextResponse.json({ error: "無效的職業選項" }, { status: 400 });
    }
    if (!VALID_COLORS.includes(skinColor)) {
      return NextResponse.json({ error: "無效的配色主題" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json({ error: "查無此學生" }, { status: 404 });
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        skinGender,
        skinClass,
        skinColor,
      },
    });

    return NextResponse.json({
      success: true,
      message: "角色外觀已成功儲存！",
      skinGender: updated.skinGender,
      skinClass: updated.skinClass,
      skinColor: updated.skinColor,
    });
  } catch (error: any) {
    console.error("POST /api/student/[studentNumber]/character error:", error);
    return NextResponse.json({ error: "儲存角色外觀失敗" }, { status: 500 });
  }
}
