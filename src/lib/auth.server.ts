import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { PublicUser } from "./models/user";

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET env var not set");
  return s;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: PublicUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET(),
    {
      expiresIn: "7d",
    },
  );
}

export function verifyToken(token: string): PublicUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET()) as PublicUser & { iat: number; exp: number };
    return { id: payload.id, email: payload.email, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

// Extract user from a cookie string (server-side only)
export function getUserFromCookieHeader(
  cookieHeader: string | undefined | null,
): PublicUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)alfa_token=([^;]+)/);
  if (!match) return null;
  return verifyToken(decodeURIComponent(match[1]));
}

export function buildSetCookie(token: string): string {
  return `alfa_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
}

export function buildClearCookie(): string {
  return `alfa_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
