// GET /api/spa/members/[id] - Single spa/VIP member detail
import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const { id } = await params;
    const memberId = parseInt(id, 10);
    if (isNaN(memberId)) return error("Invalid member ID", 400);

    const member = await prisma.spaMember.findUnique({
      where: { id: memberId },
    });

    if (!member) return error("Member not found", 404);

    return success(member);
  } catch (err) {
    console.error("Spa member detail error:", err);
    return error("Failed to fetch member", 500);
  }
}
