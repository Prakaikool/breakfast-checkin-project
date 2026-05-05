// GET /api/auth/me - Get current logged-in staff info
import { getCurrentStaff } from "@/backend/auth";
import { success, unauthorized } from "@/backend/api-helpers";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) return unauthorized();
  return success(staff);
}
