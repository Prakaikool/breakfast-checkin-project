// ===========================================
// PATCH  /api/daily-log/[id] - Toggle pin (ADMIN/SUPERVISOR only)
// DELETE /api/daily-log/[id] - Delete entry (creator or ADMIN/SUPERVISOR)
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

const ELEVATED_ROLES = ["ADMIN", "SUPERVISOR"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    if (!ELEVATED_ROLES.includes(staff.role)) {
      return error("Only admins and supervisors can pin entries", 403);
    }

    const { id } = await params;
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) return error("Invalid entry ID", 400);

    const body = await request.json();
    const { isPinned } = body;

    if (typeof isPinned !== "boolean") return error("isPinned must be a boolean", 400);

    const updated = await prisma.dailyLogEntry.update({
      where: { id: entryId },
      data: { isPinned },
    });

    return success(updated);
  } catch (err) {
    console.error("Daily log PATCH error:", err);
    return error("Failed to update entry", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const { id } = await params;
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) return error("Invalid entry ID", 400);

    // Fetch entry to check ownership
    const entry = await prisma.dailyLogEntry.findUnique({ where: { id: entryId } });
    if (!entry) return error("Entry not found", 404);

    const isOwner = entry.staffId === staff.staffId;
    const isElevated = ELEVATED_ROLES.includes(staff.role);

    if (!isOwner && !isElevated) {
      return error("You can only delete your own entries", 403);
    }

    await prisma.dailyLogEntry.delete({ where: { id: entryId } });
    return success({ deleted: true });
  } catch (err) {
    console.error("Daily log DELETE error:", err);
    return error("Failed to delete entry", 500);
  }
}
