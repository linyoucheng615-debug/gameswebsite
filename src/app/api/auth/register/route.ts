export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie, COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@/types";

export async function POST(req: Request) {
  try {
    const { studentId, name, nickname, password } = await req.json();

    if (!studentId || !name || !nickname || !password) {
      return NextResponse.json(
        { error: "請填寫完整註冊欄位（學號、姓名、暱稱、密碼）" },
        { status: 400 }
      );
    }

    const trimmedStudentId = studentId.trim();
    const trimmedName = name.trim();
    const trimmedNickname = nickname.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密碼長度至少需 6 個字元" },
        { status: 400 }
      );
    }

    // 檢查學號是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { studentId: trimmedStudentId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "此學號已被註冊，請直接登入或聯絡管理員" },
        { status: 409 }
      );
    }

    // 判斷是否為系統首位使用者：首位註冊者自動賦予 admin 權限
    const userCount = await prisma.user.count();
    const role: UserRole = userCount === 0 ? "admin" : "player";

    // 密碼雜湊
    const passwordHash = await hashPassword(password);

    // 建立新使用者
    const newUser = await prisma.user.create({
      data: {
        studentId: trimmedStudentId,
        name: trimmedName,
        nickname: trimmedNickname,
        role: role,
        passwordHash: passwordHash,
      },
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    // 簽發 JWT 並存入 HttpOnly Cookie 實現自動登入
    const token = await signToken({
      userId: newUser.id,
      studentId: newUser.studentId,
      role: newUser.role as UserRole,
    });

    setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      message: role === "admin" ? "註冊成功！您為系統首位使用者，已自動獲取管理員 (Admin) 權限。" : "註冊成功！",
      user: {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
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

