// Persistent announcement store — backed by the database so messages survive server restarts.
// The table holds at most one row (id = 1), managed via upsert/delete.

import prisma from "@/backend/db";

export interface AnnouncementData {
  text: string;
  updatedBy: string;
  updatedAt: string | null;
  isVisible: boolean;
}

const EMPTY: AnnouncementData = { text: "", updatedBy: "", updatedAt: null, isVisible: false };

export async function getAnnouncement(): Promise<AnnouncementData> {
  try {
    const row = await prisma.announcement.findUnique({ where: { id: 1 } });
    if (!row) return EMPTY;
    return {
      text:      row.text,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt.toISOString(),
      isVisible: row.isVisible,
    };
  } catch {
    return EMPTY;
  }
}

export async function setAnnouncement(text: string, updatedBy: string): Promise<AnnouncementData> {
  const row = await prisma.announcement.upsert({
    where:  { id: 1 },
    create: { id: 1, text: text.trim(), updatedBy, isVisible: true },
    update: { text: text.trim(), updatedBy, isVisible: true },
  });
  return { text: row.text, updatedBy: row.updatedBy, updatedAt: row.updatedAt.toISOString(), isVisible: row.isVisible };
}

export async function setAnnouncementVisibility(isVisible: boolean): Promise<AnnouncementData> {
  const existing = await prisma.announcement.findUnique({ where: { id: 1 } });
  if (!existing) return EMPTY;
  const row = await prisma.announcement.update({ where: { id: 1 }, data: { isVisible } });
  return { text: row.text, updatedBy: row.updatedBy, updatedAt: row.updatedAt.toISOString(), isVisible: row.isVisible };
}

export async function clearAnnouncement(): Promise<void> {
  await prisma.announcement.deleteMany({});
}
