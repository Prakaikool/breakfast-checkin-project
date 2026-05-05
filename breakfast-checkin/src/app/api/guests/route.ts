// ===========================================
// GET /api/guests?room=816  or  ?name=karlsson  or  ?all=true
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized, todayDate } from "@/backend/api-helpers";

// Hard cap on name/room search param lengths
const MAX_ROOM_LEN = 20;
const MAX_NAME_LEN = 100;
// Maximum rows returned for ?all=true — protects against accidental data dumps
const ALL_GUESTS_LIMIT = 500;

export async function GET(request: NextRequest) {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const { searchParams } = new URL(request.url);
    const room = searchParams.get("room")?.trim();
    const name = searchParams.get("name")?.trim();
    const all  = searchParams.get("all") === "true";

    if (!all && !room && !name) {
      return error("Provide 'room', 'name', or 'all=true' query parameter", 400);
    }

    // Reject oversized search params
    if (room && room.length > MAX_ROOM_LEN) return error("Room number too long", 400);
    if (name && name.length > MAX_NAME_LEN) return error("Name search too long", 400);

    const today    = todayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lazy cleanup: clear notes for guests who have already checked out
    await prisma.guest.updateMany({
      where: { notes: { not: null }, checkOutDate: { lt: today } },
      data: { notes: null },
    });

    const guests = await prisma.guest.findMany({
      where: {
        checkOutDate: { gte: today },
        ...(all
          ? {}
          : room
          ? { room: { roomNumber: room } }
          : { name: { contains: name!, mode: "insensitive" } }),
      },
      include: {
        room: true,
        checkIns: {
          where: { checkedInAt: { gte: today, lt: tomorrow } },
          orderBy: { checkedInAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
      // Cap ?all=true to prevent accidental full-table dumps
      ...(all ? { take: ALL_GUESTS_LIMIT } : {}),
    });

    if (guests.length === 0) return success({ results: [], totalFound: 0 });

    // Group guests by room
    const roomMap = new Map<string, {
      roomId:         number;
      roomNumber:     string;
      guests:         typeof guests;
      alreadyCheckedIn: boolean;
      totalAdults:    number;
      totalChildren:  number;
    }>();

    for (const guest of guests) {
      const roomNum = guest.room.roomNumber;
      if (!roomMap.has(roomNum)) {
        roomMap.set(roomNum, {
          roomId:    guest.room.id,
          roomNumber: roomNum,
          guests:    [],
          alreadyCheckedIn: false,
          totalAdults:   0,
          totalChildren: 0,
        });
      }
      const entry = roomMap.get(roomNum)!;
      entry.guests.push(guest);
      guest.isChild ? entry.totalChildren++ : entry.totalAdults++;
      if (guest.checkIns.length > 0) entry.alreadyCheckedIn = true;
    }

    // Fetch today's check-in counts per room in one query
    const roomIds       = Array.from(roomMap.values()).map((r) => r.roomId);
    const todayCheckIns = await prisma.checkIn.findMany({
      where:  { roomId: { in: roomIds }, checkedInAt: { gte: today, lt: tomorrow } },
      select: { roomId: true, adultCount: true, childCount: true },
    });

    const checkedByRoom = new Map<number, { adults: number; children: number }>();
    for (const ci of todayCheckIns) {
      const prev = checkedByRoom.get(ci.roomId!) ?? { adults: 0, children: 0 };
      checkedByRoom.set(ci.roomId!, {
        adults:   prev.adults   + ci.adultCount,
        children: prev.children + ci.childCount,
      });
    }

    const results = Array.from(roomMap.values()).map((r) => {
      const totalGuests       = r.totalAdults + r.totalChildren;
      const checked           = checkedByRoom.get(r.roomId) ?? { adults: 0, children: 0 };
      const checkedInAdults   = checked.adults;
      const checkedInChildren = checked.children;
      const checkedInCount    = checkedInAdults + checkedInChildren;
      const checkStatus       =
        checkedInCount === 0           ? "none"
        : checkedInCount >= totalGuests ? "full"
        : "partial";
      return { ...r, checkedInAdults, checkedInChildren, checkedInCount, checkStatus };
    });

    return success({ results, totalFound: guests.length });
  } catch (err) {
    console.error("Guest search error:", err);
    return error("Search failed", 500);
  }
}
