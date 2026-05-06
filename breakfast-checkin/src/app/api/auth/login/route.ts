// ===========================================
// POST /api/auth/login
// ===========================================
// Staff logs in with email + PIN.
// Returns a JWT token stored as an HTTP-only cookie.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/backend/db";
import { verifyPassword, createToken } from "@/backend/auth";
import { loginSchema } from "@/backend/validations";
import { success, error, unauthorized } from "@/backend/api-helpers";
import { checkRateLimit, resetRateLimit } from "@/backend/rate-limit";

// Max 10 login attempts per IP per 15 minutes
const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const limit = checkRateLimit(ip, LOGIN_MAX, LOGIN_WINDOW_MS);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000);
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(LOGIN_MAX),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Parse and validate the request body
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.errors[0].message);
    }

    const { email, password } = parsed.data;

    // 3. Find the staff member by email
    const staff = await prisma.staff.findUnique({
      where: { email },
    });

    if (!staff || !staff.isActive) {
      return unauthorized("Invalid credentials");
    }

    // 4. Verify the password
    const isValid = await verifyPassword(password, staff.pinHash);
    if (!isValid) {
      return unauthorized("Invalid credentials");
    }

    // 5. Successful login — reset rate limit for this IP
    resetRateLimit(ip);

    // 6. Create JWT token
    const token = createToken({
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    });

    // 7. Set the token as an HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    // 8. Audit the login
    await prisma.auditLog.create({
      data: {
        staffId: staff.id,
        action: "LOGIN",
        details: { ip },
      },
    });

    // 9. Return staff info (token is in the cookie, not the response)
    return success({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: "Login failed", detail: msg }, { status: 500 });
  }
}
