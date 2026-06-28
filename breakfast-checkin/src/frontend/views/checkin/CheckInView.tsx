"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { X, AlertTriangle, Check, ChevronRight, UserPlus, LogOut, Users } from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import type { RoomResult } from "@/types";

type SortKey   = "name" | "room" | "status";
type FilterKey = "all" | "pending" | "checked";
type FlashType = "success" | "error" | "duplicate" | "cap";
interface Flash { type: FlashType; text: string }
interface Stats {
  totalCheckIns: number;
  currentlyInside: number;
  totalWalkIns: number;
  totalCheckedOut: number;
  duplicatesBlocked: number;
}
interface CheckInRecord {
  id: number;
  roomNumber: string | null;
  guestName: string;
  guestType: string;
  adultCount: number;
  childCount: number;
  staffName: string;
  isDuplicate: boolean;
  isOverride: boolean;
  isWalkIn: boolean;
  checkedInAt: string;
  checkedOutAt: string | null;
  note: string | null;
}

function Counter({
  label, value, onChange, max, min = 0,
}: { label: string; value: number; onChange: (n: number) => void; max?: number; min?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-[#9e9e9e] uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-[#e5e5e0] flex items-center justify-center text-[#6b6b6b] hover:border-[#6b8a5e] hover:text-[#6b8a5e] transition-colors"
        >−</button>
        <span className="w-7 text-center text-base font-bold text-[#2d2d2d]">{value}</span>
        <button
          onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          disabled={max !== undefined && value >= max}
          className="w-7 h-7 rounded-full border border-[#e5e5e0] flex items-center justify-center text-[#6b6b6b] hover:border-[#6b8a5e] hover:text-[#6b8a5e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >+</button>
      </div>
      {max !== undefined && (
        <span className="text-[10px] text-[#c0c0c0]">max {max}</span>
      )}
    </div>
  );
}

function WalkInModalBody({
  subtitle, onClose, onSubmit,
}: { subtitle: string; onClose: () => void; onSubmit: (adults: number, children: number, note: string) => Promise<void> }) {
  const [adults, setAdults]     = useState(1);
  const [children, setChildren] = useState(0);
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true); setErr(null);
    try { await onSubmit(adults, children, note); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Walk-in failed."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-85 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e5e0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fff3e8] flex items-center justify-center">
              <UserPlus size={15} className="text-[#a05c1e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2d2d2d]">Walk-In Guest</p>
              <p className="text-xs text-[#9e9e9e]">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#2d2d2d]"><X size={15} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {err && <div className="px-3 py-2 bg-[#fdeeee] text-[#c04040] text-xs rounded-lg border border-[#f5c0c0]">{err}</div>}
          <div className="bg-[#fff3e8] border border-[#f0d8b8] rounded-lg px-3 py-2.5 text-xs text-[#a05c1e]">
            Walk-in guests are tracked separately from registered room guests.
          </div>
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
            <div className="flex items-center justify-around">
              <Counter label="Adults"   value={adults}   onChange={setAdults}   min={0} />
              <div className="h-10 w-px bg-[#e5e5e0]" />
              <Counter label="Children" value={children} onChange={setChildren} min={0} />
              <div className="h-10 w-px bg-[#e5e5e0]" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-[#9e9e9e] uppercase tracking-wide">Total</span>
                <span className="text-2xl font-bold text-[#2d2d2d]">{adults + children}</span>
              </div>
            </div>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)…"
            rows={2}
            className="w-full px-3 py-2 bg-white border border-[#e5e5e0] rounded-xl text-xs text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:border-[#6b8a5e] resize-none"
          />
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs font-medium text-[#9e9e9e] border border-[#e5e5e0] rounded-xl hover:bg-[#f5f5f0] transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving || adults + children === 0}
              className="flex-1 py-2.5 bg-[#c07820] text-white text-xs font-bold rounded-xl hover:bg-[#a06010] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus size={13} />
              {saving ? "Adding…" : "Add Walk-In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalkInModal({
  roomNumber, roomId, onClose, onSuccess,
}: { roomNumber: string; roomId: number; onClose: () => void; onSuccess: () => void }) {
  const submit = async (adults: number, children: number, note: string) => {
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, adultCount: adults, childCount: children, note: note.trim() || undefined, isWalkIn: true }),
    });
    const data = await res.json();
    if (data.success) { onSuccess(); onClose(); }
    else throw new Error(data.error || "Walk-in failed.");
  };
  return <WalkInModalBody subtitle={`Room ${roomNumber} · Extra, not registered`} onClose={onClose} onSubmit={submit} />;
}

function StandaloneWalkInModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const submit = async (adults: number, children: number, note: string) => {
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adultCount: adults, childCount: children, note: note.trim() || undefined, isWalkIn: true }),
    });
    const data = await res.json();
    if (data.success) { onSuccess(); onClose(); }
    else throw new Error(data.error || "Walk-in failed.");
  };
  return <WalkInModalBody subtitle="No room · Independent walk-in" onClose={onClose} onSubmit={submit} />;
}

export default function CheckInView() {
  const { staff }   = useAuth();
  const searchRef   = useRef<HTMLInputElement>(null);

  const [allRooms, setAllRooms]   = useState<RoomResult[]>([]);
  const [activity, setActivity]   = useState<CheckInRecord[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);

  const [selected, setSelected]       = useState<RoomResult | null>(null);
  const [adultCount, setAdultCount]   = useState(1);
  const [childCount, setChildCount]   = useState(0);

  const [searchQuery, setSearchQuery]         = useState("");
  const [sortKey, setSortKey]                 = useState<SortKey>("room");
  const [filterKey, setFilterKey]             = useState<FilterKey>("all");
  const [activityFilter, setActivityFilter]   = useState<"all" | "normal" | "walkin" | "checkout">("all");
  const [flash, setFlash]                     = useState<Flash | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [roomsLoading, setRoomsLoading]       = useState(true);
  const [success, setSuccess]                 = useState(false);
  const [walkInModal, setWalkInModal]               = useState(false);
  const [standaloneWalkInModal, setStandaloneWalkIn] = useState(false);
  const [checkingOutId, setCheckingOutId]           = useState<number | null>(null);
  const [guestNote, setGuestNote]             = useState("");
  const [guestNoteOriginal, setGuestNoteOriginal] = useState("");
  const [guestNoteSaving, setGuestNoteSaving] = useState(false);

  const loadAll = useCallback(async () => {
    const [gRes, aRes, sRes] = await Promise.all([
      fetch("/api/guests?all=true"),
      fetch("/api/checkins"),
      fetch("/api/dashboard/stats"),
    ]);
    const [gData, aData, sData] = await Promise.all([gRes.json(), aRes.json(), sRes.json()]);
    if (gData.success) setAllRooms(gData.data.results);
    if (aData.success) setActivity(aData.data.checkIns);
    if (sData.success) setStats(sData.data);
    setRoomsLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { searchRef.current?.focus(); }, []);

  if (!staff) return null;

  const registeredTotal    = selected ? selected.totalAdults + selected.totalChildren : 0;
  const alreadyCheckedIn   = selected?.checkedInCount ?? 0;
  const remainingCapacity  = Math.max(0, registeredTotal - alreadyCheckedIn);
  const remainingAdults    = selected ? Math.max(0, selected.totalAdults   - selected.checkedInAdults)   : 0;
  const remainingChildren  = selected ? Math.max(0, selected.totalChildren - selected.checkedInChildren) : 0;

  const filtered = allRooms
    .filter((r) => {
      if (filterKey === "pending") return r.checkStatus === "none";
      if (filterKey === "checked") return r.checkStatus !== "none";
      return true;
    })
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return r.roomNumber.toLowerCase().includes(q) || r.guests.some((g) => g.name.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortKey === "room")   return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      if (sortKey === "status") return (a.checkStatus === "none" ? 0 : 1) - (b.checkStatus === "none" ? 0 : 1);
      const nA = (a.guests.find((g) => !g.isChild) ?? a.guests[0])?.name ?? "";
      const nB = (b.guests.find((g) => !g.isChild) ?? b.guests[0])?.name ?? "";
      return nA.localeCompare(nB);
    });

  const filteredActivity = activity.filter((ci) => {
    if (activityFilter === "normal")   return !ci.isDuplicate && !ci.isWalkIn;
    if (activityFilter === "walkin")   return ci.isWalkIn;
    if (activityFilter === "checkout") return !!ci.checkedOutAt;
    return true;
  });

  const showLetterGroups = sortKey === "name" && !searchQuery.trim() && filterKey === "all";
  const showFloorGroups  = sortKey === "room"  && !searchQuery.trim() && filterKey === "all";
  const grouped: { letter: string; rooms: RoomResult[] }[] = [];
  if (showLetterGroups) {
    const map = new Map<string, RoomResult[]>();
    for (const r of filtered) {
      const letter = (r.guests.find((g) => !g.isChild) ?? r.guests[0])?.name?.charAt(0).toUpperCase() || "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(r);
    }
    for (const [l, rooms] of map) grouped.push({ letter: l, rooms });
    grouped.sort((a, b) => a.letter.localeCompare(b.letter));
  } else if (showFloorGroups) {
    const map = new Map<string, RoomResult[]>();
    for (const r of filtered) {
      const floor = `Floor ${Math.floor(parseInt(r.roomNumber) / 100)}`;
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor)!.push(r);
    }
    for (const [f, rooms] of map) grouped.push({ letter: f, rooms });
    grouped.sort((a, b) => parseInt(a.letter.replace("Floor ", "")) - parseInt(b.letter.replace("Floor ", "")));
  }

  const selectRoom = (room: RoomResult) => {
    setSelected(room);
    const remainingAdults   = Math.max(0, room.totalAdults   - room.checkedInAdults);
    const remainingChildren = Math.max(0, room.totalChildren - room.checkedInChildren);
    setAdultCount(remainingAdults === 0 && remainingChildren === 0 ? 1 : remainingAdults);
    setChildCount(remainingAdults === 0 && remainingChildren === 0 ? 0 : remainingChildren);
    setFlash(room.checkStatus === "full" ? { type: "duplicate", text: `Room ${room.roomNumber} already checked in today.` } : null);
    setSuccess(false);
    const mg = room.guests.find((g) => !g.isChild) ?? room.guests[0];
    const savedNote = mg?.notes ?? "";
    setGuestNote(savedNote);
    setGuestNoteOriginal(savedNote);
  };

  const clearSelection = () => {
    setSelected(null); setFlash(null); setSuccess(false);
    setGuestNote(""); setGuestNoteOriginal("");
    searchRef.current?.focus();
  };

  const handleCheckIn = async (override = false) => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: selected.roomId, adultCount, childCount, overrideDuplicate: override }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setFlash({ type: "success", text: `Room ${selected.roomNumber} — ${adultCount + childCount} guest${adultCount + childCount !== 1 ? "s" : ""} checked in` });
        await loadAll();
        setTimeout(() => clearSelection(), 2000);
      } else if (res.status === 409) {
        setFlash({ type: "duplicate", text: data.error });
      } else {
        setFlash({ type: res.status === 400 ? "cap" : "error", text: data.error || "Check-in failed." });
      }
    } catch {
      setFlash({ type: "error", text: "Check-in failed. Please try again." });
    }
    setLoading(false);
  };

  const handleCheckOut = async (id: number) => {
    setCheckingOutId(id);
    try {
      await fetch(`/api/checkins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      await loadAll();
    } catch { }
    setCheckingOutId(null);
  };

  const handleUndoCheckOut = async (id: number) => {
    setCheckingOutId(id);
    try {
      await fetch(`/api/checkins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo_checkout" }),
      });
      await loadAll();
    } catch { }
    setCheckingOutId(null);
  };

  const mainGuest   = selected ? (selected.guests.find((g) => !g.isChild) ?? selected.guests[0]) : null;
  const isDuplicate = flash?.type === "duplicate";

  const handleSaveGuestNote = async () => {
    if (!mainGuest) return;
    setGuestNoteSaving(true);
    try {
      const res = await fetch(`/api/guests/${mainGuest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: guestNote.trim() || null }),
      });
      const data = await res.json();
      if (data.success) {
        setGuestNoteOriginal(guestNote.trim());
        await loadAll();
      }
    } catch { }
    setGuestNoteSaving(false);
  };

  const handleClearGuestNote = async () => {
    if (!mainGuest) return;
    setGuestNoteSaving(true);
    try {
      const res = await fetch(`/api/guests/${mainGuest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: null }),
      });
      const data = await res.json();
      if (data.success) {
        setGuestNote("");
        setGuestNoteOriginal("");
        await loadAll();
      }
    } catch { }
    setGuestNoteSaving(false);
  };

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="Manage guest breakfast access" staff={staff} />

      {walkInModal && selected && (
        <WalkInModal
          roomNumber={selected.roomNumber}
          roomId={selected.roomId}
          onClose={() => setWalkInModal(false)}
          onSuccess={loadAll}
        />
      )}
      {standaloneWalkInModal && (
        <StandaloneWalkInModal
          onClose={() => setStandaloneWalkIn(false)}
          onSuccess={loadAll}
        />
      )}

      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">Check-In</span>
        </div>
      </div>

      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7 py-2.5 flex items-center gap-5 flex-wrap">
        <StatChip label="Rooms in"         value={stats?.totalCheckIns    ?? "–"} color="green" />
        <StatChip label="Currently inside" value={stats?.currentlyInside  ?? "–"} color="blue"  />
        <StatChip label="Walk-ins"         value={stats?.totalWalkIns     ?? "–"} color="amber" />
        <StatChip label="Checked out"      value={stats?.totalCheckedOut  ?? "–"} color="grey"  />
        <StatChip label="Duplicates"       value={stats?.duplicatesBlocked ?? "–"} color="red"  />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-[#9e9e9e]">{allRooms.length} rooms · {allRooms.filter((r) => r.checkStatus === "none").length} pending</span>
          <button
            onClick={() => setStandaloneWalkIn(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fff3e8] border border-[#f0d8b8] text-[#a05c1e] text-xs font-semibold rounded-lg hover:bg-[#ffe8d0] transition-colors"
          >
            <UserPlus size={13} />
            Walk-In
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-160px)]">
        <div className="flex flex-col lg:flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-[#e5e5e0] max-h-[50vh] lg:max-h-none">
          <div className="bg-white border-b border-[#e5e5e0] px-4 py-3 flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room or guest name…"
              className="flex-1 px-3 py-2 bg-[#f5f5f0] border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e]"
            />
            <div className="flex items-center gap-1 bg-[#f5f5f0] rounded-lg p-1">
              {(["name", "room", "status"] as SortKey[]).map((k) => (
                <button key={k} onClick={() => setSortKey(k)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sortKey === k ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"}`}>
                  {k === "name" ? "A→Z" : k === "room" ? "Room #" : "Status"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {(["all", "pending", "checked"] as FilterKey[]).map((k) => (
                <button key={k} onClick={() => setFilterKey(k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterKey === k
                    ? k === "pending" ? "bg-[#fff3e8] text-[#a05c1e] border-[#f5d9b8]"
                    : k === "checked" ? "bg-[#e8efe5] text-[#4a7a3d] border-[#b8d4b0]"
                    : "bg-[#2d2d2d] text-white border-[#2d2d2d]"
                    : "bg-white text-[#9e9e9e] border-[#e5e5e0] hover:border-[#c0c0c0]"}`}>
                  {k === "all" ? `All (${allRooms.length})` : k === "pending" ? `Pending (${allRooms.filter((r) => r.checkStatus === "none").length})` : `Checked (${allRooms.filter((r) => r.checkStatus !== "none").length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-32 text-sm text-[#9e9e9e]">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-[#9e9e9e]">No guests match your filter.</div>
            ) : (showLetterGroups || showFloorGroups) ? (
              grouped.map(({ letter, rooms }) => (
                <div key={letter}>
                  <div className="px-4 py-1.5 bg-[#f5f5f0] border-b border-[#e5e5e0] sticky top-0 z-10">
                    <span className="text-xs font-bold text-[#9e9e9e] tracking-widest">{letter}</span>
                  </div>
                  {rooms.map((room) => <RoomRow key={room.roomId} room={room} selected={selected?.roomId === room.roomId} onClick={() => selectRoom(room)} />)}
                </div>
              ))
            ) : (
              filtered.map((room) => <RoomRow key={room.roomId} room={room} selected={selected?.roomId === room.roomId} onClick={() => selectRoom(room)} />)
            )}
          </div>
        </div>

        <div className="w-full lg:w-90 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-[#e5e5e0]">
          {selected ? (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="px-4 py-3 bg-white border-b border-[#e5e5e0] flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-[#2d2d2d]">Check-In · Room {selected.roomNumber}</p>
                <button onClick={clearSelection} className="text-[#9e9e9e] hover:text-[#2d2d2d]"><X size={16} /></button>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {flash && (
                  <div className={`px-3 py-2.5 rounded-lg text-xs border flex items-start gap-1.5 ${
                    flash.type === "success" ? "bg-[#e8efe5] text-[#3a6a30] border-[#b8d4b0]"
                    : isDuplicate            ? "bg-[#fff3e8] text-[#a05c1e] border-[#f5d9b8]"
                    : "bg-[#fdeeee] text-[#c04040] border-[#f5c0c0]"
                  }`}>
                    {flash.type === "success" ? <Check size={12} className="mt-0.5 shrink-0" /> : <AlertTriangle size={12} className="mt-0.5 shrink-0" />}
                    {flash.text}
                  </div>
                )}

                <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#e8efe5] flex items-center justify-center text-sm font-bold text-[#4a7a3d] shrink-0">
                      {mainGuest?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#2d2d2d] truncate">{mainGuest?.name ?? "-"}</p>
                      <p className="text-xs text-[#9e9e9e]">Room {selected.roomNumber}</p>
                      {mainGuest?.checkInDate && (
                        <p className="text-[11px] text-[#b0b0b0] mt-0.5">
                          {new Date(mainGuest.checkInDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {" – "}
                          {new Date(mainGuest.checkOutDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                    {mainGuest && (
                      <Link href={`/guests/${mainGuest.id}`} className="text-[#9e9e9e] hover:text-[#6b8a5e] shrink-0">
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mainGuest?.hasBreakfast && <span className="inline-flex items-center gap-1 text-[11px] bg-[#e8efe5] text-[#4a7a3d] px-2 py-0.5 rounded-full"><Check size={10} /> Breakfast</span>}
                    {mainGuest?.guestType && mainGuest.guestType !== "HOTEL" && <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{mainGuest.guestType}</span>}
                    {selected.checkStatus !== "none" && <span className="text-[11px] bg-[#fff3e8] text-[#a05c1e] px-2 py-0.5 rounded-full">Already checked in</span>}
                  </div>
                  {selected.guests.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.guests.map((g) => (
                        <span key={g.id} className="flex items-center gap-1 text-[11px] bg-[#f5f5f0] text-[#6b6b6b] px-2 py-0.5 rounded-full">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${g.isChild ? "bg-blue-400" : "bg-[#6b8a5e]"}`} />
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {mainGuest && (
                  <div className="bg-white border border-[#e5e5e0] rounded-xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2d2d2d]">Guest Note</span>
                      {guestNoteOriginal && guestNote === guestNoteOriginal && (
                        <span className="text-[10px] text-[#9e9e9e] italic">Saved</span>
                      )}
                    </div>
                    <textarea
                      value={guestNote}
                      onChange={(e) => setGuestNote(e.target.value)}
                      placeholder="Add a note about this guest…"
                      rows={2}
                      className="w-full px-3 py-2 bg-[#f9f9f6] border border-[#e5e5e0] rounded-lg text-xs text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveGuestNote}
                        disabled={guestNoteSaving || guestNote.trim() === guestNoteOriginal.trim()}
                        className="flex-1 py-1.5 bg-[#6b8a5e] text-white text-xs font-semibold rounded-lg hover:bg-[#5a7a4e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {guestNoteSaving ? "Saving…" : "Save Note"}
                      </button>
                      {guestNoteOriginal && (
                        <button
                          onClick={handleClearGuestNote}
                          disabled={guestNoteSaving}
                          className="px-3 py-1.5 border border-[#e5e5e0] text-[#9e9e9e] text-xs rounded-lg hover:bg-[#f5f5f0] disabled:opacity-40 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#e5e5e0] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-[#6b8a5e]" />
                      <span className="text-xs font-semibold text-[#2d2d2d]">Room Capacity</span>
                    </div>
                    <span className={`text-xs font-bold ${remainingCapacity === 0 ? "text-[#c04040]" : "text-[#4a7a3d]"}`}>
                      {alreadyCheckedIn}/{registeredTotal} checked in
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0eb] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${alreadyCheckedIn >= registeredTotal ? "bg-[#d45f5f]" : "bg-[#6b8a5e]"}`}
                      style={{ width: registeredTotal > 0 ? `${Math.min(100, (alreadyCheckedIn / registeredTotal) * 100)}%` : "0%" }}
                    />
                  </div>
                  <p className={`text-[11px] mt-1.5 ${remainingCapacity === 0 ? "text-[#c04040]" : "text-[#9e9e9e]"}`}>
                    {remainingCapacity === 0
                      ? "All registered guests checked in. Use walk-in for extra guests."
                      : `${remainingCapacity} spot${remainingCapacity !== 1 ? "s" : ""} remaining`}
                  </p>
                </div>

                {(remainingCapacity > 0 || isDuplicate) && (
                  <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
                    <div className="flex items-center justify-around">
                      <Counter label="Adults"   value={adultCount}  onChange={setAdultCount}  max={isDuplicate ? 20 : remainingAdults}   min={0} />
                      <div className="h-10 w-px bg-[#e5e5e0]" />
                      <Counter label="Children" value={childCount}  onChange={setChildCount}  max={isDuplicate ? 20 : remainingChildren} min={0} />
                      <div className="h-10 w-px bg-[#e5e5e0]" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-[#9e9e9e] uppercase tracking-wide">Total</span>
                        <span className="text-2xl font-bold text-[#2d2d2d]">{adultCount + childCount}</span>
                        <span className="text-[10px] text-[#c0c0c0]">{isDuplicate ? "override" : `of ${remainingCapacity} left`}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {(remainingCapacity > 0 || isDuplicate) && (
                    <button
                      onClick={() => handleCheckIn(isDuplicate)}
                      disabled={loading || success || adultCount + childCount === 0}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                        success       ? "bg-[#6b8a5e] text-white opacity-60 cursor-not-allowed"
                        : isDuplicate ? "bg-[#d4893f] text-white hover:bg-[#c07830] disabled:opacity-40"
                        : "bg-[#6b8a5e] text-white hover:bg-[#5a7a4e] disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                    >
                      {loading ? "Checking in…"
                        : success    ? <span className="inline-flex items-center gap-1.5"><Check size={14} /> Checked In</span>
                        : isDuplicate ? "Override & Check-In"
                        : "Check-In"}
                    </button>
                  )}

                  <button
                    onClick={() => setWalkInModal(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border border-[#f0d8b8] text-[#a05c1e] bg-[#fff3e8] hover:bg-[#ffe8d0] transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={14} />
                    Add Walk-In Guest
                  </button>

                  <button onClick={clearSelection} className="w-full py-2 text-xs text-[#9e9e9e] hover:text-[#6b6b6b] transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#e8efe5] flex items-center justify-center">
                <Users size={20} className="text-[#6b8a5e]" />
              </div>
              <p className="text-sm font-medium text-[#6b6b6b]">Select a room</p>
              <p className="text-xs text-[#c0c0c0]">Click any row on the left to check in</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-67.5 shrink-0 flex flex-col">
          <div className="bg-white border-b border-[#e5e5e0] px-4 py-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#2d2d2d]">Today&apos;s Activity</p>
              <span className="text-xs text-[#9e9e9e]">{activity.length}</span>
            </div>
            <div className="flex items-center gap-1">
              {(["all", "normal", "walkin", "checkout"] as const).map((k) => (
                <button key={k} onClick={() => setActivityFilter(k)}
                  className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${activityFilter === k
                    ? k === "walkin"   ? "bg-[#fff3e8] text-[#a05c1e]"
                    : k === "checkout" ? "bg-[#e5eff5] text-[#3d5c7a]"
                    : "bg-[#e8efe5] text-[#4a7a3d]"
                    : "text-[#9e9e9e] hover:text-[#6b6b6b]"}`}>
                  {k === "all" ? "All" : k === "normal" ? "Room" : k === "walkin" ? "Walk-in" : "Out"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredActivity.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs text-[#c0c0c0]">No entries</div>
            ) : (
              filteredActivity.map((ci, i) => (
                <div key={ci.id ?? i} className={`group flex items-center gap-2.5 px-4 py-3 ${i < filteredActivity.length - 1 ? "border-b border-[#f0f0eb]" : ""} ${ci.checkedOutAt ? "opacity-60" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    ci.isWalkIn ? "bg-[#fff3e8] text-[#a05c1e]" : ci.isDuplicate ? "bg-[#fdeeee] text-[#c04040]" : "bg-[#e8efe5] text-[#4a7a3d]"
                  }`}>
                    {ci.roomNumber ?? "WI"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium text-[#2d2d2d] truncate ${ci.checkedOutAt ? "line-through" : ""}`}>
                      {ci.guestName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-[#9e9e9e]">{ci.adultCount}A{ci.childCount > 0 ? ` ${ci.childCount}C` : ""}</span>
                      {ci.isWalkIn    && <span className="text-[10px] bg-[#fff3e8] text-[#a05c1e] px-1.5 py-0.5 rounded-full">walk-in</span>}
                      {ci.isDuplicate && <span className="text-[10px] bg-[#fdeeee] text-[#c04040] px-1.5 py-0.5 rounded-full">dup.</span>}
                      {ci.checkedOutAt && <span className="text-[10px] bg-[#e5eff5] text-[#3d5c7a] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><LogOut size={8} />out</span>}
                    </div>
                    {ci.note && (
                      <p className="text-[11px] text-[#a07820] bg-[#fffbf0] border border-[#f0e0a0] rounded px-1.5 py-0.5 mt-1 truncate">
                        {ci.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-[#c0c0c0]">
                      {new Date(ci.checkedInAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {!ci.checkedOutAt ? (
                      <button
                        onClick={() => handleCheckOut(ci.id)}
                        disabled={checkingOutId === ci.id}
                        title="Check out"
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[10px] text-[#3d5c7a] bg-[#e5eff5] hover:bg-[#d0e5f5] px-1.5 py-0.5 rounded transition-all disabled:opacity-40"
                      >
                        <LogOut size={9} /> Out
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUndoCheckOut(ci.id)}
                        disabled={checkingOutId === ci.id}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-[#9e9e9e] hover:text-[#6b6b6b] px-1 py-0.5 rounded transition-all"
                      >
                        undo
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomRow({ room, selected, onClick }: { room: RoomResult; selected: boolean; onClick: () => void }) {
  const mainGuest = room.guests.find((g) => !g.isChild) ?? room.guests[0];
  const names = room.guests.map((g) => g.name).join(", ");
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#f0f0eb] text-left transition-colors ${selected ? "bg-[#f0f5ee]" : "bg-white hover:bg-[#fafaf8]"}`}
    >
      <div className={`w-12 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 tracking-wide ${
        room.checkStatus === "full" ? "bg-[#e8efe5] text-[#6b8a5e]" : room.checkStatus === "partial" ? "bg-[#fff3e8] text-[#a05c1e]" : "bg-[#f0f0eb] text-[#6b6b6b]"
      }`}>
        {room.roomNumber}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${room.checkStatus === "full" ? "text-[#9e9e9e] line-through" : "text-[#2d2d2d]"}`}>
          Room {room.roomNumber}
          <span className="font-normal text-[#9e9e9e] ml-2 text-xs">{room.totalAdults}A{room.totalChildren > 0 ? ` ${room.totalChildren}C` : ""}</span>
        </p>
        <p className="text-xs text-[#9e9e9e] truncate mt-0.5">{names}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {mainGuest?.hasBreakfast && <Check size={11} className="text-[#4a7a3d]" />}
        {room.checkStatus === "full"    ? <span className="text-[10px] bg-[#e8efe5] text-[#4a7a3d] px-2 py-0.5 rounded-full font-medium">Full</span>
        : room.checkStatus === "partial" ? <span className="text-[10px] bg-[#fff3e8] text-[#a05c1e] px-2 py-0.5 rounded-full font-medium">{room.checkedInCount}/{room.totalAdults + room.totalChildren}</span>
        : <span className="text-[10px] bg-[#f5f5f0] text-[#9e9e9e] px-2 py-0.5 rounded-full font-medium">Pending</span>}
        {selected && <ChevronRight size={14} className="text-[#6b8a5e]" />}
      </div>
    </button>
  );
}

function StatChip({ label, value, color }: { label: string; value: number | string; color: "green" | "blue" | "amber" | "grey" | "red" }) {
  const cls = { green: "bg-[#e8efe5] text-[#4a7a3d]", blue: "bg-[#e5eff5] text-[#3d5c7a]", amber: "bg-[#fff3e8] text-[#a05c1e]", grey: "bg-[#f0f0eb] text-[#6b6b6b]", red: "bg-[#fdeeee] text-[#c04040]" };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls[color]}`}>{value}</span>
      <span className="text-xs text-[#9e9e9e]">{label}</span>
    </div>
  );
}
