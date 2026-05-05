// GET  /api/spa/members - List all spa/VIP members
// POST /api/spa/members - Create a new spa/VIP member
import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { spaMemberSchema } from "@/backend/validations";
import { success, error, unauthorized } from "@/backend/api-helpers";

export async function GET() {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const members = await prisma.spaMember.findMany({
      orderBy: { name: "asc" },
      take: 1000, // hard cap — a single hotel will never exceed this
    });

    return success(members);
  } catch (err) {
    console.error("Spa members error:", err);
    return error("Failed to fetch members", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    // Only ADMIN/SUPERVISOR can create members
    if (!["ADMIN", "SUPERVISOR"].includes(staff.role)) {
      return error("Only admins and supervisors can create members", 403);
    }

    const body   = await req.json();
    const parsed = spaMemberSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message, 400);

    const { name, phone, memberType, validUntil } = parsed.data;

    // Auto-generate member ID: SPA-YYYYMMDD-XXXX or VIP-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix   = Math.random().toString(36).slice(2, 6).toUpperCase();
    const memberId = `${memberType}-${datePart}-${suffix}`;

    const member = await prisma.spaMember.create({
      data: {
        memberId,
        name: name.trim(),
        phone:      phone?.trim() || null,
        memberType,
        isActive:   true,
        validUntil: validUntil ?? null,
      },
    });

    return success(member, 201);
  } catch (err) {
    console.error("Create member error:", err);
    return error("Failed to create member", 500);
  }
}
