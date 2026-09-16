import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入後再報名參賽" }, { status: 401 });
    }

    const { id } = params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "找不到該賽事" }, { status: 404 });
    }

    if (tournament.status !== "pending") {
      return NextResponse.json(
        { error: "此賽事已截止報名或已在進行中" },
        { status: 400 }
      );
    }

    const alreadyJoined = tournament.participants.some(
      (p) => p.userId === user.id
    );
    if (alreadyJoined) {
      return NextResponse.json(
        { error: "您已成功報名本項賽事，無須重複報名" },
        { status: 400 }
      );
    }

    const nextSeed = tournament.participants.length + 1;

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
        userId: user.id,
        seed: nextSeed,
        currentScore: 0.0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `報名成功！您的種子序號為 #${nextSeed}`,
      participant,
    });
  } catch (error) {
    console.error("Join tournament error:", error);
    return NextResponse.json({ error: "報名失敗，請稍後再試" }, { status: 500 });
  }
}

