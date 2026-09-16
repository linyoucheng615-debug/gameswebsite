export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, setAuthCookie, COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@/types";

export async function POST(req: Request) {
  try {
    const { studentId, password } = await req.json();

    if (!studentId || !password) {
      return NextResponse.json(
        { error: "請輸入學號與密碼" },
        { status: 400 }
      );
    }

    const trimmedStudentId = studentId.trim();

    // 查找使用者
    const user = await prisma.user.findUnique({
      where: { studentId: trimmedStudentId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "學號或密碼不正確" },
        { status: 401 }
      );
    }

    // 驗證密碼
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "學號或密碼不正確" },
        { status: 401 }
      );
    }

    // 簽發 JWT Token
    const token = await signToken({
      userId: user.id,
      studentId: user.studentId,
      role: user.role as UserRole,
    });

    setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("[AUTH ERROR]:", error);
    return NextResponse.json(
      { error: error?.message || "伺服器內部錯誤", details: error?.stack },
      { status: 500 }
    );
  }
}

