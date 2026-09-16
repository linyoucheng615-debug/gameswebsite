export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  recalculateTournamentScores,
  advancePlayoffWinnerIfApplicable,
} from "@/lib/tournament/matchService";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "權限不足：僅賽事管理員可覆寫爭議比分" },
        { status: 403 }
      );
    }

    const { id } = params;
    const { player1Result, player2Result } = await req.json();

    const validResults = ["win", "draw", "loss"];
    if (
      !validResults.includes(player1Result) ||
      !validResults.includes(player2Result)
    ) {
      return NextResponse.json(
        { error: "無效的比分結果值，必須為 win, draw 或 loss" },
        { status: 400 }
      );
    }

    // 嚴格檢查互斥性：不可兩邊都是勝場或兩邊都是敗場
    if (player1Result === "win" && player2Result !== "loss") {
      return NextResponse.json(
        { error: "比分衝突：藍方 (選手 1) 獲勝時，紅方 (選手 2) 必須為敗北，不可雙方皆為勝場！" },
        { status: 400 }
      );
    }
    if (player2Result === "win" && player1Result !== "loss") {
      return NextResponse.json(
        { error: "比分衝突：紅方 (選手 2) 獲勝時，藍方 (選手 1) 必須為敗北，不可雙方皆為勝場！" },
        { status: 400 }
      );
    }
    if (player1Result === "loss" && player2Result !== "win") {
      return NextResponse.json(
        { error: "比分衝突：藍方 (選手 1) 敗北時，紅方 (選手 2) 必須為獲勝！" },
        { status: 400 }
      );
    }
    if (
      (player1Result === "draw" && player2Result !== "draw") ||
      (player2Result === "draw" && player1Result !== "draw")
    ) {
      return NextResponse.json(
        { error: "比分衝突：和局時雙方結果必須皆為和局！" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "找不到該對局場次" }, { status: 404 });
    }

    // 更新管理員覆寫比分
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        player1Result,
        player2Result,
        status: "finished",
        reportedBy: user.id,
        reportedAt: new Date(),
      },
      include: {
        player1: { select: { id: true, name: true, nickname: true } },
        player2: { select: { id: true, name: true, nickname: true } },
        reporter: { select: { id: true, nickname: true } },
      },
    });

    // 重新計算比賽全體積分
    await recalculateTournamentScores(match.tournamentId);

    // 更新淘汰賽勝者
    const winnerId =
      player1Result === "win"
        ? match.player1Id
        : player2Result === "win"
        ? match.player2Id
        : null;
    await advancePlayoffWinnerIfApplicable(match.id, winnerId);

    return NextResponse.json({
      success: true,
      message: "管理員已成功強制覆寫爭議比分並重新校準積分！",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Match override error:", error);
    return NextResponse.json(
      { error: "覆寫比分失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

