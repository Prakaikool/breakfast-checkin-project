// ===========================================
// AUTHENTICATION - JWT helpers
// ===========================================

import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Refusing to start.");
}

const JWT_EXPIRY = (process.env.JWT_EXPIRY || "8h") as SignOptions["expiresIn"];

// In-memory revocation set — tracks logged-out token IDs.
// Resets on server restart (acceptable tradeoff; tokens expire in 8 h anyway).
const revokedJtis = new Set<string>();

// Prune expired entries every hour so the set doesn't grow unboundedly.
// We store a revocation time alongside each jti so we can clean up.
const revokedAt = new Map<string, number>();
const JTI_MAX_AGE_MS = 8 * 60 * 60 * 1000; // matches token expiry

setInterval(() => {
  const cutoff = Date.now() - JTI_MAX_AGE_MS;
  for (const [jti, ts] of revokedAt) {
    if (ts < cutoff) {
      revokedJtis.delete(jti);
      revokedAt.delete(jti);
    }
  }
}, 60 * 60 * 1000);

export interface TokenPayload {
  staffId: number;
  name: string;
  email: string;
  role: string;
  jti: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: Omit<TokenPayload, "jti">): string {
  const jti = randomUUID();
  return jwt.sign({ ...payload, jti }, JWT_SECRET!, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;
    if (decoded.jti && revokedJtis.has(decoded.jti)) {
      return null; // token was explicitly revoked at logout
    }
    return decoded;
  } catch {
    return null;
  }
}

export function revokeToken(jti: string): void {
  revokedJtis.add(jti);
  revokedAt.set(jti, Date.now());
}

export async function getCurrentStaff(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<TokenPayload> {
  const staff = await getCurrentStaff();
  if (!staff) {
    throw new Error("Unauthorized");
  }
  return staff;
}

// Call this in the logout handler before deleting the cookie.
export async function revokeCurrentToken(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return;
  const payload = verifyToken(token);
  if (payload?.jti) {
    revokeToken(payload.jti);
  }
}
