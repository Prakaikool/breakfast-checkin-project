"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarDays,
  Repeat2,
  CalendarRange,
  Bell,
  BellOff,
  BellRing,
  Plus,
  Trash2,
  Clock,
  Check,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";

type Recurrence = "TODAY" | "EVERY_DAY" | "WEEKDAYS";
type ReminderStatus = "ACTIVE" | "COMPLETED" | "OVERDUE";

interface Reminder {
  id: number;
  title: string;
  time: string; // HH:MM — the actual fire time stored in DB
  recurrence: Recurrence;
  status: ReminderStatus;
  isOverdue: boolean;
}

const RECURRENCE: Record<Recurrence, { label: string; icon: React.ElementType; short: string }> = {
  TODAY:     { label: "Today only", icon: CalendarDays,  short: "Today"    },
  EVERY_DAY: { label: "Every day",  icon: Repeat2,       short: "Daily"    },
  WEEKDAYS:  { label: "Weekdays",   icon: CalendarRange, short: "Weekdays" },
};

// Notify-before offsets in minutes
const NOTIFY_OFFSETS = [
  { label: "At time",    value: 0  },
  { label: "5 min",      value: 5  },
  { label: "10 min",     value: 10 },
  { label: "15 min",     value: 15 },
  { label: "30 min",     value: 30 },
  { label: "1 hour",     value: 60 },
];

function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m - minutes;
  const safeTotal = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const rh = Math.floor(safeTotal / 60);
  const rm = safeTotal % 60;
  return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}

function formatTimeLabel(time: string): string {
  return time; // already HH:MM
}

