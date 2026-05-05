// ===========================================
// POST /api/upload - Image upload
// ADMIN only. Saves to public/uploads/.
// Returns { url: "/uploads/filename.ext" }
// ===========================================

import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAuth } from "@/backend/auth";
import { success, error, unauthorized } from "@/backend/api-helpers";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

// Detect real image type from file magic bytes — ignores client-supplied Content-Type.
function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // GIF87a / GIF89a: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    let staff;
    try { staff = await requireAuth(); } catch { return unauthorized(); }
    if (staff.role !== "ADMIN") return error("Only admins can upload images", 403);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return error("No file provided");
    if (file.size > MAX_SIZE_BYTES) return error("Image must be under 8 MB");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate via magic bytes — client-supplied Content-Type is not trusted
    const mime = detectMimeType(buffer);
    if (!mime) return error("Only JPEG, PNG, WebP and GIF images are allowed");

    const ext = MIME_TO_EXT[mime];
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return success({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return error("Upload failed", 500);
  }
}
