export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/tournaments - 獲取全部比賽列表
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        creator: {
          select: { id: true, name: true, nickname: true },
        },
        _count: {
          select: { participants: true, matches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error("List tournaments error:", error);
    return NextResponse.json({ error: "取得賽事列表失敗" }, { status: 500 });
  }
}

// POST /api/tournaments - 建立新賽事 (開放所有登入選手自主建立並成為該賽事主辦人)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入帳號後再發起盃賽" }, { status: 401 });
    }

    const { name, description, format, category, totalRounds, topCut } = await req.json();

    if (!name || !format) {
      return NextResponse.json({ error: "請填寫比賽名稱與賽制" }, { status: 400 });
    }

    const validFormats = ["swiss", "round_robin", "single_elimination"];
    if (!validFormats.includes(format)) {
      return NextResponse.json({ error: "不支援的賽制類型" }, { status: 400 });
    }

    const validCategories = ["esports", "sports", "tcg", "chess", "general"];
    const tournamentCategory = validCategories.includes(category) ? category : "esports";

    const tournament = await prisma.tournament.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        format,
        category: tournamentCategory,
        status: "pending",
        totalRounds: totalRounds ? parseInt(totalRounds, 10) : 3,
        topCut: topCut ? parseInt(topCut, 10) : 4,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "賽事建立成功！",
      tournament,
    });
  } catch (error) {
    console.error("Create tournament error:", error);
    return NextResponse.json({ error: "建立賽事失敗，請稍後再試" }, { status: 500 });
  }
}

