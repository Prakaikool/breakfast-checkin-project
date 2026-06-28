"use client";

import Link from "next/link";
import {
  CheckCircle,
  LayoutDashboard,
  Star,
  PenLine,
  UtensilsCrossed,
  Clock,
  ChevronRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import { usePolling } from "@/frontend/hooks/usePolling";
import type { DashboardStats, ActivityLevel, CheckInRecord } from "@/types";

const statCards = [
  { key: "checkIns", label: "Check-ins Today", iconBg: "bg-[#e8efe5]" },
  { key: "guests", label: "Guests Inside", iconBg: "bg-[#e5eff3]" },
  { key: "activity", label: "Activity Level", iconBg: "bg-[#fff3e8]" },
  { key: "duplicates", label: "Duplicates Blocked", iconBg: "bg-[#fdeeee]" },
];

const actionCards: {
  label: string;
  description: string;
  href: string;
  iconBg: string;
  iconText: string;
  icon: LucideIcon;
}[] = [
  {
    label: "Check-in",
    description: "Check in guests",
    href: "/checkin",
    iconBg: "bg-[#e8efe5]",
    iconText: "text-[#4a7a3d]",
    icon: CheckCircle,
  },
  {
    label: "Dashboard",
    description: "Real-time overview",
    href: "/dashboard",
    iconBg: "bg-[#e5eff3]",
    iconText: "text-[#3d6a7a]",
    icon: LayoutDashboard,
  },
  {
    label: "Members",
    description: "Spa & VIP members",
    href: "/members",
    iconBg: "bg-[#fff3e8]",
    iconText: "text-[#a05c1e]",
    icon: Star,
  },
  {
    label: "Daily Log",
    description: "Today's log entries",
    href: "/daily-log",
    iconBg: "bg-[#e8efe5]",
    iconText: "text-[#4a7a3d]",
    icon: PenLine,
  },
  {
    label: "Kitchen",
    description: "Menu availability",
    href: "/kitchen",
    iconBg: "bg-[#e5eff3]",
    iconText: "text-[#3d6a7a]",
    icon: UtensilsCrossed,
  },
  {
    label: "Reminders",
    description: "Task reminders",
    href: "/reminders",
    iconBg: "bg-[#fff3e8]",
    iconText: "text-[#a05c1e]",
    icon: Clock,
  },
];

export default function HomeView() {
  const { staff } = useAuth();
  const { data: stats } = usePolling<DashboardStats>("/api/dashboard/stats");
  const { data: activity } = usePolling<ActivityLevel>("/api/dashboard/activity");
  const { data: checkInsData } = usePolling<{ checkIns: CheckInRecord[]; total: number }>(
    "/api/checkins"
  );

  if (!staff) return null;

  const firstName = staff.name.split(" ")[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
    "Good evening";
  const recentActivity = (checkInsData?.checkIns ?? []).slice(0, 3);

  const activityLabel =
    activity?.level === "BUSY"
      ? "Busy"
      : activity?.level === "MODERATE"
        ? "Moderate"
        : activity?.level === "LOW"
          ? "Low"
          : "–";

  const statValues = [
    stats?.totalCheckIns ?? "–",
    stats?.totalPeopleInside ?? "–",
    activityLabel,
    stats?.duplicatesBlocked ?? "–",
  ];

  const housekeepingReady = recentActivity.filter((ci) => !ci.isDuplicate);

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar
        title="Breakfast Check-In"
        subtitle="Welcome - breakfast overview"
        staff={staff}
      />

      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2 flex items-center">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Home
          </span>
        </div>
      </div>

      <div className="p-4 md:p-7">
        <h2 className="text-lg font-semibold text-[#2d2d2d]">
          {greeting}, {firstName}!
        </h2>
        <p className="text-sm text-[#6b6b6b] mt-1 mb-6">
          Here&apos;s your breakfast overview for today.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map((card, i) => (
            <div
              key={card.key}
              className="bg-white border border-[#e5e5e0] rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className={`${card.iconBg} rounded-[10px] w-9 h-9 shrink-0`} />
                <p className="text-xs text-[#6b6b6b]">{card.label}</p>
              </div>
              <p className="text-2xl font-bold text-[#2d2d2d] mt-1">
                {statValues[i]}
              </p>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-[#2d2d2d] mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
          {actionCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white border border-[#e5e5e0] rounded-xl px-4 py-3 flex items-center gap-4 hover:bg-[#fafaf8] hover:border-[#d0d0d0] transition-colors"
            >
              <div className={`${card.iconBg} rounded-xl w-12 h-12 shrink-0 flex items-center justify-center ${card.iconText}`}>
                <card.icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2d2d2d]">{card.label}</p>
                <p className="text-xs text-[#9e9e9e] mt-0.5">{card.description}</p>
              </div>
              <ChevronRight size={16} className="text-[#c0c0c0] shrink-0" />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#2d2d2d] mb-3">
              Recent Activity
            </h3>
            {recentActivity.length > 0 ? (
              <div>
                {recentActivity.map((ci, i) => (
                  <div key={ci.id}>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm font-medium text-[#2d2d2d]">
                        Room {ci.roomNumber}
                        {ci.guestName ? ` - ${ci.guestName}` : ""}
                      </p>
                      <span className="text-xs text-[#9e9e9e]">
                        {new Date(ci.checkedInAt).toLocaleTimeString("sv-SE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {i < recentActivity.length - 1 && (
                      <div className="h-px bg-[#e5e5e0]" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9e9e9e] py-2">No activity yet today.</p>
            )}
          </div>

          <div className="bg-white border border-[#e5e5e0] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#2d2d2d] mb-3">
              Housekeeping Ready
            </h3>
            {housekeepingReady.length > 0 ? (
              <div className="space-y-2">
                {housekeepingReady.map((ci) => (
                  <div key={ci.id} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#e8efe5] flex items-center justify-center text-[#4a7a3d] shrink-0"><Check size={11} /></span>
                    <p className="text-sm text-[#2d2d2d]">Room {ci.roomNumber}{ci.guestName ? ` · ${ci.guestName}` : ""}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9e9e9e]">No rooms have checked out yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
