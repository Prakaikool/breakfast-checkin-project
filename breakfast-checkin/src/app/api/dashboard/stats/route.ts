// ===========================================
// GET /api/dashboard/stats - Real-time stats
// ===========================================

import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized, todayDate } from "@/backend/api-helpers";

export async function GET() {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const today    = todayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const session = await prisma.breakfastSession.findUnique({ where: { sessionDate: today } });

    const checkIns = await prisma.checkIn.findMany({
      where: { checkedInAt: { gte: today, lt: tomorrow } },
      select: { roomId: true, adultCount: true, childCount: true, isWalkIn: true, checkedOutAt: true },
    });

    const uniqueRooms  = new Set(checkIns.filter((ci) => !ci.isWalkIn).map((ci) => ci.roomId));
    const totalCheckedIn = checkIns.reduce((s, ci) => s + ci.adultCount + ci.childCount, 0);
    const totalWalkIns   = checkIns
      .filter((ci) => ci.isWalkIn)
      .reduce((s, ci) => s + ci.adultCount + ci.childCount, 0);
    const totalCheckedOut = checkIns
      .filter((ci) => ci.checkedOutAt !== null)
      .reduce((s, ci) => s + ci.adultCount + ci.childCount, 0);
    const currentlyInside = totalCheckedIn - totalCheckedOut;

    const duplicates = await prisma.checkIn.count({
      where: { checkedInAt: { gte: today, lt: tomorrow }, isDuplicate: true },
    });

    return success({
      totalCheckIns:    uniqueRooms.size,
      totalPeopleInside: currentlyInside,
      totalCheckedIn,
      totalWalkIns,
      totalCheckedOut,
      currentlyInside,
      totalAdults:      session?.totalAdults   || 0,
      totalChildren:    session?.totalChildren || 0,
      duplicatesBlocked: duplicates,
      sessionStatus:    session?.status || "OPEN",
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return error("Failed to fetch stats", 500);
  }
}
