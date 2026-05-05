// ===========================================
// UTILITIES - Shared helper functions
// ===========================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes without conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time for display (e.g., "08:42")
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format date for display (e.g., "Fri 9 May 2026")
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
