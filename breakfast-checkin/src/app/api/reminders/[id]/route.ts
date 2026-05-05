// ===========================================
// PATCH  /api/reminders/[id] - Mark complete / reactivate (creator or ADMIN)
// DELETE /api/reminders/[id] - Remove a reminder (creator or ADMIN)
// ===========================================

import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

async function getAuthorizedReminder(reminderId: number, staffId: number, role: string) {
  const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
  if (!reminder) return { reminder: null, forbidden: false };

  const isOwner = reminder.createdBy === staffId;
  const isAdmin = role === "ADMIN";

  return { reminder, forbidden: !isOwner && !isAdmin };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    const { id } = await params;
    const reminderId = parseInt(id, 10);
    if (isNaN(reminderId)) return error("Invalid reminder ID", 400);

    const { reminder, forbidden } = await getAuthorizedReminder(reminderId, staff.staffId, staff.role);
    if (!reminder) return error("Reminder not found", 404);
    if (forbidden) return error("You can only modify your own reminders", 403);

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["ACTIVE", "COMPLETED", "OVERDUE"];
    if (!validStatuses.includes(status)) return error("Invalid status");

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return success(updated);
  } catch (err) {
    console.error("Reminder PATCH error:", err);
    return error("Failed to update reminder", 500);
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
    const reminderId = parseInt(id, 10);
    if (isNaN(reminderId)) return error("Invalid reminder ID", 400);

    const { reminder, forbidden } = await getAuthorizedReminder(reminderId, staff.staffId, staff.role);
    if (!reminder) return error("Reminder not found", 404);
    if (forbidden) return error("You can only delete your own reminders", 403);

    await prisma.reminder.delete({ where: { id: reminderId } });
    return success({ deleted: true });
  } catch (err) {
    console.error("Reminder DELETE error:", err);
    return error("Failed to delete reminder", 500);
  }
}
