import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  deriveMatchResults,
  recalculateTournamentScores,
  advancePlayoffWinnerIfApplicable,
} from "@/lib/tournament/matchService";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入後再進行登記" }, { status: 401 });
    }

    const { id } = params;
    const { result } = await req.json();

    if (!result || !["win", "draw", "loss"].includes(result)) {
      return NextResponse.json(
        { error: "無效的對局結果，選項需為: win, draw, loss" },
        { status: 400 }
      );
    }

    // 1. 查找該場對局
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "找不到該對局場次" }, { status: 404 });
    }

    const isAdmin = user.role === "admin";
    const isPlayer1 = match.player1Id === user.id;
    const isPlayer2 = match.player2Id === user.id;

    // 2. 選手參賽身分檢查
    if (!isAdmin && !isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: "權限不足：您並非本場對局的參賽選手" },
        { status: 403 }
      );
    }

    // 3. 狀態鎖定檢查：若已登記為 finished，非管理員不可重複修改
    if (match.status === "finished" && !isAdmin) {
      return NextResponse.json(
        {
          error: "本場對局已完成登記並鎖定！如因誤按需修改，請向賽事管理員申請覆寫。",
        },
        { status: 400 }
      );
    }

    // 4. 雙向推導對局結果
    const reportingUserId = isPlayer1 ? match.player1Id : isPlayer2 ? match.player2Id! : match.player1Id;
    const { p1Result, p2Result } = deriveMatchResults(
      reportingUserId,
      match.player1Id,
      match.player2Id,
      result
    );

    // 5. 更新對局狀態與結果
    const updatedMatch = await prisma.match.update({
      where: { id: match.id },
      data: {
        player1Result: p1Result,
        player2Result: p2Result,
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

    // 6. 即時重新同步更新比賽全體積分
    await recalculateTournamentScores(match.tournamentId);

    // 7. 若為淘汰賽或複賽，自動將勝者推進至下一輪槽位
    const winnerId =
      p1Result === "win" ? match.player1Id : p2Result === "win" ? match.player2Id : null;
    await advancePlayoffWinnerIfApplicable(match.id, winnerId);

    return NextResponse.json({
      success: true,
      message: "對局結果已成功登記並同步確認！",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Match report error:", error);
    return NextResponse.json(
      { error: "登記對局失敗，請稍後再試" },
      { status: 500 }
    );
  }
}

