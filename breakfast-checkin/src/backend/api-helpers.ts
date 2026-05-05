// ===========================================
// API HELPERS - Consistent response format
// ===========================================

import { NextResponse } from "next/server";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function conflict(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 409 });
}

// Helper to get today's date
export function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
