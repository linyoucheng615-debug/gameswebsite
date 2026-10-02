import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cram-school-battle-system-secret-key-2026"
);

export const ADMIN_COOKIE_NAME = "cram_school_admin_token";

export interface AdminPayload {
  role: "admin";
  admin: boolean;
}

// 簽發管理者 Session JWT
export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin", admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// 解析驗證管理者 JWT
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin" && payload.admin === true;
  } catch {
    return false;
  }
}

// 檢查當前請求是否具備管理者身分
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

// 驗證管理者密碼
export function checkAdminPassword(inputPassword?: string): boolean {
  const envPassword = process.env.ADMIN_PASSWORD || "admin888";
  return !!inputPassword && inputPassword.trim() === envPassword.trim();
}

// 設定管理者 HttpOnly Cookie
export function setAdminCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// 清除管理者 Cookie
export function clearAdminCookie() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
