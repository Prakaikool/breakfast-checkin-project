// ===========================================
// PUT    /api/instructions/[id] - ADMIN only, update section
// DELETE /api/instructions/[id] - ADMIN only, delete section
// PATCH  /api/instructions/[id] - ADMIN only, reorder (up/down)
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { instructionSchema } from "@/backend/validations";
import { success, error, unauthorized } from "@/backend/api-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }
    if (staff.role !== "ADMIN") return error("Only admins can edit instructions", 403);

    const { id } = await params;
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) return error("Invalid section ID", 400);

    const body   = await request.json();
    const parsed = instructionSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message, 400);

    const { title, content, imageUrl } = parsed.data;

    const existing = await prisma.instructionSection.findUnique({ where: { id: sectionId } });
    if (!existing) return error("Section not found", 404);

    const section = await prisma.instructionSection.update({
      where: { id: sectionId },
      data: {
        title:    title.trim(),
        content:  content.trim(),
        imageUrl: imageUrl ?? null,
      },
    });

    return success(section);
  } catch (err) {
    console.error("Instructions PUT error:", err);
    return error("Failed to update instruction", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }
    if (staff.role !== "ADMIN") return error("Only admins can delete instructions", 403);

    const { id } = await params;
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) return error("Invalid section ID", 400);

    const existing = await prisma.instructionSection.findUnique({ where: { id: sectionId } });
    if (!existing) return error("Section not found", 404);

    await prisma.instructionSection.delete({ where: { id: sectionId } });
    return success({ deleted: true });
  } catch (err) {
    console.error("Instructions DELETE error:", err);
    return error("Failed to delete instruction", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }
    if (staff.role !== "ADMIN") return error("Only admins can reorder instructions", 403);

    const { id } = await params;
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) return error("Invalid section ID", 400);

    const body = await request.json();
    const { direction } = body;

    // Strictly validate direction to prevent open-ended queries
    if (direction !== "up" && direction !== "down") {
      return error("direction must be 'up' or 'down'", 400);
    }

    const current = await prisma.instructionSection.findUnique({ where: { id: sectionId } });
    if (!current) return error("Section not found", 404);

    const neighbor = await prisma.instructionSection.findFirst({
      where: {
        sortOrder: direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbor) return success({ moved: false });

    await prisma.$transaction([
      prisma.instructionSection.update({
        where: { id: current.id },
        data:  { sortOrder: neighbor.sortOrder },
      }),
      prisma.instructionSection.update({
        where: { id: neighbor.id },
        data:  { sortOrder: current.sortOrder },
      }),
    ]);

    return success({ moved: true });
  } catch (err) {
    console.error("Instructions PATCH error:", err);
    return error("Failed to reorder instruction", 500);
  }
}
