// GET /api/kitchen - List all kitchen items
import prisma from "@/backend/db";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

export async function GET() {
  try {
    try { await requireAuth(); } catch { return unauthorized(); }

    const items = await prisma.kitchenItem.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return success(items);
  } catch (err) {
    console.error("Kitchen list error:", err);
    return error("Failed to fetch kitchen items", 500);
  }
}
