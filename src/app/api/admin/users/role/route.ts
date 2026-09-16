export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/types";

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "權限不足，僅系統管理員可操作" }, { status: 403 });
    }

    const { targetUserId, newRole } = await req.json();

    if (!targetUserId || (newRole !== "admin" && newRole !== "player")) {
      return NextResponse.json({ error: "無效的參數" }, { status: 400 });
    }

    // 防止將系統唯一管理員降級
    if (newRole === "player") {
      const adminCount = await prisma.user.count({
        where: { role: "admin" },
      });
      if (adminCount <= 1 && currentUser.id === targetUserId) {
        return NextResponse.json(
          { error: "不可拔除系統中唯一的管理員權限，請先指派其他管理員" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as UserRole },
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `已成功將 ${updated.nickname} 的角色變更為 ${newRole === "admin" ? "系統管理員" : "一般選手"}`,
      user: updated,
    });
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json({ error: "角色指派失敗，請稍後再試" }, { status: 500 });
  }
}

