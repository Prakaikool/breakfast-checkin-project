// ===========================================
// POST /api/checkins - Register a breakfast check-in
// GET  /api/checkins - List check-ins for a date
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { checkInSchema } from "@/backend/validations";
import { success, created, error, unauthorized, conflict, todayDate } from "@/backend/api-helpers";

// ---- POST: Create a new check-in ----
export async function POST(request: NextRequest) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message, 400);

    const { roomId, guestId, adultCount, childCount, note, overrideDuplicate, isWalkIn } =
      parsed.data;

    if (adultCount + childCount === 0) return error("At least 1 guest is required");

    // Look up room when a roomId was supplied
    let room = null;
    if (roomId) {
      room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) return error("Room not found", 404);
    }

    const today    = todayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Capacity check and duplicate detection for room-based non-walk-in check-ins.
    // Duplicate conflict only fires once ALL registered guests have been checked in.
    let isRoomFull = false;
    if (!isWalkIn && room && roomId) {
      const registeredGuests = await prisma.guest.findMany({
        where: { roomId, checkOutDate: { gte: today } },
      });
      const registeredCount = registeredGuests.length;

      if (registeredCount > 0) {
        const existing = await prisma.checkIn.findMany({
          where: { roomId, checkedInAt: { gte: today, lt: tomorrow }, isWalkIn: false },
          select: { adultCount: true, childCount: true },
        });
        const alreadyCheckedIn = existing.reduce((s, c) => s + c.adultCount + c.childCount, 0);

        if (alreadyCheckedIn >= registeredCount) {
          // Every registered guest is already checked in — treat as duplicate/override
          isRoomFull = true;
        } else if (alreadyCheckedIn + adultCount + childCount > registeredCount) {
          return error(
            `Room ${room.roomNumber} has ${registeredCount} registered guest${registeredCount !== 1 ? "s" : ""} ` +
            `(${alreadyCheckedIn} already checked in). ` +
            `Cannot check in ${adultCount + childCount} more. Use the walk-in button for extra guests.`,
            400
          );
        }
      }
    }

    // Get or create today's session
    let session = await prisma.breakfastSession.findUnique({ where: { sessionDate: today } });
    if (!session) {
      session = await prisma.breakfastSession.create({
        data: {
          sessionDate: today,
          startTime: process.env.BREAKFAST_START_TIME || "07:00",
          endTime:   process.env.BREAKFAST_END_TIME   || "10:30",
        },
      });
    }

    // Duplicate check — only fires when the room is fully checked in
    const existingCheckIn = (isRoomFull && !isWalkIn && roomId)
      ? await prisma.checkIn.findFirst({
          where: { roomId, checkedInAt: { gte: today, lt: tomorrow }, isDuplicate: false, isWalkIn: false },
        })
      : null;

    if (existingCheckIn && !overrideDuplicate) {
      return conflict(
        `Room ${room!.roomNumber} has already been checked in today at ` +
        existingCheckIn.checkedInAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
      );
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        roomId:      roomId ?? null,
        guestId:     guestId ?? null,
        staffId:     staff.staffId,
        sessionId:   session.id,
        adultCount,
        childCount,
        isDuplicate: !!existingCheckIn,
        isOverride:  !!existingCheckIn && !!overrideDuplicate,
        isWalkIn:    !!isWalkIn,
        note:        note?.trim() || null,
      },
      include: {
        room:  true,
        guest: true,
        staff: { select: { name: true } },
      },
    });

    await prisma.breakfastSession.update({
      where: { id: session.id },
      data: {
        totalGuests:   { increment: adultCount + childCount },
        totalAdults:   { increment: adultCount },
        totalChildren: { increment: childCount },
      },
    });

    await prisma.auditLog.create({
      data: {
        staffId: staff.staffId,
        action:  isWalkIn ? "WALK_IN" : existingCheckIn ? "DUPLICATE_OVERRIDE" : "CHECK_IN",
        details: {
          roomNumber: room?.roomNumber ?? null,
          adultCount,
          childCount,
          checkInId: checkIn.id,
          isWalkIn: !!isWalkIn,
        },
      },
    });

    return created({
      checkIn: {
        id:          checkIn.id,
        roomNumber:  checkIn.room?.roomNumber ?? null,
        guestName:   checkIn.guest?.name || null,
        adultCount:  checkIn.adultCount,
        childCount:  checkIn.childCount,
        staffName:   checkIn.staff.name,
        isDuplicate: checkIn.isDuplicate,
        isOverride:  checkIn.isOverride,
        isWalkIn:    checkIn.isWalkIn,
        checkedInAt: checkIn.checkedInAt,
      },
    });
  } catch (err) {
    console.error("Check-in error:", err);
    return error("Check-in failed", 500);
  }
}

// ---- GET: List check-ins for a given date ----
export async function GET(request: NextRequest) {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let queryDate: Date;
    if (dateParam) {
      // Reject anything that isn't a plain YYYY-MM-DD date string
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return error("Invalid date format — use YYYY-MM-DD", 400);
      }
      queryDate = new Date(dateParam);
      if (isNaN(queryDate.getTime())) return error("Invalid date", 400);
    } else {
      queryDate = todayDate();
    }

    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const checkIns = await prisma.checkIn.findMany({
      where: { checkedInAt: { gte: queryDate, lt: nextDay } },
      include: {
        room:  true,
        guest: { select: { name: true, isChild: true, guestType: true } },
        staff: { select: { name: true } },
      },
      orderBy: { checkedInAt: "desc" },
    });

    return success({
      checkIns: checkIns.map((ci) => ({
        id:           ci.id,
        roomNumber:   ci.room?.roomNumber ?? null,
        guestName:    ci.guest?.name || (ci.isWalkIn ? "Walk-in" : "–"),
        guestType:    ci.guest?.guestType || "HOTEL",
        adultCount:   ci.adultCount,
        childCount:   ci.childCount,
        staffName:    ci.staff.name,
        isDuplicate:  ci.isDuplicate,
        isOverride:   ci.isOverride,
        isWalkIn:     ci.isWalkIn,
        checkedInAt:  ci.checkedInAt,
        checkedOutAt: ci.checkedOutAt,
        note:         ci.note ?? null,
      })),
      total: checkIns.length,
    });
  } catch (err) {
    console.error("List check-ins error:", err);
    return error("Failed to fetch check-ins", 500);
  }
}
