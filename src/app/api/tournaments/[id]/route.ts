export const dynamic = "force-dynamic";

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

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, nickname: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, studentId: true, name: true, nickname: true, role: true },
            },
          },
          orderBy: [
            { currentScore: "desc" },
            { seed: "asc" },
          ],
        },
        matches: {
          include: {
            player1: {
              select: { id: true, studentId: true, name: true, nickname: true },
            },
            player2: {
              select: { id: true, studentId: true, name: true, nickname: true },
            },
            reporter: {
              select: { id: true, nickname: true },
            },
          },
          orderBy: [
            { stage: "asc" },
            { round: "asc" },
            { bracketPosition: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    const isJoined = Boolean(
      user && tournament.participants.some((p) => p.userId === user.id)
    );

    const isOrganizer = Boolean(
      user && (user.role === "admin" || tournament.createdBy === user.id)
    );

    return NextResponse.json({
      tournament,
      currentUser: user,
      isJoined,
      isAdmin: user?.role === "admin",
      isOrganizer,
    });
  } catch (error) {
    console.error("Fetch tournament details error:", error);
    return NextResponse.json({ error: "取得賽事詳情失敗" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { id } = params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    // Permission check: Global admin or the tournament creator
    const isAuthorized = user.role === "admin" || tournament.createdBy === user.id;
    if (!isAuthorized) {
      return NextResponse.json({ error: "無權限刪除此賽事" }, { status: 403 });
    }

    // Cascade delete in transaction
    await prisma.$transaction([
      prisma.match.deleteMany({ where: { tournamentId: id } }),
      prisma.tournamentParticipant.deleteMany({ where: { tournamentId: id } }),
      prisma.tournament.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: `賽事「${tournament.name}」已成功刪除` });
  } catch (error: any) {
    console.error("Delete tournament error:", error);
    return NextResponse.json(
      { error: error?.message || "刪除賽事失敗" },
      { status: 500 }
    );
  }
}

