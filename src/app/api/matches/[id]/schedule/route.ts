export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { analyzeMatchSlots } from "@/lib/tournament/scheduleHelper";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "請先登入後再進行約戰協調" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, slots, scheduledTime, targetPlayer } = body;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
        player1: { select: { id: true, name: true, nickname: true } },
        player2: { select: { id: true, name: true, nickname: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "找不到該場次對局" }, { status: 404 });
    }

    const isP1 = user.id === match.player1Id;
    const isP2 = user.id === match.player2Id;
    const isOrganizer = user.role === "admin" || match.tournament.createdBy === user.id;

    if (!isP1 && !isP2 && !isOrganizer) {
      return NextResponse.json(
        { error: "權限不足：您並非此對局之參賽選手或賽事主辦人" },
        { status: 403 }
      );
    }

    if (action === "update_slots") {
      if (!Array.isArray(slots)) {
        return NextResponse.json({ error: "無效的時段資料清單" }, { status: 400 });
      }

      const slotsJson = JSON.stringify(slots);
      let updateData: { player1Slots?: string; player2Slots?: string } = {};

      if (isP1) {
        updateData.player1Slots = slotsJson;
      } else if (isP2) {
        updateData.player2Slots = slotsJson;
      } else if (isOrganizer) {
        if (targetPlayer === "player2") {
          updateData.player2Slots = slotsJson;
        } else {
          updateData.player1Slots = slotsJson;
        }
      }

      const updated = await prisma.match.update({
        where: { id },
        data: updateData,
        include: {
          player1: { select: { id: true, name: true, nickname: true } },
          player2: { select: { id: true, name: true, nickname: true } },
        },
      });

      const analysis = analyzeMatchSlots(updated.player1Slots, updated.player2Slots);

      return NextResponse.json({
        success: true,
        message: "可約戰時段已成功更新！",
        match: updated,
        analysis,
      });
    }

    if (action === "confirm_time") {
      if (!scheduledTime || typeof scheduledTime !== "string") {
        return NextResponse.json({ error: "請提供欲確認預約的時段資訊" }, { status: 400 });
      }

      const updated = await prisma.match.update({
        where: { id },
        data: { scheduledTime: scheduledTime.trim() },
        include: {
          player1: { select: { id: true, name: true, nickname: true } },
          player2: { select: { id: true, name: true, nickname: true } },
        },
      });

      const analysis = analyzeMatchSlots(updated.player1Slots, updated.player2Slots);

      return NextResponse.json({
        success: true,
        message: `約戰時間已敲定：${scheduledTime}`,
        match: updated,
        analysis,
      });
    }

    if (action === "clear_time") {
      const updated = await prisma.match.update({
        where: { id },
        data: { scheduledTime: null },
        include: {
          player1: { select: { id: true, name: true, nickname: true } },
          player2: { select: { id: true, name: true, nickname: true } },
        },
      });

      const analysis = analyzeMatchSlots(updated.player1Slots, updated.player2Slots);

      return NextResponse.json({
        success: true,
        message: "已重設/取消預定開戰時間",
        match: updated,
        analysis,
      });
    }

    return NextResponse.json({ error: "未知的操作指令" }, { status: 400 });
  } catch (error: any) {
    console.error("[SCHEDULE ERROR]:", error);
    return NextResponse.json(
      { error: error?.message || "伺服器內部錯誤", details: error?.stack },
      { status: 500 }
    );
  }
}

