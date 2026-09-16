export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "權限不足，僅系統管理員可存取" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json({ error: "取得使用者列表失敗" }, { status: 500 });
  }
}

