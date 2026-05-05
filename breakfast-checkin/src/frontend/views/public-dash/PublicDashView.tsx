"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  Monitor,
  TrendingUp,
  Users,
  DoorOpen,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Sliders,
  X,
} from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import { usePolling } from "@/frontend/hooks/usePolling";
import type { DashboardStats } from "@/types";

interface PublicStatus {
  level: "LOW" | "MODERATE" | "BUSY" | "VERY_BUSY";
  message: string;
  isManualOverride: boolean;
  manualOverride: { level: string; updatedBy: string; updatedAt: string | null } | null;
  trend: { time: string; people: number }[];
  serviceHours: { start: string; end: string };
  announcement: { text: string; updatedBy: string; updatedAt: string | null; isVisible: boolean };
}

type Level = "LOW" | "MODERATE" | "BUSY" | "VERY_BUSY";

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; dot: string; label: string }> = {
  LOW:       { color: "text-[#4a7a3d]", bg: "bg-[#e8efe5]", border: "border-[#b8d9b0]", dot: "bg-[#6b8a5e]", label: "Low Traffic"  },
  MODERATE:  { color: "text-[#9c5a1a]", bg: "bg-[#fff3e8]", border: "border-[#f0c080]", dot: "bg-[#c07820]", label: "Moderate"     },
  BUSY:      { color: "text-[#b03030]", bg: "bg-[#fdeeee]", border: "border-[#f0b0b0]", dot: "bg-[#c03030]", label: "Busy"         },
  VERY_BUSY: { color: "text-[#7a1010]", bg: "bg-[#fde8e8]", border: "border-[#e09090]", dot: "bg-[#a02020]", label: "Very Busy"    },
};

