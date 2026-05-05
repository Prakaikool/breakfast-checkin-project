// ===========================================
// GET  /api/instructions - All staff (auth required)
// POST /api/instructions - ADMIN only, create section
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { instructionSchema } from "@/backend/validations";
import { success, error, unauthorized, created } from "@/backend/api-helpers";

export async function GET() {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const sections = await prisma.instructionSection.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return success(sections);
  } catch (err) {
    console.error("Instructions GET error:", err);
    return error("Failed to fetch instructions", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }
    if (staff.role !== "ADMIN") return error("Only admins can create instructions", 403);

    const body   = await request.json();
    const parsed = instructionSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message, 400);

    const { title, content, imageUrl } = parsed.data;

    const maxOrder = await prisma.instructionSection.aggregate({ _max: { sortOrder: true } });
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    const section = await prisma.instructionSection.create({
      data: {
        title:    title.trim(),
        content:  content.trim(),
        imageUrl: imageUrl ?? null,
        sortOrder: nextOrder,
      },
    });

    return created(section);
  } catch (err) {
    console.error("Instructions POST error:", err);
    return error("Failed to create instruction", 500);
  }
}
