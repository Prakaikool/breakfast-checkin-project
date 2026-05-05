// ===========================================
// /api/display/announcement
// GET    - public, returns current announcement (including isVisible)
// POST   - staff only, saves new text and sets visible=true
// PATCH  - staff only, toggles isVisible (hide / show again)
// DELETE - staff only, permanently removes the announcement
// ===========================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";
import {
  getAnnouncement,
  setAnnouncement,
  setAnnouncementVisibility,
  clearAnnouncement,
} from "@/backend/announcement-store";

export async function GET() {
  return success(await getAnnouncement());
}

export async function POST(request: NextRequest) {
  let staff;
  try {
    staff = await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text : "";

    if (text.trim().length === 0) return error("Announcement text is required");
    if (text.length > 300) return error("Announcement must be 300 characters or less");

    return success(await setAnnouncement(text, staff.name));
  } catch (err) {
    console.error("POST /api/display/announcement error:", err);
    return error("Failed to save announcement", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const isVisible = typeof body.isVisible === "boolean" ? body.isVisible : false;
    return success(await setAnnouncementVisibility(isVisible));
  } catch (err) {
    console.error("PATCH /api/display/announcement error:", err);
    return error("Failed to update announcement visibility", 500);
  }
}

export async function DELETE() {
  try {
    await requireAuth();
  } catch {
    return unauthorized();
  }

  try {
    await clearAnnouncement();
    return success({ cleared: true });
  } catch (err) {
    console.error("DELETE /api/display/announcement error:", err);
    return error("Failed to delete announcement", 500);
  }
}
