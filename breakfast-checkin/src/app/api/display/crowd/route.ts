// ===========================================
// POST   /api/display/crowd - Set manual crowd override
// DELETE /api/display/crowd - Clear manual override
// GET    /api/display/crowd - Get current override
// ===========================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";
import { getCrowdOverride, setCrowdOverride, clearCrowdOverride, CrowdLevel } from "@/backend/crowd-store";

const VALID_LEVELS: CrowdLevel[] = ["LOW", "MODERATE", "BUSY", "VERY_BUSY"];

export async function GET() {
  return success(getCrowdOverride());
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireAuth();
    const body  = await request.json();
    const level = body.level as CrowdLevel;

    if (!VALID_LEVELS.includes(level)) {
      return error(`Invalid level. Use one of: ${VALID_LEVELS.join(", ")}`);
    }

    setCrowdOverride(level, staff.name);
    return success(getCrowdOverride());
  } catch {
    return unauthorized();
  }
}

export async function DELETE() {
  try {
    await requireAuth();
    clearCrowdOverride();
    return success({ cleared: true });
  } catch {
    return unauthorized();
  }
}
