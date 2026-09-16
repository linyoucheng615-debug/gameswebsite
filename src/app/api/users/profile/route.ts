import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RivalRecord, PlayerStats } from "@/types";

// GET /api/users/profile - 獲取當前選手個人資訊與深度對戰戰力統計
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "尚未登入，請先登入" }, { status: 401 });
    }

    // 查詢使用者所有已完賽的對局
    const matches = await prisma.match.findMany({
      where: {
        status: "finished",
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
      },
      include: {
        tournament: {
          select: { id: true, name: true, category: true },
        },
        player1: {
          select: { id: true, nickname: true, avatar: true },
        },
        player2: {
          select: { id: true, nickname: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;

    // 對手對戰統計字典: opponentId -> RivalRecord
    const rivalMap = new Map<string, RivalRecord>();

    // 最近對戰列表
    const recentMatches: PlayerStats["recentMatches"] = [];

    for (const m of matches) {
      const isP1 = m.player1Id === user.id;
      const myResult = isP1 ? m.player1Result : m.player2Result;
      const opponent = isP1 ? m.player2 : m.player1;

      // 累計勝負和
      if (myResult === "win") wins++;
      else if (myResult === "loss") losses++;
      else if (myResult === "draw") draws++;

      // 對局紀錄 (忽略輪空)
      if (opponent) {
        let rec = rivalMap.get(opponent.id);
        if (!rec) {
          rec = {
            opponentId: opponent.id,
            opponentNickname: opponent.nickname,
            opponentAvatar: opponent.avatar || "cyber-fox",
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
          };
          rivalMap.set(opponent.id, rec);
        }

        rec.totalGames++;
        if (myResult === "win") rec.wins++;
        else if (myResult === "loss") rec.losses++;
        else if (myResult === "draw") rec.draws++;
        rec.winRate = Math.round(((rec.wins + rec.draws * 0.5) / rec.totalGames) * 100);

        if (recentMatches.length < 8) {
          recentMatches.push({
            matchId: m.id,
            tournamentName: m.tournament.name,
            tournamentCategory: m.tournament.category || "esports",
            round: m.round,
            opponentNickname: opponent.nickname,
            result: (myResult as "win" | "loss" | "draw") || "draw",
            scoreChange: myResult === "win" ? "+1.0" : myResult === "draw" ? "+0.5" : "+0.0",
            date: m.createdAt.toISOString(),
          });
        }
      }
    }

    const totalMatches = wins + losses + draws;
    const winRate =
      totalMatches > 0
        ? Math.round(((wins + draws * 0.5) / totalMatches) * 100)
        : 0;

    // 計算當前連勝/連敗 streak
    let streakType: "win" | "loss" | "none" = "none";
    let streakCount = 0;
    for (const m of matches) {
      const isP1 = m.player1Id === user.id;
      const myResult = isP1 ? m.player1Result : m.player2Result;
      if (myResult === "win") {
        if (streakType === "none" || streakType === "win") {
          streakType = "win";
          streakCount++;
        } else {
          break;
        }
      } else if (myResult === "loss") {
        if (streakType === "none" || streakType === "loss") {
          streakType = "loss";
          streakCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    const allRivals = Array.from(rivalMap.values());

    // 找出「宿敵/天敵」(勝率最低，若勝率相同則依交手次數多者優先)
    let nemesis: RivalRecord | null = null;
    const sortedForNemesis = [...allRivals].sort((a, b) => {
      if (a.winRate !== b.winRate) return a.winRate - b.winRate; // 最低優先
      return b.losses - a.losses; // 輸給對方最多者優先
    });
    if (sortedForNemesis.length > 0) {
      nemesis = sortedForNemesis[0];
    }

    // 找出「得意對手/壓制對手」(勝率最高，若勝率相同則依交手次數多者優先)
    let favoriteRival: RivalRecord | null = null;
    const sortedForFavorite = [...allRivals].sort((a, b) => {
      if (a.winRate !== b.winRate) return b.winRate - a.winRate; // 最高優先
      return b.wins - a.wins; // 贏對方最多者優先
    });
    if (sortedForFavorite.length > 0) {
      favoriteRival = sortedForFavorite[0];
    }

    const stats: PlayerStats = {
      totalMatches,
      wins,
      losses,
      draws,
      winRate,
      streak: { type: streakType, count: streakCount },
      nemesis,
      favoriteRival,
      allRivals,
      recentMatches,
    };

    return NextResponse.json({
      user,
      stats,
    });
  } catch (error) {
    console.error("Get profile stats error:", error);
    return NextResponse.json({ error: "取得選手戰力戰績失敗" }, { status: 500 });
  }
}

// PATCH /api/users/profile - 修改暱稱、頭像與座右銘
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "尚未登入，請先登入" }, { status: 401 });
    }

    const { nickname, avatar, motto } = await req.json();

    const updateData: { nickname?: string; avatar?: string; motto?: string } = {};

    if (nickname && typeof nickname === "string" && nickname.trim()) {
      updateData.nickname = nickname.trim();
    }
    if (avatar && typeof avatar === "string" && avatar.trim()) {
      updateData.avatar = avatar.trim();
    }
    if (typeof motto === "string") {
      updateData.motto = motto.trim() || "超越極限，榮耀加冕！";
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        name: true,
        nickname: true,
        role: true,
        avatar: true,
        motto: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "個人檔案已成功更新！",
      user: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  }
}
