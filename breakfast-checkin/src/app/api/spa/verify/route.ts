// GET /api/spa/verify?memberId=SPA-001 - Verify a spa membership
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";
import { checkRateLimit } from "@/backend/rate-limit";

// 60 membership lookups per IP per minute is generous for legitimate use
const VERIFY_MAX    = 60;
const VERIFY_WINDOW = 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    // Rate limit by IP to prevent member-ID enumeration
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const limit = checkRateLimit(`spa-verify:${ip}`, VERIFY_MAX, VERIFY_WINDOW);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId")?.trim();

    if (!memberId)          return error("memberId is required", 400);
    if (memberId.length > 50) return error("Invalid memberId", 400);

    const member = await prisma.spaMember.findUnique({ where: { memberId } });

    // Always return the same shape for not-found and inactive — don't leak data
    if (!member || !member.isActive) {
      return success({ valid: false, message: "Membership not found or inactive" });
    }

    if (member.validUntil && new Date(member.validUntil) < new Date()) {
      return success({ valid: false, message: "Membership has expired" });
    }

    // Only expose what the front desk needs
    return success({
      valid: true,
      member: {
        memberId:   member.memberId,
        name:       member.name,
        memberType: member.memberType,
        validUntil: member.validUntil,
      },
    });
  } catch (err) {
    console.error("Spa verify error:", err);
    return error("Verification failed", 500);
  }
}
