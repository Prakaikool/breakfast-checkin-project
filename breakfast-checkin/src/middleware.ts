// ===========================================
// NEXT.JS MIDDLEWARE
// ===========================================
// 1. Adds security headers to every response.
// 2. Blocks unauthenticated access to protected
//    pages and API routes at the edge.

import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PREFIXES = [
  "/login",
  "/public-dash",
  "/display",
  "/api/auth/login",
  "/api/dashboard/public",
  "/api/display",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options":    "nosniff",
  "X-Frame-Options":           "DENY",
  "X-XSS-Protection":          "1; mode=block",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
  // Strict-Transport-Security is only meaningful over HTTPS — enable in production
  ...(process.env.NODE_ENV === "production"
    ? { "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload" }
    : {}),
};

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build the response first so we can attach headers regardless of auth outcome
  const addHeaders = (res: NextResponse) => {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  };

  // Static assets and public routes pass through (with security headers)
  if (isPublic(pathname)) {
    return addHeaders(NextResponse.next());
  }

  // Check for auth cookie — full JWT verification happens in each API route handler
  const hasToken = !!request.cookies.get("auth-token");

  if (!hasToken) {
    if (pathname.startsWith("/api/")) {
      return addHeaders(
        NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      );
    }
    // Redirect unauthenticated page requests to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return addHeaders(NextResponse.next());
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
