import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const { id } = params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: {
          select: { id: true, studentId: true, name: true, nickname: true },
        },
        player2: {
          select: { id: true, studentId: true, name: true, nickname: true },
        },
        reporter: {
          select: { id: true, nickname: true, role: true },
        },
        tournament: {
          select: { id: true, name: true, format: true, status: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "找不到該場對局" }, { status: 404 });
    }

    const isParticipant =
      user && (match.player1Id === user.id || match.player2Id === user.id);
    const isAdmin = user?.role === "admin";
    const canReport =
      Boolean(user) &&
      (isAdmin || (isParticipant && match.status === "pending"));

    return NextResponse.json({
      match,
      userRole: user?.role || null,
      canReport,
      isParticipant,
    });
  } catch (error) {
    console.error("Fetch match error:", error);
    return NextResponse.json({ error: "取得對局資訊失敗" }, { status: 500 });
  }
}