export default function RemindersView() {
  const { staff } = useAuth();

  const [title, setTitle]           = useState("");
  const [eventTime, setEventTime]   = useState("09:00");
  const [notifyBefore, setNotifyBefore] = useState(0);
  const [recurrence, setRecurrence] = useState<Recurrence>("TODAY");
  const [saving, setSaving]         = useState(false);
  const [reminders, setReminders]   = useState<Reminder[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeTab, setActiveTab]   = useState<"active" | "completed">("active");
  const [notifPerm, setNotifPerm]   = useState<NotificationPermission>("default");
  const [hasNotifAPI, setHasNotifAPI] = useState(false);
  const notifiedIds = useRef<Set<number>>(new Set());

  // Computed notify-at time
  const notifyAt = subtractMinutes(eventTime, notifyBefore);
  const showOffset = notifyBefore > 0;

  const load = useCallback(async () => {
    const res = await fetch("/api/reminders");
    const data = await res.json();
    if (data.success) setReminders(data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Browser notification permission ──
  useEffect(() => {
    if ("Notification" in window) {
      setHasNotifAPI(true);
      setNotifPerm(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  // ── Poll every 30s and fire browser notifications ──
  useEffect(() => {
    const check = () => {
      if (notifPerm !== "granted") return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hh}:${mm}`;

      reminders.forEach((r) => {
        if (
          r.status !== "COMPLETED" &&
          r.time === currentTime &&
          !notifiedIds.current.has(r.id)
        ) {
          notifiedIds.current.add(r.id);
          new Notification("Breakfast Reminder", {
            body: r.title,
            icon: "/favicon.ico",
          });
        }
      });
    };

    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [reminders, notifPerm]);

  if (!staff) return null;

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), time: notifyAt, recurrence }),
    });
    setTitle("");
    setEventTime("09:00");
    setNotifyBefore(0);
    setRecurrence("TODAY");
    await load();
    setSaving(false);
  };

  const handleToggle = async (r: Reminder) => {
    const newStatus = r.status === "COMPLETED" ? "ACTIVE" : "COMPLETED";
    setReminders((prev) => prev.map((x) => x.id === r.id ? { ...x, status: newStatus as ReminderStatus } : x));
    await fetch(`/api/reminders/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setReminders((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setDeletingId(null);
  };

  // ── derived ──
  const overdueList   = reminders.filter((r) => r.status !== "COMPLETED" && r.isOverdue);
  const activeList    = reminders.filter((r) => r.status !== "COMPLETED" && !r.isOverdue);
  const completedList = reminders.filter((r) => r.status === "COMPLETED");
  const totalToday    = reminders.length;
  const donePct       = totalToday > 0 ? Math.round((completedList.length / totalToday) * 100) : 0;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="Task reminders" staff={staff} />

      {/* Sub-nav */}
      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2.5">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">Reminders</span>
        </div>
      </div>

      <div className="p-4 md:p-7 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

        {/* ── LEFT: Compose ── */}
        <div className="lg:sticky lg:top-6 flex flex-col gap-4">
          <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e5e0] flex items-center gap-2">
              <Plus size={14} className="text-[#6b8a5e]" />
              <p className="text-sm font-semibold text-[#2d2d2d]">New Reminder</p>
            </div>

            <div className="p-5 flex flex-col gap-5">

              {/* Title */}
              <div>
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">Task</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="What do you need to remember?"
                  className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:border-[#6b8a5e] focus:bg-white transition-colors"
                />
              </div>

              {/* Event time */}
              <div>
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">Event time</p>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#fafafa] border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] focus:outline-none focus:border-[#6b8a5e] focus:bg-white transition-colors"
                />
              </div>

              {/* Notify before */}
              <div>
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">Notify me</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {NOTIFY_OFFSETS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNotifyBefore(opt.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                        notifyBefore === opt.value
                          ? "bg-[#e8efe5] text-[#4a7a3d] border-[#b8d4b0]"
                          : "bg-white text-[#6b6b6b] border-[#e5e5e0] hover:border-[#c0c0c0] hover:bg-[#fafafa]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Computed result */}
                <div className={`mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
                  showOffset ? "bg-[#fffbf0] border-[#f0e0a0]" : "bg-[#f0f5ef] border-[#c8dcc0]"
                }`}>
                  <Bell size={13} className={showOffset ? "text-[#a07820]" : "text-[#6b8a5e]"} />
                  <div className="flex-1 min-w-0">
                    {showOffset ? (
                      <>
                        <p className="text-xs font-semibold text-[#a07820]">Notify at {notifyAt}</p>
                        <p className="text-[11px] text-[#c0a060]">{notifyBefore} min before {eventTime}</p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-[#4a7a3d]">Notify at {notifyAt}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">Repeat</p>
                <div className="flex flex-col gap-1.5">
                  {(Object.entries(RECURRENCE) as [Recurrence, typeof RECURRENCE[Recurrence]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const active = recurrence === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setRecurrence(key)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${
                          active
                            ? "bg-[#e8efe5] text-[#4a7a3d] border-[#b8d4b0]"
                            : "bg-white text-[#6b6b6b] border-[#e5e5e0] hover:border-[#c0c0c0] hover:bg-[#fafafa]"
                        }`}
                      >
                        <Icon size={13} className={active ? "text-[#4a7a3d]" : "text-[#9e9e9e]"} />
                        {cfg.label}
                        {active && <Check size={12} className="ml-auto text-[#6b8a5e]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={saving || !title.trim()}
                className="w-full py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                {saving ? "Adding…" : "Add Reminder"}
              </button>
            </div>
          </div>

          {/* Notification permission banner */}
          {hasNotifAPI && notifPerm !== "granted" && (
            <button
              onClick={requestNotifPermission}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                notifPerm === "denied"
                  ? "bg-[#fdeeee] border-[#f0c0c0]"
                  : "bg-[#fffbf0] border-[#f0e0a0] hover:bg-[#fff7e0]"
              }`}
            >
              <BellRing size={16} className={notifPerm === "denied" ? "text-[#c04040]" : "text-[#a07820]"} />
              <div>
                <p className={`text-xs font-semibold ${notifPerm === "denied" ? "text-[#c04040]" : "text-[#a07820]"}`}>
                  {notifPerm === "denied" ? "Notifications blocked" : "Enable notifications"}
                </p>
                <p className="text-[11px] text-[#b0a070]">
                  {notifPerm === "denied"
                    ? "Allow in browser settings to receive alerts."
                    : "Click to allow browser notifications."}
                </p>
              </div>
            </button>
          )}

          {hasNotifAPI && notifPerm === "granted" && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#e8efe5] border border-[#c8dcc0] rounded-xl">
              <Bell size={13} className="text-[#4a7a3d]" />
              <p className="text-xs font-medium text-[#4a7a3d]">Browser notifications active</p>
            </div>
          )}

          {/* Progress card */}
          {totalToday > 0 && (
            <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider">Today&apos;s Progress</p>
                <span className="text-sm font-bold text-[#2d2d2d]">{completedList.length}/{totalToday}</span>
              </div>
              <div className="h-2 bg-[#f0f0eb] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6b8a5e] rounded-full transition-all duration-500"
                  style={{ width: `${donePct}%` }}
                />
              </div>
              <p className="text-xs text-[#9e9e9e] mt-2">{donePct}% complete</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: List ── */}
        <div className="flex flex-col gap-4">

          {/* Stats + tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            {overdueList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#fdeeee] text-[#c04040] text-xs font-semibold px-3 py-1.5 rounded-full">
                <AlertTriangle size={11} />
                {overdueList.length} Overdue
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#e8efe5] text-[#4a7a3d] text-xs font-semibold px-3 py-1.5 rounded-full">
              <Bell size={11} />
              {activeList.length} Active
            </div>
            <div className="flex items-center gap-1.5 bg-[#f0f0eb] text-[#9e9e9e] text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 size={11} />
              {completedList.length} Done
            </div>

            <div className="ml-auto flex items-center gap-1 bg-[#f0f0eb] rounded-lg p-1">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "active" ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "completed" ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Active tab */}
          {activeTab === "active" && (
            <>
              {overdueList.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <AlertTriangle size={12} className="text-[#c04040]" />
                    <span className="text-[11px] font-bold text-[#c04040] uppercase tracking-wider">Overdue</span>
                    <div className="flex-1 h-px bg-[#f5c0c0]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {overdueList.map((r) => (
                      <ReminderCard key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} deleting={deletingId === r.id} />
                    ))}
                  </div>
                </div>
              )}

              {activeList.length > 0 && (
                <div>
                  {overdueList.length > 0 && (
                    <div className="flex items-center gap-2 px-1 mb-2 mt-2">
                      <Clock size={12} className="text-[#9e9e9e]" />
                      <span className="text-[11px] font-bold text-[#9e9e9e] uppercase tracking-wider">Upcoming</span>
                      <div className="flex-1 h-px bg-[#e5e5e0]" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {activeList.map((r) => (
                      <ReminderCard key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} deleting={deletingId === r.id} />
                    ))}
                  </div>
                </div>
              )}

              {overdueList.length === 0 && activeList.length === 0 && (
                <EmptyState icon={BellOff} title="No active reminders" sub="Add one using the form on the left." />
              )}
            </>
          )}

          {/* Completed tab */}
          {activeTab === "completed" && (
            completedList.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Nothing completed yet" sub="Check off reminders as you finish them." />
            ) : (
              <div className="flex flex-col gap-2">
                {completedList.map((r) => (
                  <ReminderCard key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} deleting={deletingId === r.id} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-xl py-16 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-[#f0f0eb] flex items-center justify-center">
        <Icon size={22} className="text-[#c0c0c0]" />
      </div>
      <p className="text-sm font-medium text-[#9e9e9e]">{title}</p>
      <p className="text-xs text-[#c0c0c0]">{sub}</p>
    </div>
  );
}

// ── Reminder card ────────────────────────────────────────────
function ReminderCard({
  reminder: r,
  onToggle,
  onDelete,
  deleting,
}: {
  reminder: Reminder;
  onToggle: (r: Reminder) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const isCompleted = r.status === "COMPLETED";
  const isOverdue   = r.isOverdue && !isCompleted;
  const RecurIcon   = RECURRENCE[r.recurrence].icon;

  return (
    <div className={`group bg-white border rounded-xl overflow-hidden transition-all ${
      deleting    ? "opacity-30"               :
      isOverdue   ? "border-[#f0c0c0]"        :
      isCompleted ? "border-[#e5e5e0] opacity-60" :
                    "border-[#e5e5e0]"
    }`}>
      <div className="flex items-center">
        {/* Accent bar */}
        <div className={`w-1 self-stretch shrink-0 ${
          isOverdue ? "bg-[#d45f5f]" : isCompleted ? "bg-[#c8dcc0]" : "bg-[#6b8a5e]"
        }`} />

        <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
          {/* Checkbox */}
          <button
            onClick={() => onToggle(r)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              isCompleted ? "bg-[#6b8a5e] border-[#6b8a5e]" :
              isOverdue   ? "border-[#d45f5f] hover:bg-[#fdeeee]" :
                            "border-[#c8c8c8] hover:border-[#6b8a5e]"
            }`}
          >
            {isCompleted && <Check size={10} strokeWidth={3} className="text-white" />}
          </button>

          {/* Notify time badge */}
          <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
            isOverdue   ? "bg-[#fdeeee] text-[#c04040] border-[#f5c0c0]" :
            isCompleted ? "bg-[#f0f0eb] text-[#b0b0b0] border-[#e5e5e0]" :
                          "bg-[#f0f5ef] text-[#4a7a3d] border-[#c8dcc0]"
          }`}>
            <Timer size={10} />
            {r.time}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${
              isCompleted ? "line-through text-[#b0b0b0]" : "text-[#2d2d2d]"
            }`}>
              {r.title}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <RecurIcon size={10} className="text-[#b0b0b0]" />
              <span className="text-[11px] text-[#b0b0b0]">{RECURRENCE[r.recurrence].short}</span>
              {isOverdue && (
                <span className="text-[11px] text-[#c04040] font-medium ml-1">· Overdue</span>
              )}
            </div>
          </div>

          {/* Status + delete */}
          <div className="shrink-0 flex items-center gap-2">
            {isCompleted && (
              <span className="text-[11px] bg-[#e8efe5] text-[#4a7a3d] px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                <CheckCircle2 size={10} /> Done
              </span>
            )}
            {isOverdue && (
              <span className="text-[11px] bg-[#fdeeee] text-[#c04040] px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                <AlertTriangle size={10} /> Overdue
              </span>
            )}

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {confirm ? (
                <>
                  <span className="text-[11px] text-[#9e9e9e]">Delete?</span>
                  <button onClick={() => onDelete(r.id)} className="px-2 py-1 rounded-md text-[11px] font-semibold text-white bg-[#d45f5f] hover:bg-[#c04040] transition-colors">Yes</button>
                  <button onClick={() => setConfirm(false)} className="px-2 py-1 rounded-md text-[11px] font-medium text-[#9e9e9e] hover:bg-[#f0f0eb] transition-colors">No</button>
                </>
              ) : (
                <button onClick={() => setConfirm(true)} className="p-1.5 rounded-md text-[#c0c0c0] hover:text-[#d45f5f] hover:bg-[#fdeeee] transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
