// GET /api/dashboard/activity - Current busy level
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized, todayDate } from "@/backend/api-helpers";

export async function GET() {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const recentCheckIns = await prisma.checkIn.count({
      where: { checkedInAt: { gte: thirtyMinAgo } },
    });

    // Simple thresholds (configurable in settings later)
    let level: "LOW" | "MODERATE" | "BUSY" = "LOW";
    let description = "Light breakfast flow. Plenty of seats.";

    if (recentCheckIns >= 15) {
      level = "BUSY";
      description = "High volume. All stations active.";
    } else if (recentCheckIns >= 5) {
      level = "MODERATE";
      description = "Normal breakfast flow. Some seats available.";
    }

    const today = todayDate();
    const session = await prisma.breakfastSession.findUnique({
      where: { sessionDate: today },
    });

    return success({
      level,
      description,
      recentCheckIns,
      totalToday: session?.totalGuests || 0,
    });
  } catch (err) {
    console.error("Activity error:", err);
    return error("Failed to fetch activity", 500);
  }
}
