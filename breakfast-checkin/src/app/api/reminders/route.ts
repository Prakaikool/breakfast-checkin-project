// ===========================================
// GET  /api/reminders - List today's reminders
// POST /api/reminders - Create a new reminder
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { reminderSchema } from "@/backend/validations";
import { success, created, error, unauthorized } from "@/backend/api-helpers";

export async function GET() {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const now        = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const dayOfWeek  = now.getDay();
    const isWeekday  = dayOfWeek >= 1 && dayOfWeek <= 5;

    const reminders = await prisma.reminder.findMany({
      where: {
        createdBy: staff.staffId,
        status:    { not: "COMPLETED" },
        recurrence: {
          in: isWeekday
            ? ["TODAY", "EVERY_DAY", "WEEKDAYS"]
            : ["TODAY", "EVERY_DAY"],
        },
      },
      orderBy: { time: "asc" },
    });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const completed  = await prisma.reminder.findMany({
      where: {
        createdBy:   staff.staffId,
        status:      "COMPLETED",
        completedAt: { gte: todayStart },
      },
      orderBy: { time: "asc" },
    });

    const all = [...reminders, ...completed].map((r) => ({
      ...r,
      isOverdue: r.status === "ACTIVE" && r.time < currentTime,
    }));

    all.sort((a, b) => {
      const rank = (r: typeof a) => (r.status === "COMPLETED" ? 2 : r.isOverdue ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.time.localeCompare(b.time);
    });

    return success(all);
  } catch (err) {
    console.error("Reminders GET error:", err);
    return error("Failed to fetch reminders", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const body   = await request.json();
    const parsed = reminderSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message, 400);

    const { title, time, recurrence } = parsed.data;

    const reminder = await prisma.reminder.create({
      data: {
        title: title.trim(),
        time,
        recurrence,
        status:    "ACTIVE",
        createdBy: staff.staffId,
      },
    });

    return created(reminder);
  } catch (err) {
    console.error("Reminders POST error:", err);
    return error("Failed to create reminder", 500);
  }
}
