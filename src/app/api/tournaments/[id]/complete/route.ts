export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/tournaments/[id]/complete - 管理員完結比賽
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "權限不足，僅賽事管理員可結束比賽" },
        { status: 403 }
      );
    }

    const { id } = params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    // 更新賽事狀態為已完賽
    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        status: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      message: `賽事【${tournament.name}】已正式結束！榮譽殿堂與冠軍名單已出爐。`,
      tournament: updated,
    });
  } catch (error) {
    console.error("Complete tournament error:", error);
    return NextResponse.json(
      { error: "結束賽事失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

