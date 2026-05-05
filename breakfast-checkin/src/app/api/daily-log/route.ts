// ===========================================
// GET  /api/daily-log - Today's log entries
// POST /api/daily-log - Create a new entry
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { dailyLogSchema } from "@/backend/validations";
import { success, created, error, unauthorized, todayDate } from "@/backend/api-helpers";

export async function GET() {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const today    = todayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await prisma.dailyLogEntry.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return success(entries);
  } catch (err) {
    console.error("Daily log GET error:", err);
    return error("Failed to fetch log entries", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const body = await request.json();
    const parsed = dailyLogSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message, 400);

    const { category, content } = parsed.data;

    const entry = await prisma.dailyLogEntry.create({
      data: {
        category,
        content: content.trim(),
        staffId:   staff.staffId,
        staffName: staff.name,
      },
    });

    return created(entry);
  } catch (err) {
    console.error("Daily log POST error:", err);
    return error("Failed to save log entry", 500);
  }
}
