// ===========================================
// PATCH /api/checkins/[id] - Check out a guest
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const { id } = await params;
    const checkInId = parseInt(id);
    if (isNaN(checkInId)) return error("Invalid check-in ID");

    const body = await request.json();
    const { action } = body; // "checkout" | "undo_checkout"

    const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) return error("Check-in not found", 404);

    if (action === "checkout") {
      if (checkIn.checkedOutAt) return error("Guest already checked out");

      const updated = await prisma.checkIn.update({
        where: { id: checkInId },
        data:  { checkedOutAt: new Date() },
        include: { room: true, staff: { select: { name: true } } },
      });

      await prisma.auditLog.create({
        data: {
          staffId: staff.staffId,
          action:  "CHECK_OUT",
          details: { roomNumber: updated.room?.roomNumber ?? null, checkInId, adultCount: updated.adultCount, childCount: updated.childCount },
        },
      });

      return success({ checkedOutAt: updated.checkedOutAt });
    }

    if (action === "undo_checkout") {
      const updated = await prisma.checkIn.update({
        where: { id: checkInId },
        data:  { checkedOutAt: null },
      });
      return success({ checkedOutAt: updated.checkedOutAt });
    }

    return error("Invalid action. Use 'checkout' or 'undo_checkout'");
  } catch (err) {
    console.error("Check-in PATCH error:", err);
    return error("Operation failed", 500);
  }
}
