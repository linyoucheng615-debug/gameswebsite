import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_CARDS = ["charge", "attack", "defend", "break", "ultimate"];

function calculateStyleTag(cards: string[]): { tag: string; desc: string } {
  const attacks = cards.filter((c) => c === "attack").length;
  const defends = cards.filter((c) => c === "defend").length;
  const charges = cards.filter((c) => c === "charge").length;
  const breaks = cards.filter((c) => c === "break").length;
  const ultimates = cards.filter((c) => c === "ultimate").length;

  if (attacks >= 3) {
    return { tag: "⚔️ 極限快攻型", desc: "傾向在前中期發動連續猛烈攻擊，破壞敵方防線" };
  }
  if (defends >= 2) {
    return { tag: "🛡️ 鐵壁防守型", desc: "善於利用堅固盾牌化解對手攻勢與必殺技" };
  }
  if (charges + ultimates >= 3) {
    return { tag: "⚡ 蓄力必殺型", desc: "專注快速蓄積能量，在關鍵回合發動致命必殺技" };
  }
  if (breaks >= 2) {
    return { tag: "🌀 破防戰術型", desc: "擅長抓對手防守破綻發動瓦解，克制龜縮防禦" };
  }
  return { tag: "🎯 均衡博弈型", desc: "攻守兼備，依局勢隨機應變的出招風格" };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    if (!rawStudentNum) {
      return NextResponse.json({ error: "請提供學號" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json({ error: "查無此學生" }, { status: 404 });
    }

    // 取得最新週次
    const currentWeek = await prisma.academicWeek.findFirst({
      orderBy: { weekNumber: "desc" },
    });

    if (!currentWeek) {
      return NextResponse.json({ error: "尚未建立週次資料" }, { status: 400 });
    }

    // 尋找或建立該學生的本週戰術
    let myStrategy = await prisma.studentStrategy.findUnique({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: currentWeek.id,
        },
      },
    });

    if (!myStrategy) {
      myStrategy = await prisma.studentStrategy.create({
        data: {
          studentId: student.id,
          weekId: currentWeek.id,
          card1: "charge",
          card2: "attack",
          card3: "defend",
          card4: "charge",
          card5: "ultimate",
          isLocked: false,
        },
      });
    }

    // 尋找本週對決對手
    const currentMatch = await prisma.battleMatch.findFirst({
      where: {
        weekId: currentWeek.id,
        OR: [{ playerAId: student.id }, { playerBId: student.id }],
      },
      include: {
        playerA: true,
        playerB: true,
      },
    });

    let opponentName = "神秘對決者";
    let opponentAvatar = "pixel-knight";
    let opponentPastCards = ["attack", "charge", "attack", "defend", "ultimate"];
    let isBot = false;

    if (currentMatch) {
      const isPlayerA = currentMatch.playerAId === student.id;
      if (isPlayerA) {
        if (currentMatch.playerB) {
          opponentName = currentMatch.playerB.name;
          opponentAvatar = currentMatch.playerB.avatarId;
          // 查找對手上週出牌
          const oppPastStrategy = await prisma.studentStrategy.findFirst({
            where: { studentId: currentMatch.playerB.id },
            orderBy: { createdAt: "desc" },
          });
          if (oppPastStrategy) {
            opponentPastCards = [
              oppPastStrategy.card1,
              oppPastStrategy.card2,
              oppPastStrategy.card3,
              oppPastStrategy.card4,
              oppPastStrategy.card5,
            ];
          }
        } else {
          opponentName = currentMatch.botName || "訓練木人機器人";
          opponentAvatar = currentMatch.botAvatar || "pixel-bot";
          opponentPastCards = ["charge", "attack", "attack", "defend", "break"];
          isBot = true;
        }
      } else {
        opponentName = currentMatch.playerA.name;
        opponentAvatar = currentMatch.playerA.avatarId;
        const oppPastStrategy = await prisma.studentStrategy.findFirst({
          where: { studentId: currentMatch.playerA.id },
          orderBy: { createdAt: "desc" },
        });
        if (oppPastStrategy) {
          opponentPastCards = [
            oppPastStrategy.card1,
            oppPastStrategy.card2,
            oppPastStrategy.card3,
            oppPastStrategy.card4,
            oppPastStrategy.card5,
          ];
        }
      }
    }

    const opponentStyle = calculateStyleTag(opponentPastCards);

    return NextResponse.json({
      weekNumber: currentWeek.weekNumber,
      weekTitle: currentWeek.title,
      strategy: {
        id: myStrategy.id,
        cards: [
          myStrategy.card1,
          myStrategy.card2,
          myStrategy.card3,
          myStrategy.card4,
          myStrategy.card5,
        ],
        isLocked: myStrategy.isLocked,
      },
      opponent: {
        name: opponentName,
        avatarId: opponentAvatar,
        isBot,
        pastCards: opponentPastCards,
        styleTag: opponentStyle.tag,
        styleDesc: opponentStyle.desc,
      },
    });
  } catch (error: any) {
    console.error("GET /api/student/[studentNumber]/strategy error:", error);
    return NextResponse.json({ error: "取得出牌戰術資料失敗" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { studentNumber: string } }
) {
  try {
    const rawStudentNum = params.studentNumber?.trim().toUpperCase();
    const body = await req.json();
    const { cards, isLocked } = body;

    if (!Array.isArray(cards) || cards.length !== 5) {
      return NextResponse.json({ error: "必須排滿 5 回合的出牌卡片" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { studentNumber: rawStudentNum },
    });

    if (!student) {
      return NextResponse.json({ error: "查無此學生" }, { status: 404 });
    }

    const currentWeek = await prisma.academicWeek.findFirst({
      orderBy: { weekNumber: "desc" },
    });

    if (!currentWeek) {
      return NextResponse.json({ error: "尚未建立週次資料" }, { status: 400 });
    }

    const updated = await prisma.studentStrategy.upsert({
      where: {
        studentId_weekId: {
          studentId: student.id,
          weekId: currentWeek.id,
        },
      },
      create: {
        studentId: student.id,
        weekId: currentWeek.id,
        card1: cards[0],
        card2: cards[1],
        card3: cards[2],
        card4: cards[3],
        card5: cards[4],
        isLocked: Boolean(isLocked),
      },
      update: {
        card1: cards[0],
        card2: cards[1],
        card3: cards[2],
        card4: cards[3],
        card5: cards[4],
        isLocked: Boolean(isLocked),
      },
    });

    return NextResponse.json({
      success: true,
      isLocked: updated.isLocked,
      message: updated.isLocked
        ? "本週 5 回合戰術已成功鎖定！將以此策略進入對決結算。"
        : "出牌草稿已自動儲存。",
    });
  } catch (error: any) {
    console.error("POST /api/student/[studentNumber]/strategy error:", error);
    return NextResponse.json({ error: "儲存戰術失敗" }, { status: 500 });
  }
}
