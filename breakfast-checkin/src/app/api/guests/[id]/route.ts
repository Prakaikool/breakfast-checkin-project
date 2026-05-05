// ===========================================
// GET  /api/guests/[id] - Single guest detail
// PATCH /api/guests/[id] - Update guest notes
// ===========================================
// Returns guest info, their room, roommates,
// and the room's full breakfast check-in history.

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireAuth();
    } catch {
      return unauthorized();
    }

    const { id } = await params;
    const guestId = parseInt(id, 10);
    if (isNaN(guestId)) {
      return error("Invalid guest ID", 400);
    }

    // Fetch the guest with their room
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { room: true },
    });

    if (!guest) {
      return error("Guest not found", 404);
    }

    // All other guests in the same room (roommates)
    const roommates = await prisma.guest.findMany({
      where: {
        roomId: guest.roomId,
        id: { not: guestId },
      },
      select: { id: true, name: true, isChild: true },
      orderBy: { isChild: "asc" },
    });

    // All check-ins for this room (most recent first, last 20)
    const checkIns = await prisma.checkIn.findMany({
      where: { roomId: guest.roomId },
      include: { staff: { select: { name: true } } },
      orderBy: { checkedInAt: "desc" },
      take: 20,
    });

    return success({
      id: guest.id,
      name: guest.name,
      guestType: guest.guestType,
      isChild: guest.isChild,
      hasBreakfast: guest.hasBreakfast,
      checkInDate: guest.checkInDate.toISOString(),
      checkOutDate: guest.checkOutDate.toISOString(),
      notes: guest.notes,
      room: {
        id: guest.room.id,
        roomNumber: guest.room.roomNumber,
        floor: guest.room.floor,
        maxGuests: guest.room.maxGuests,
      },
      roommates,
      checkIns: checkIns.map((ci) => ({
        id: ci.id,
        adultCount: ci.adultCount,
        childCount: ci.childCount,
        staffName: ci.staff.name,
        isDuplicate: ci.isDuplicate,
        checkedInAt: ci.checkedInAt.toISOString(),
      })),
      totalCheckIns: checkIns.length,
    });
  } catch (err) {
    console.error("Guest detail error:", err);
    return error("Failed to fetch guest", 500);
  }
}

// ---- PATCH: Update guest notes ----
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let staff;
  try { staff = await requireAuth(); } catch { return unauthorized(); }

  try {
    const { id } = await params;
    const guestId = parseInt(id, 10);
    if (isNaN(guestId)) return error("Invalid guest ID", 400);

    const body = await request.json();
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) return error("Guest not found", 404);

    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: { notes },
    });

    await prisma.auditLog.create({
      data: {
        staffId: staff.staffId,
        action: "UPDATE_GUEST_NOTE",
        details: { guestId, notes },
      },
    });

    return success({ id: updated.id, notes: updated.notes });
  } catch (err) {
    console.error("Guest PATCH error:", err);
    return error("Failed to update guest note", 500);
  }
}
