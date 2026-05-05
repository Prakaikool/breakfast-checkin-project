// POST /api/auth/logout - Revoke the JWT and clear the auth cookie
import { cookies } from "next/headers";
import { revokeCurrentToken } from "@/backend/auth";
import { success } from "@/backend/api-helpers";

export async function POST() {
  await revokeCurrentToken();
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  return success({ message: "Logged out" });
}
