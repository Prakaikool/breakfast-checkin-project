// ===========================================
// GET /api/dashboard/public - Guest-facing status
// ===========================================

import prisma from "@/backend/db";
import { success, error, todayDate } from "@/backend/api-helpers";
import { getAnnouncement } from "@/backend/announcement-store";
import { getCrowdOverride } from "@/backend/crowd-store";

const LEVEL_MESSAGES: Record<string, string> = {
  LOW:       "Light flow - plenty of seats available.",
  MODERATE:  "Normal flow - some seats available.",
  BUSY:      "Busy period - expect some waiting.",
  VERY_BUSY: "Very busy - please be patient.",
};

export async function GET() {
  try {
    const today        = todayDate();
    const now          = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const tomorrow     = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Auto crowd level
    const recentCount = await prisma.checkIn.count({
      where: { checkedInAt: { gte: thirtyMinAgo } },
    });

    let autoLevel: "LOW" | "MODERATE" | "BUSY" = "LOW";
    if (recentCount >= 15)     autoLevel = "BUSY";
    else if (recentCount >= 5) autoLevel = "MODERATE";

    // Manual override wins if active
    const override = getCrowdOverride();
    const level    = override.active ? override.level : autoLevel;
    const message  = LEVEL_MESSAGES[level] ?? LEVEL_MESSAGES["LOW"];

    // Crowd trend
    const checkIns = await prisma.checkIn.findMany({
      where:  { checkedInAt: { gte: today, lt: tomorrow } },
      select: { checkedInAt: true, adultCount: true, childCount: true },
    });

    const trend: { time: string; people: number }[] = [];
    for (let hour = 7; hour <= 10; hour++) {
      const slotStart = new Date(today); slotStart.setHours(hour,     0, 0, 0);
      const slotEnd   = new Date(today); slotEnd.setHours(hour + 1,   0, 0, 0);
      const people    = checkIns
        .filter((ci) => ci.checkedInAt >= slotStart && ci.checkedInAt < slotEnd)
        .reduce((s, ci) => s + ci.adultCount + ci.childCount, 0);
      trend.push({ time: `${String(hour).padStart(2, "0")}:00`, people });
    }

    return success({
      level,
      message,
      isManualOverride: override.active,
      manualOverride:   override.active ? { level: override.level, updatedBy: override.updatedBy, updatedAt: override.updatedAt } : null,
      trend,
      serviceHours: {
        start: process.env.BREAKFAST_START_TIME || "07:00",
        end:   process.env.BREAKFAST_END_TIME   || "10:30",
      },
      announcement: await getAnnouncement(),
    });
  } catch (err) {
    console.error("Public dashboard error:", err);
    return error("Failed to fetch status", 500);
  }
}
