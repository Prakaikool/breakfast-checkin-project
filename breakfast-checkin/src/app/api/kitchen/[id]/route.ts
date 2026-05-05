// PATCH /api/kitchen/[id] - Update kitchen item status (KITCHEN, SUPERVISOR, ADMIN only)
import { NextRequest } from "next/server";
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { kitchenItemSchema } from "@/backend/validations";
import { success, error, unauthorized } from "@/backend/api-helpers";

const ALLOWED_ROLES = ["KITCHEN", "SUPERVISOR", "ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }

    if (!ALLOWED_ROLES.includes(staff.role)) {
      return error("Only kitchen staff, supervisors, and admins can update menu items", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = kitchenItemSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message);

    const item = await prisma.kitchenItem.update({
      where: { id: parseInt(id) },
      data: { status: parsed.data.status },
    });

    return success(item);
  } catch (err) {
    console.error("Kitchen update error:", err);
    return error("Failed to update item", 500);
  }
}
