import { NextResponse } from "next/server";
import prisma from "@/backend/db";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (err) {
    checks.db = "error";
    checks.dbError = String(err);
  }

  return NextResponse.json(checks);
}