const MAX_CHARS = 300;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-[#2d2d2d]",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-[#f0f5ef] flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#6b8a5e]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#9e9e9e] font-medium">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-[11px] text-[#c0c0c0] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function PublicDashView() {
  const { staff } = useAuth();
  const { data, refetch } = usePolling<PublicStatus>("/api/dashboard/public");
  const { data: stats } = usePolling<DashboardStats>("/api/dashboard/stats");

  const [draft, setDraft]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);
  const [crowdSaving, setCrowdSaving] = useState(false);
  const [crowdMsg, setCrowdMsg]     = useState<string | null>(null);

  useEffect(() => {
    if (data?.announcement?.text && !draft) setDraft(data.announcement.text);
  }, [data?.announcement?.text]);

  const handleSetCrowd = async (level: Level) => {
    setCrowdSaving(true); setCrowdMsg(null);
    try {
      const res = await fetch("/api/display/crowd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      setCrowdMsg(res.ok ? "Override set!" : "Error.");
    } catch { setCrowdMsg("Error."); }
    setCrowdSaving(false);
    setTimeout(() => setCrowdMsg(null), 3000);
  };

  const handleClearCrowd = async () => {
    setCrowdSaving(true); setCrowdMsg(null);
    try {
      await fetch("/api/display/crowd", { method: "DELETE" });
      setCrowdMsg("Override cleared.");
    } catch { setCrowdMsg("Error."); }
    setCrowdSaving(false);
    setTimeout(() => setCrowdMsg(null), 3000);
  };

  if (!staff) return null;

  const level = data?.level ?? "LOW";
  const cfg = LEVEL_CONFIG[level];
  const trend = data?.trend ?? [];
  const serviceHours = data?.serviceHours ?? { start: "07:00", end: "10:30" };
  const current = data?.announcement;
  const maxPeople = Math.max(...trend.map((s) => s.people), 1);
  const totalToday = trend.reduce((s, t) => s + t.people, 0);
  const peakSlot = trend.reduce((best, s) => (s.people > best.people ? s : best), trend[0] ?? { time: "-", people: 0 });

  async function apiCall(fetchFn: () => Promise<Response>, onOk: () => void) {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await fetchFn();
      if (res.ok) {
        onOk();
        refetch();
      } else {
        const json = await res.json().catch(() => ({}));
        setSaveMsg(json.error ?? `Error (${res.status})`);
      }
    } catch {
      setSaveMsg("Network error.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  }

  function saveAnnouncement() {
    return apiCall(
      () => fetch("/api/display/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: draft }) }),
      () => setSaveMsg("Published!")
    );
  }

  function hideAnnouncement() {
    return apiCall(
      () => fetch("/api/display/announcement", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isVisible: false }) }),
      () => setSaveMsg("Hidden from display.")
    );
  }

  function showAnnouncement() {
    return apiCall(
      () => fetch("/api/display/announcement", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isVisible: true }) }),
      () => setSaveMsg("Now showing on display.")
    );
  }

  function deleteAnnouncement() {
    return apiCall(
      () => fetch("/api/display/announcement", { method: "DELETE" }),
      () => { setDraft(""); setSaveMsg("Deleted."); }
    );
  }

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar
        title="Breakfast Check-In"
        subtitle="Display screen management"
        staff={staff}
      />

      {/* Sub-nav */}
      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7 flex items-center justify-between">
        <div className="py-2.5">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Public Display
          </span>
        </div>
        <a
          href="/display"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6b8a5e] hover:text-[#4a7a3d] transition-colors pb-1"
        >
          <Monitor size={13} />
          Open Display Screen
          <ExternalLink size={11} />
        </a>
      </div>

      <div className="p-4 md:p-7 flex flex-col gap-6">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DoorOpen}
            label="Rooms Checked In"
            value={stats?.totalCheckIns ?? "-"}
            sub="unique rooms today"
          />
          <StatCard
            icon={Users}
            label="People Today"
            value={stats?.totalPeopleInside ?? totalToday}
            sub="adults + children"
          />
          <StatCard
            icon={TrendingUp}
            label="Peak Hour"
            value={peakSlot.people > 0 ? peakSlot.time : "-"}
            sub={peakSlot.people > 0 ? `${peakSlot.people} people` : "no data yet"}
          />
          <div className={`rounded-xl px-5 py-4 flex items-center gap-4 border ${cfg.border} ${cfg.bg}`}>
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <span className={`absolute w-3 h-3 rounded-full ${cfg.dot} animate-ping opacity-60`} />
              <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
            </div>
            <div>
              <p className="text-xs text-[#9e9e9e] font-medium">
                Current Level {data?.isManualOverride && <span className="text-[#a07820] ml-1 font-semibold">· Manual</span>}
              </p>
              <p className={`text-xl font-bold leading-tight ${cfg.color}`}>{cfg.label}</p>
              <p className="text-[11px] text-[#c0c0c0] mt-0.5">{data?.message ?? "Checking..."}</p>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">

          {/* LEFT */}
          <div className="flex flex-col gap-5">

            {/* Announcement editor */}
            <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e5e5e0] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#fff3e8] flex items-center justify-center">
                  <Megaphone size={15} className="text-[#a07820]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2d2d2d]">Guest Announcement</p>
                  <p className="text-xs text-[#9e9e9e]">Shown on the restaurant display screen</p>
                </div>
                {current?.text && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${current.isVisible ? "bg-[#e8efe5]" : "bg-[#f0f0eb]"}`}>
                    <Wifi size={10} className={current.isVisible ? "text-[#4a7a3d]" : "text-[#9e9e9e]"} />
                    <span className={`text-[10px] font-bold tracking-wide ${current.isVisible ? "text-[#4a7a3d]" : "text-[#9e9e9e]"}`}>
                      {current.isVisible ? "LIVE" : "HIDDEN"}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                    placeholder={`e.g. Good morning! Today is Valentine's Day. We have heart cake - enjoy your breakfast!`}
                    rows={4}
                    className="w-full border border-[#e5e5e0] rounded-lg px-4 py-3 text-sm text-[#2d2d2d] placeholder-[#c8c8c8] resize-none focus:outline-none focus:border-[#6b8a5e] transition-colors"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-32 bg-[#e5e5e0] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${draft.length >= MAX_CHARS ? "bg-[#d45f5f]" : draft.length > MAX_CHARS * 0.8 ? "bg-[#c07820]" : "bg-[#6b8a5e]"}`}
                          style={{ width: `${(draft.length / MAX_CHARS) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${draft.length >= MAX_CHARS ? "text-[#d45f5f]" : "text-[#9e9e9e]"}`}>
                        {draft.length}/{MAX_CHARS}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {saveMsg && (
                        <span className={`text-xs font-semibold flex items-center gap-1 ${saveMsg.startsWith("Error") ? "text-[#d45f5f]" : "text-[#6b8a5e]"}`}>
                          {saveMsg.startsWith("Error") ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                          {saveMsg}
                        </span>
                      )}
                      {current?.text && current.isVisible && (
                        <button
                          onClick={hideAnnouncement}
                          disabled={saving}
                          className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] border border-[#e5e5e0] rounded-lg hover:border-[#c07820] hover:text-[#c07820] disabled:opacity-40 transition-colors"
                        >
                          Don&apos;t show
                        </button>
                      )}
                      {current?.text && !current.isVisible && (
                        <button
                          onClick={showAnnouncement}
                          disabled={saving}
                          className="px-3 py-1.5 text-xs font-semibold text-[#6b8a5e] border border-[#b8d9b0] rounded-lg hover:bg-[#e8efe5] disabled:opacity-40 transition-colors"
                        >
                          Show again
                        </button>
                      )}
                      {current?.text && (
                        <button
                          onClick={deleteAnnouncement}
                          disabled={saving}
                          className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] border border-[#e5e5e0] rounded-lg hover:border-[#d45f5f] hover:text-[#d45f5f] disabled:opacity-40 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={saveAnnouncement}
                        disabled={saving || draft.trim().length === 0}
                        className="px-4 py-1.5 bg-[#6b8a5e] text-white text-xs font-semibold rounded-lg hover:bg-[#5a7a4e] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                      >
                        {saving ? "Publishing…" : <>Publish <ExternalLink size={11} /></>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live preview */}
                {draft.trim() && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">Display preview</p>
                    <div className="bg-[#fffbf0] border border-[#f0e0a0] rounded-xl px-5 py-4 flex items-start gap-3">
                      <Megaphone size={16} className="text-[#a07820] shrink-0 mt-0.5" />
                      <p className="text-sm text-[#5a4a20] leading-relaxed">{draft}</p>
                    </div>
                  </div>
                )}

                {/* Current announcement status */}
                {current?.text && (
                  <div className={`rounded-lg px-4 py-3 flex items-start gap-3 border ${current.isVisible ? "bg-[#fffbf0] border-[#f0e0a0]" : "bg-[#f5f5f0] border-[#e5e5e0]"}`}>
                    <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${current.isVisible ? "text-[#a07820]" : "text-[#9e9e9e]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#9e9e9e] mb-1">
                        {current.isVisible ? "Currently showing on display" : "Hidden — not showing on display"}
                      </p>
                      <p className={`text-sm leading-relaxed ${current.isVisible ? "text-[#5a4a20]" : "text-[#9e9e9e]"}`}>{current.text}</p>
                      {current.updatedBy && (
                        <p className="text-[10px] text-[#c0c0c0] mt-1.5">
                          Set by {current.updatedBy}
                          {current.updatedAt
                            ? ` at ${new Date(current.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Crowd trend */}
            <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-[#2d2d2d]">Crowd Trend</p>
                  <p className="text-xs text-[#9e9e9e] mt-0.5">
                    Breakfast service {serviceHours.start} - {serviceHours.end}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9e9e9e]">Total today</p>
                  <p className="text-lg font-bold text-[#2d2d2d]">{totalToday}</p>
                </div>
              </div>

              {trend.length > 0 && totalToday > 0 ? (
                <div className="flex gap-3 items-end">
                  {trend.map((slot) => {
                    const heightPct = Math.max((slot.people / maxPeople) * 100, slot.people > 0 ? 12 : 4);
                    const isPeak = slot.people === maxPeople && slot.people > 0;
                    return (
                      <div key={slot.time} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className={`text-[11px] font-semibold ${isPeak ? "text-[#4a7a3d]" : "text-[#9e9e9e]"}`}>
                          {slot.people > 0 ? slot.people : ""}
                        </span>
                        <div className="w-full flex items-end" style={{ height: 72 }}>
                          <div
                            className={`w-full rounded-md transition-all ${isPeak ? "bg-[#6b8a5e]" : slot.people > 0 ? "bg-[#b8d9b0]" : "bg-[#ebebeb]"}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#9e9e9e] font-medium">{slot.time}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-24 flex flex-col items-center justify-center gap-2 text-[#c0c0c0]">
                  <Clock size={20} className="text-[#d5d5d0]" />
                  <span className="text-xs">No check-ins recorded yet today</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">

            {/* Display screen card */}
            <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e5e5e0] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f0f5ef] flex items-center justify-center">
                  <Monitor size={15} className="text-[#6b8a5e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2d2d2d]">Display Screen</p>
                  <p className="text-xs text-[#9e9e9e]">Restaurant TV / large monitor</p>
                </div>
              </div>

              {/* Screen preview mockup */}
              <div className="px-5 pt-4 pb-2">
                <div className={`rounded-xl overflow-hidden border-2 ${cfg.border} ${cfg.bg}`}>
                  <div className="px-4 py-4 flex flex-col gap-2.5">
                    {/* header bar */}
                    <div className="flex items-center justify-between">
                      <div className="h-1.5 w-14 bg-[#e5e5e0] rounded-full" />
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <div className="h-1.5 w-8 bg-[#e5e5e0] rounded-full" />
                      </div>
                    </div>
                    {/* crowd level */}
                    <div className="text-center py-1.5">
                      <div className={`text-2xl font-black ${cfg.color}`}>
                        {cfg.label.toUpperCase()}
                      </div>
                      <div className={`text-[9px] mt-1 truncate px-2 ${cfg.color} opacity-70`}>{data?.message ?? ""}</div>
                    </div>
                    {/* announcement */}
                    {current?.text && current.isVisible && (
                      <div className="bg-white border border-[#e5e5e0] rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                        <Megaphone size={8} className="text-[#a07820] shrink-0 mt-0.5" />
                        <p className="text-[8px] text-[#5a4a20] leading-tight line-clamp-2">{current.text}</p>
                      </div>
                    )}
                    {/* mini trend bars */}
                    <div className="flex justify-center gap-1 pt-0.5">
                      {trend.map((s) => {
                        const h = Math.max((s.people / maxPeople) * 16, s.people > 0 ? 4 : 2);
                        return (
                          <div
                            key={s.time}
                            className={`flex-1 rounded-sm ${s.people > 0 ? cfg.dot : "bg-[#e5e5e0]"}`}
                            style={{ height: h }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* monitor stand */}
                <div className="flex flex-col items-center mt-1 mb-1.5">
                  <div className="h-2 w-6 bg-[#e5e5e0]" />
                  <div className="h-1 w-12 bg-[#d5d5d0] rounded-sm" />
                </div>
              </div>

              <div className="px-5 pb-5">
                <a
                  href="/display"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] transition-colors"
                >
                  <Monitor size={14} />
                  Open Display Screen
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Manual crowd override */}
            <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e5e5e0] flex items-center gap-2">
                <Sliders size={14} className="text-[#6b8a5e]" />
                <p className="text-sm font-semibold text-[#2d2d2d] flex-1">Manual Crowd Level</p>
                {data?.isManualOverride && (
                  <button
                    onClick={handleClearCrowd}
                    disabled={crowdSaving}
                    className="flex items-center gap-1 text-[11px] text-[#9e9e9e] hover:text-[#d45f5f] transition-colors"
                  >
                    <X size={11} /> Clear override
                  </button>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3">
                <p className="text-xs text-[#9e9e9e]">
                  Override the automatic level when the restaurant feels different from what the data shows.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["LOW", "MODERATE", "BUSY", "VERY_BUSY"] as Level[]).map((lvl) => {
                    const c = LEVEL_CONFIG[lvl];
                    const isActive = data?.isManualOverride && data.level === lvl;
                    return (
                      <button
                        key={lvl}
                        onClick={() => handleSetCrowd(lvl)}
                        disabled={crowdSaving}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                          isActive ? `${c.bg} ${c.color} ${c.border} ring-2 ring-offset-1 ring-current` : `${c.bg} ${c.color} ${c.border} hover:opacity-80`
                        } disabled:opacity-40`}
                      >
                        {c.label}
                        {isActive && " ✓"}
                      </button>
                    );
                  })}
                </div>
                {crowdMsg && (
                  <p className={`text-xs font-semibold ${crowdMsg.startsWith("Error") ? "text-[#d45f5f]" : "text-[#6b8a5e]"}`}>{crowdMsg}</p>
                )}
                {data?.isManualOverride && data.manualOverride && (
                  <p className="text-[11px] text-[#c0c0c0]">
                    Set by {data.manualOverride.updatedBy}
                    {data.manualOverride.updatedAt ? ` at ${new Date(data.manualOverride.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Service hours */}
            <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#9e9e9e] uppercase tracking-wider mb-3">Service Hours</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#6b8a5e]" />
                  <span className="text-sm text-[#6b6b6b]">Breakfast</span>
                </div>
                <span className="text-sm font-bold text-[#2d2d2d]">
                  {serviceHours.start} – {serviceHours.end}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-[#f0f5ef] border border-[#c8dfc2] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#4a7a3d] mb-3">Setup tips</p>
              <ul className="text-xs text-[#6b8a5e] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#b8d9b0] mt-0.5">·</span>
                  Press <kbd className="bg-white border border-[#c8dfc2] rounded px-1 font-mono text-[10px]">F11</kbd> for full-screen in the browser
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b8d9b0] mt-0.5">·</span>
                  Screen auto-refreshes every 30 seconds
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b8d9b0] mt-0.5">·</span>
                  Announcements persist across server restarts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b8d9b0] mt-0.5">·</span>
                  Keep messages under 300 characters for best readability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
