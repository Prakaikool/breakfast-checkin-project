"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  AlertTriangle,
  Star,
  UtensilsCrossed,
  Sparkles,
  Pin,
  PinOff,
  Trash2,
  Plus,
  Search,
  BookOpen,
} from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";

type LogCategory = "SHIFT_NOTE" | "INCIDENT" | "VIP" | "KITCHEN" | "HOUSEKEEPING";

interface LogEntry {
  id: number;
  category: LogCategory;
  content: string;
  staffName: string;
  isPinned: boolean;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<
  LogCategory,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string; leftBar: string }
> = {
  SHIFT_NOTE: { label: "Shift Note", icon: ClipboardList, color: "text-[#4a7a3d]", bg: "bg-[#e8efe5]", border: "border-[#c8dcc0]", leftBar: "bg-[#6b8a5e]" },
  INCIDENT: { label: "Incident", icon: AlertTriangle, color: "text-[#c04040]", bg: "bg-[#fdeeee]", border: "border-[#f0c8c8]", leftBar: "bg-[#d45f5f]" },
  VIP: { label: "VIP", icon: Star, color: "text-[#a05c1e]", bg: "bg-[#fff3e8]", border: "border-[#f0d8b8]", leftBar: "bg-[#c07820]" },
  KITCHEN: { label: "Kitchen", icon: UtensilsCrossed, color: "text-[#2e6a82]", bg: "bg-[#e5eff3]", border: "border-[#b8d8e8]", leftBar: "bg-[#3a8aaa]" },
  HOUSEKEEPING: { label: "Housekeeping", icon: Sparkles, color: "text-[#6a3e8a]", bg: "bg-[#f3eef8]", border: "border-[#d8c8ec]", leftBar: "bg-[#8a5aaa]" },
};

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [LogCategory, typeof CATEGORY_CONFIG[LogCategory]][];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function staffInitials(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function staffShort(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

const AVATAR_COLORS = [
  "bg-[#6b8a5e] text-white",
  "bg-[#c07820] text-white",
  "bg-[#3a8aaa] text-white",
  "bg-[#8a5aaa] text-white",
  "bg-[#d45f5f] text-white",
];
function avatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export default function DailyLogView() {
  const { staff } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [category, setCategory] = useState<LogCategory>("SHIFT_NOTE");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pinningId, setPinningId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState<LogCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const loadEntries = useCallback(async () => {
    const res = await fetch("/api/daily-log");
    const data = await res.json();
    if (data.success) setEntries(data.data);
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  if (!staff) return null;

  const counts = Object.fromEntries(
    CATEGORIES.map(([k]) => [k, entries.filter((e) => e.category === k).length])
  ) as Record<LogCategory, number>;

  const filtered = entries.filter((e) => {
    if (filterCat !== "ALL" && e.category !== filterCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.content.toLowerCase().includes(q) || e.staffName.toLowerCase().includes(q);
    }
    return true;
  });

  const pinned = filtered.filter((e) => e.isPinned);
  const normal = filtered.filter((e) => !e.isPinned);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, content }),
    });
    const data = await res.json();
    if (data.success) {
      setContent("");
      await loadEntries();
    } else {
      setSaveError(data.error ?? "Failed to save entry.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await fetch(`/api/daily-log/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  };

  const handlePin = async (entry: LogEntry) => {
    setPinningId(entry.id);
    const newPinned = !entry.isPinned;
    setEntries((prev) => {
      const updated = prev.map((e) => e.id === entry.id ? { ...e, isPinned: newPinned } : e);
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    await fetch(`/api/daily-log/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: newPinned }),
    });
    setPinningId(null);
  };

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="Daily staff log" staff={staff} />

      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2.5">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">Daily Log</span>
        </div>
      </div>

      <div className="p-4 md:p-7 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        <div className="lg:sticky lg:top-6 flex flex-col gap-4">

          <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e5e0] flex items-center gap-2">
              <Plus size={15} className="text-[#6b8a5e]" />
              <p className="text-sm font-semibold text-[#2d2d2d]">New Entry</p>
              <span className="ml-auto text-[10px] text-[#9e9e9e]">Ctrl+Enter to save</span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider">Category</p>
                <div className="flex flex-col gap-1.5">
                  {CATEGORIES.map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                          active
                            ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                            : "bg-white text-[#6b6b6b] border-[#e5e5e0] hover:border-[#c8c8c8] hover:bg-[#fafafa]"
                        }`}
                      >
                        <Icon size={13} className={active ? cfg.color : "text-[#9e9e9e]"} />
                        {cfg.label}
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">Note</p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave(); }}
                  placeholder="Write your log entry…"
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#b8b8b8] resize-none focus:outline-none focus:border-[#6b8a5e] focus:bg-white transition-colors"
                />
              </div>

              {saveError && <p className="text-xs text-[#d45f5f]">{saveError}</p>}

              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="w-full py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                {saving ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
            <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-3">Today&apos;s Summary</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(([key, cfg]) => {
                const count = counts[key];
                if (count === 0) return null;
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon size={12} className={cfg.color} />
                    <span className="text-xs text-[#6b6b6b] flex-1">{cfg.label}</span>
                    <span className={`text-xs font-bold ${cfg.color}`}>{count}</span>
                  </div>
                );
              })}
              {entries.length === 0 && (
                <p className="text-xs text-[#c0c0c0] text-center py-1">No entries yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries…"
                className="w-full pl-8 pr-3 py-2 bg-white border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#b8b8b8] focus:outline-none focus:border-[#6b8a5e] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterCat("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filterCat === "ALL"
                    ? "bg-[#2d2d2d] text-white border-[#2d2d2d]"
                    : "bg-white text-[#6b6b6b] border-[#e5e5e0] hover:border-[#c0c0c0]"
                }`}
              >
                All ({entries.length})
              </button>
              {CATEGORIES.map(([key, cfg]) => {
                if (counts[key] === 0) return null;
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterCat(filterCat === key ? "ALL" : key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      filterCat === key
                        ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                        : "bg-white text-[#6b6b6b] border-[#e5e5e0] hover:border-[#c0c0c0]"
                    }`}
                  >
                    <Icon size={11} />
                    {cfg.label}
                    <span className={`font-bold ${filterCat === key ? cfg.color : "text-[#9e9e9e]"}`}>{counts[key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e5e5e0] rounded-xl py-16 flex flex-col items-center gap-3 text-center">
              <BookOpen size={32} className="text-[#d5d5d0]" />
              <p className="text-sm font-medium text-[#9e9e9e]">
                {entries.length === 0 ? "No entries yet today." : "No entries match your filter."}
              </p>
              {entries.length === 0 && (
                <p className="text-xs text-[#c0c0c0]">Use the form on the left to log your first entry.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pinned.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <Pin size={11} className="text-[#6b8a5e]" />
                    <span className="text-[11px] font-bold text-[#9e9e9e] uppercase tracking-wider">Pinned</span>
                    <div className="flex-1 h-px bg-[#e5e5e0]" />
                  </div>
                  {pinned.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      pinning={pinningId === entry.id}
                      deleting={deletingId === entry.id}
                    />
                  ))}
                  {normal.length > 0 && (
                    <div className="flex items-center gap-2 px-1 mt-2">
                      <span className="text-[11px] font-bold text-[#9e9e9e] uppercase tracking-wider">Today</span>
                      <div className="flex-1 h-px bg-[#e5e5e0]" />
                    </div>
                  )}
                </>
              )}

              {normal.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onPin={handlePin}
                  onDelete={handleDelete}
                  pinning={pinningId === entry.id}
                  deleting={deletingId === entry.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  onPin,
  onDelete,
  pinning,
  deleting,
}: {
  entry: LogEntry;
  onPin: (e: LogEntry) => void;
  onDelete: (id: number) => void;
  pinning: boolean;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cfg = CATEGORY_CONFIG[entry.category];
  const Icon = cfg.icon;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all group ${
      entry.isPinned ? "border-[#b8d4b0]" : "border-[#e5e5e0]"
    }`}>
      <div className="flex">
        <div className={`w-1 shrink-0 ${cfg.leftBar}`} />

        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              <Icon size={10} />
              {cfg.label}
            </span>

            {entry.isPinned && (
              <Pin size={11} className="text-[#6b8a5e]" />
            )}

            <span className="text-xs text-[#9e9e9e]">{formatTime(entry.createdAt)}</span>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-[#9e9e9e]">{staffShort(entry.staffName)}</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(entry.staffName)}`}>
                {staffInitials(entry.staffName)}
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button
                  onClick={() => onPin(entry)}
                  disabled={pinning}
                  title={entry.isPinned ? "Unpin" : "Pin to top"}
                  className={`p-1.5 rounded-md transition-colors ${
                    entry.isPinned
                      ? "text-[#6b8a5e] hover:bg-[#e8efe5]"
                      : "text-[#9e9e9e] hover:text-[#6b8a5e] hover:bg-[#e8efe5]"
                  }`}
                >
                  {entry.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                </button>

                {confirmDelete ? (
                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-[11px] text-[#9e9e9e]">Delete?</span>
                    <button
                      onClick={() => onDelete(entry.id)}
                      disabled={deleting}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold text-white bg-[#d45f5f] hover:bg-[#c04040] disabled:opacity-50 transition-colors"
                    >
                      {deleting ? "…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium text-[#6b6b6b] hover:bg-[#f5f5f0] transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    title="Delete entry"
                    className="p-1.5 rounded-md text-[#9e9e9e] hover:text-[#d45f5f] hover:bg-[#fdeeee] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-[#2d2d2d] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
        </div>
      </div>
    </div>
  );
}
