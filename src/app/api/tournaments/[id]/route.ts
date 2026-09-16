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

