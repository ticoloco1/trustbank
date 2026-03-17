/**
 * Login próprio: hash de senha e sessão por cookie assinado.
 * SESSION_SECRET no .env para produção.
 */
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;
const COOKIE_NAME = "tb_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 dias

export { COOKIE_NAME };

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return secret || "dev-secret-change-in-production";
}

export type SessionPayload = { userId: string; email: string; exp: number };

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const data = JSON.stringify({ ...payload, exp });
  const base = Buffer.from(data, "utf8").toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(base).digest("base64url");
  return `${base}.${sig}`;
}

export function getSessionFromToken(token: string): SessionPayload | null {
  try {
    const [base, sig] = token.split(".");
    if (!base || !sig) return null;
    const expectedBuf = createHmac("sha256", getSecret()).update(base).digest();
    const receivedBuf = Buffer.from(sig, "base64url");
    if (expectedBuf.length !== receivedBuf.length) return null;
    if (!timingSafeEqual(expectedBuf, receivedBuf)) return null;
    const raw = Buffer.from(base, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromCookie(cookieHeader: string | undefined): SessionPayload | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match?.[1]?.trim();
  if (!token) return null;
  return getSessionFromToken(token);
}
