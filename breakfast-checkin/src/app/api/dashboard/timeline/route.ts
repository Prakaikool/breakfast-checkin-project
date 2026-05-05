// ===========================================
// GET /api/dashboard/timeline - Check-ins over time
// ===========================================
// Returns check-in counts grouped by 30-minute slots.
// The window is dynamic: covers the actual check-in range
// (or the default breakfast window if no check-ins yet).

import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized, todayDate } from "@/backend/api-helpers";

export async function GET() {
  try {
    try {
      await requireAuth();
    } catch {
      return unauthorized();
    }

    const today = todayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIns = await prisma.checkIn.findMany({
      where: { checkedInAt: { gte: today, lt: tomorrow } },
      select: { checkedInAt: true, adultCount: true, childCount: true },
      orderBy: { checkedInAt: "asc" },
    });

    // Determine window: if check-ins exist, build around their actual range.
    // Otherwise default to breakfast window 07:00–11:00.
    let windowStartHour = 7;
    let windowEndHour = 11;

    if (checkIns.length > 0) {
      const first = checkIns[0].checkedInAt;
      const last = checkIns[checkIns.length - 1].checkedInAt;
      // Pad by 30 min on each side, clamped to 0–23
      windowStartHour = Math.max(0, first.getHours() - 1);
      windowEndHour = Math.min(23, last.getHours() + 1);
    }

    // Build 30-minute slots across the window
    const slots: { time: string; count: number; people: number }[] = [];

    for (let hour = windowStartHour; hour <= windowEndHour; hour++) {
      for (const min of [0, 30]) {
        const slotStart = new Date(today);
        slotStart.setHours(hour, min, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        const slotCheckIns = checkIns.filter(
          (ci) => ci.checkedInAt >= slotStart && ci.checkedInAt < slotEnd
        );

        slots.push({
          time: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
          count: slotCheckIns.length,
          people: slotCheckIns.reduce(
            (sum, ci) => sum + ci.adultCount + ci.childCount,
            0
          ),
        });
      }
    }

    return success({ timeline: slots });
  } catch (err) {
    console.error("Timeline error:", err);
    return error("Failed to fetch timeline", 500);
  }
}
