// GET /api/kitchen/public — public, no auth required
import prisma from "@/backend/db";
import { success, error } from "@/backend/api-helpers";

export async function GET() {
  try {
    const items = await prisma.kitchenItem.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, status: true },
    });
    return success(items);
  } catch (err) {
    console.error("Kitchen public error:", err);
    return error("Failed to fetch kitchen items", 500);
  }
}
