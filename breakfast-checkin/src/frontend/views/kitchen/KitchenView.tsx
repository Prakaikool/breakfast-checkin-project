"use client";

import { useState, useEffect } from "react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import type { KitchenItem } from "@/types";

const STATUS_CYCLE: KitchenItem["status"][] = ["AVAILABLE", "LOW", "SOLD_OUT"];

const STATUS_STYLES: Record<KitchenItem["status"], {
  dot: string; text: string; label: string; card: string; badge: string;
}> = {
  AVAILABLE: {
    dot:   "bg-[#4a7a3d]",
    text:  "text-[#4a7a3d]",
    label: "Available",
    card:  "border-[#e5e5e0] hover:border-[#b8d4b0] hover:bg-[#fafcf9]",
    badge: "bg-[#e8efe5] text-[#4a7a3d]",
  },
  LOW: {
    dot:   "bg-[#d4893f]",
    text:  "text-[#d4893f]",
    label: "Running Low",
    card:  "border-[#f5d9b8] hover:border-[#f0c89a] hover:bg-[#fffaf5]",
    badge: "bg-[#fff3e8] text-[#a05c1e]",
  },
  SOLD_OUT: {
    dot:   "bg-[#d45f5f]",
    text:  "text-[#d45f5f]",
    label: "Sold Out",
    card:  "border-[#f5c0c0] hover:border-[#f0a0a0] hover:bg-[#fffafa]",
    badge: "bg-[#fdeeee] text-[#c04040]",
  },
};

export default function KitchenView() {
  const { staff } = useAuth();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kitchen")
      .then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.data); })
      .catch(() => setError("Failed to load kitchen items."))
      .finally(() => setLoading(false));
  }, []);

  const cycleStatus = async (item: KitchenItem) => {
    const currentIdx = STATUS_CYCLE.indexOf(item.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: nextStatus } : i));
    setUpdatingId(item.id);

    try {
      const res = await fetch(`/api/kitchen/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Revert on failure
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: item.status } : i));
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!staff) return null;

  const available = items.filter((i) => i.status === "AVAILABLE").length;
  const low       = items.filter((i) => i.status === "LOW").length;
  const soldOut   = items.filter((i) => i.status === "SOLD_OUT").length;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="Kitchen menu availability" staff={staff} />

      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">Kitchen</span>
        </div>
      </div>

      <div className="p-4 md:p-7 max-w-5xl">
        {/* Summary bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 bg-[#e8efe5] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a7a3d]" />
            <span className="text-xs font-semibold text-[#4a7a3d]">{available} Available</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#fff3e8] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4893f]" />
            <span className="text-xs font-semibold text-[#a05c1e]">{low} Low</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#fdeeee] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d45f5f]" />
            <span className="text-xs font-semibold text-[#c04040]">{soldOut} Sold Out</span>
          </div>
          <span className="ml-auto text-xs text-[#9e9e9e]">Click any item to cycle status</span>
        </div>

        {error && (
          <div className="bg-[#fdeeee] border border-[#f5c0c0] text-[#c04040] text-sm px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-xs underline">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white border border-[#e5e5e0] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-12 text-center">
            <p className="text-sm text-[#9e9e9e]">No kitchen items configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => {
              const style = STATUS_STYLES[item.status];
              const isUpdating = updatingId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => cycleStatus(item)}
                  disabled={isUpdating}
                  className={`flex items-center justify-between bg-white border rounded-xl px-5 py-4 transition-all text-left disabled:opacity-60 ${style.card}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot} ${isUpdating ? "animate-pulse" : ""}`} />
                    <span className="text-sm font-medium text-[#2d2d2d]">{item.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                    {isUpdating ? "Updating…" : style.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
