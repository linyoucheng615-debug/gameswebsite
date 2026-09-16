import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "./prisma";
import { UserProfile, UserRole } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "chess-arena-cyber-jwt-secret-key-super-secure-2026"
);

export const COOKIE_NAME = "chess_arena_token";

export interface TokenPayload {
  userId: string;
  studentId: string;
  role: UserRole;
}

// 密碼雜湊
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// 密碼驗證
export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

// 簽發 JWT Token
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// 解析驗證 JWT Token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// 設定 HttpOnly Cookie (用於 Route Handler / Server Actions)
export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// 清除 Cookie (登出)
export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// 獲取當前登入者資訊
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    if (!user) return null;

    return {
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      nickname: user.nickname,
      role: user.role as UserRole,
      avatar: user.avatar,
      motto: user.motto,
      createdAt: user.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

