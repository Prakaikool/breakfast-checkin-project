// ===========================================
// GET /api/reports - Weekly breakfast analytics
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

function dayLevel(total: number): "LOW" | "MODERATE" | "BUSY" {
  if (total >= 140) return "BUSY";
  if (total >= 100) return "MODERATE";
  return "LOW";
}

export async function GET(request: NextRequest) {
  try {
    try {
      await requireAuth();
    } catch {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "this_week"; // "this_week" | "last_week"

    // Build an array of the last 7 days (Mon–Sun of current week, or last 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get Mon of current week
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() + diffToMon);

    const weekStart = new Date(thisWeekStart);
    if (period === "last_week") weekStart.setDate(weekStart.getDate() - 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Fetch all check-ins for the week
    const checkIns = await prisma.checkIn.findMany({
      where: { checkedInAt: { gte: weekStart, lt: weekEnd } },
      select: { checkedInAt: true, adultCount: true, childCount: true },
    });

    // Also fetch the prior week for comparison
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);

    const lastWeekCheckIns = await prisma.checkIn.findMany({
      where: { checkedInAt: { gte: lastWeekStart, lt: lastWeekEnd } },
      select: { checkedInAt: true, adultCount: true, childCount: true },
    });

    // Build daily breakdown
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const days = [];
    let totalGuests = 0;
    let peakDay = { label: "–", total: 0 };
    const guestsPerDay: { label: string; total: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayCIs = checkIns.filter(
        (ci) => ci.checkedInAt >= dayStart && ci.checkedInAt < dayEnd
      );

      const adults = dayCIs.reduce((s, ci) => s + ci.adultCount, 0);
      const children = dayCIs.reduce((s, ci) => s + ci.childCount, 0);
      const total = adults + children;

      const label = `${dayNames[dayStart.getDay()]} ${dayStart.getDate()} ${monthNames[dayStart.getMonth()]}`;
      const shortLabel = dayNames[dayStart.getDay()];

      // Only include days up to today
      if (dayStart <= today) {
        days.push({ date: dayStart.toISOString(), label, adults, children, total, level: dayLevel(total) });
        totalGuests += total;
        guestsPerDay.push({ label: shortLabel, total });

        if (total > peakDay.total) {
          peakDay = { label: dayNames[dayStart.getDay()], total };
        }
      } else {
        guestsPerDay.push({ label: shortLabel, total: 0 });
      }
    }

    const activeDays = days.length || 1;
    const avgPerDay = Math.round(totalGuests / activeDays);

    // Last week total for comparison
    const lastWeekTotal = lastWeekCheckIns.reduce((s, ci) => s + ci.adultCount + ci.childCount, 0);
    const lastWeekAvg = Math.round(lastWeekTotal / 7);

    const totalChange = lastWeekTotal > 0
      ? Math.round(((totalGuests - lastWeekTotal) / lastWeekTotal) * 100)
      : null;
    const avgChange = lastWeekAvg > 0
      ? Math.round(((avgPerDay - lastWeekAvg) / lastWeekAvg) * 100)
      : null;

    // Peak hours - hourly buckets 07:00–12:00 for today
    const peakHours: { time: string; people: number }[] = [];
    for (let hour = 7; hour <= 12; hour++) {
      const slotStart = new Date(today);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1);

      const people = checkIns
        .filter((ci) => ci.checkedInAt >= slotStart && ci.checkedInAt < slotEnd)
        .reduce((s, ci) => s + ci.adultCount + ci.childCount, 0);

      peakHours.push({ time: `${String(hour).padStart(2, "0")}:00`, people });
    }

    const busiestHour = peakHours.reduce(
      (max, s) => (s.people > max.people ? s : max),
      { time: "–", people: 0 }
    );

    return success({
      summary: {
        totalGuests,
        avgPerDay,
        peakDay: peakDay.label,
        busiestHour: busiestHour.time,
        totalChange,
        avgChange,
      },
      days,
      guestsPerDay,
      peakHours,
    });
  } catch (err) {
    console.error("Reports error:", err);
    return error("Failed to fetch reports", 500);
  }
}