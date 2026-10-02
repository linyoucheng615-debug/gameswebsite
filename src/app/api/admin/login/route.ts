import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, signAdminToken, setAdminCookie, clearAdminCookie, isAdminAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: "密碼錯誤，請重新輸入" }, { status: 401 });
    }

    const token = await signAdminToken();
    setAdminCookie(token);

    return NextResponse.json({ success: true, message: "登入成功" });
  } catch (error) {
    return NextResponse.json({ error: "登入處理發生異常" }, { status: 500 });
  }
}

export async function GET() {
  const isAdmin = await isAdminAuthenticated();
  return NextResponse.json({ isAdmin });
}

export async function DELETE() {
  clearAdminCookie();
  return NextResponse.json({ success: true, message: "已登出" });
}
