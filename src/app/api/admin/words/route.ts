import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const words = await prisma.vocabularyWord.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ words, total: words.length });
  } catch (error: any) {
    console.error("GET /api/admin/words error:", error);
    return NextResponse.json({ error: "取得單字庫失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = body.rawText as string;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "請提供單字文字內容" }, { status: 400 });
    }

    const lines = rawText.split("\n");
    const parsedPairs: { english: string; chinese: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      // 支援逗號 (半形/全形) 或 Tab 或 空格切分
      let parts = trimmed.split(/[,，\t]/);
      if (parts.length >= 2) {
        const en = parts[0].trim().toLowerCase();
        const ch = parts.slice(1).join(",").trim();
        if (en && ch) {
          parsedPairs.push({ english: en, chinese: ch });
        }
      }
    }

    if (parsedPairs.length === 0) {
      return NextResponse.json(
        { error: "未解析出有效格式，請使用「英文, 中文」（一行一個單字）" },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const pair of parsedPairs) {
      const existing = await prisma.vocabularyWord.findUnique({
        where: { english: pair.english },
      });

      if (existing) {
        await prisma.vocabularyWord.update({
          where: { english: pair.english },
          data: { chinese: pair.chinese },
        });
        updatedCount++;
      } else {
        await prisma.vocabularyWord.create({
          data: {
            english: pair.english,
            chinese: pair.chinese,
          },
        });
        insertedCount++;
      }
    }

    const totalWords = await prisma.vocabularyWord.count();

    return NextResponse.json({
      success: true,
      insertedCount,
      updatedCount,
      totalWords,
      message: `成功匯入！新增 ${insertedCount} 筆，更新 ${updatedCount} 筆，題庫總計 ${totalWords} 題。`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/words error:", error);
    return NextResponse.json({ error: "匯入單字庫失敗" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      await prisma.vocabularyWord.deleteMany({});
      return NextResponse.json({ success: true, message: "已清空題庫" });
    }

    if (!id) {
      return NextResponse.json({ error: "請提供單字 ID" }, { status: 400 });
    }

    await prisma.vocabularyWord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "已刪除單字" });
  } catch (error: any) {
    console.error("DELETE /api/admin/words error:", error);
    return NextResponse.json({ error: "刪除單字失敗" }, { status: 500 });
  }
}

