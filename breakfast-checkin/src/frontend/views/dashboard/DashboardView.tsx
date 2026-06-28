"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import { usePolling } from "@/frontend/hooks/usePolling";
import type { DashboardStats, ActivityLevel } from "@/types";

interface TimelineSlot {
  time: string;
  count: number;
  people: number;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-[#2d2d2d] mb-0.5">{label}</p>
      <p className="text-[#6b8a5e]">{payload[0].value} guests</p>
    </div>
  );
}

export default function DashboardView() {
  const { staff } = useAuth();
  const { data: stats } = usePolling<DashboardStats>("/api/dashboard/stats");
  const { data: activity } = usePolling<ActivityLevel>("/api/dashboard/activity");
  const { data: timelineData } = usePolling<{ timeline: TimelineSlot[] }>(
    "/api/dashboard/timeline"
  );

  if (!staff) return null;

  const timeline = timelineData?.timeline ?? [];
  const maxPeople = Math.max(...timeline.map((s) => s.people), 1);

  const activityColor =
    activity?.level === "BUSY"
      ? "text-[#c04040]"
      : activity?.level === "MODERATE"
        ? "text-amber-600"
        : "text-[#4a7a3d]";

  const activityDot =
    activity?.level === "BUSY"
      ? "bg-[#c04040]"
      : activity?.level === "MODERATE"
        ? "bg-amber-500"
        : "bg-[#4a7a3d]";

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar
        title="Breakfast Check-In"
        subtitle="Real-time operational overview"
        staff={staff}
      />

      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Dashboard
          </span>
        </div>
      </div>

      <div className="p-4 md:p-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total check-ins" value={stats?.totalCheckIns ?? "–"} />
          <StatCard label="People inside" value={stats?.totalPeopleInside ?? "–"} />
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
            <p className="text-sm text-[#6b6b6b]">Activity level</p>
            <p className={`text-3xl font-bold mt-1 ${activityColor}`}>
              {activity?.level ?? "–"}
            </p>
          </div>
          <StatCard label="Duplicates blocked" value={stats?.duplicatesBlocked ?? "–"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#2d2d2d]">Check-ins over time</h3>
              {timeline.length > 0 && (
                <span className="text-xs text-[#9e9e9e]">
                  {timeline.reduce((s, t) => s + t.count, 0)} check-ins today
                </span>
              )}
            </div>

            {timeline.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-[#c0c0c0]">
                No check-ins yet today
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart
                  data={timeline}
                  margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                  barCategoryGap="20%"
                >
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#9e9e9e" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#9e9e9e" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f5f5f0" }} />
                  <Bar dataKey="people" radius={[3, 3, 0, 0]}>
                    {timeline.map((slot) => (
                      <Cell
                        key={slot.time}
                        fill={
                          slot.people === maxPeople && slot.people > 0
                            ? "#6b8a5e"
                            : "#c8dcc0"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#2d2d2d] mb-4">Kitchen status preview</h3>

            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${activityDot}`} />
              <span className="text-sm text-[#2d2d2d]">
                {activity?.description ?? "Loading…"}
              </span>
            </div>

            <div className="space-y-2 mt-4">
              {timeline
                .filter((s) => s.people > 0)
                .slice(0, 4)
                .map((slot) => (
                  <div key={slot.time} className="flex items-center gap-3">
                    <span className="text-xs text-[#9e9e9e] w-10 shrink-0">{slot.time}</span>
                    <div className="flex-1 h-2 bg-[#f0f0eb] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6b8a5e] rounded-full transition-all"
                        style={{ width: `${(slot.people / maxPeople) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#6b6b6b] w-8 text-right shrink-0">
                      {slot.people}p
                    </span>
                  </div>
                ))}
              {timeline.filter((s) => s.people > 0).length === 0 && (
                <p className="text-xs text-[#9e9e9e]">No activity recorded yet.</p>
              )}
            </div>

            <div className="mt-4 bg-[#f5f5f0] rounded-lg px-4 py-2 text-xs text-[#6b6b6b]">
              Peak expected: 08:30 – 09:30
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
      <p className="text-sm text-[#6b6b6b]">{label}</p>
      <p className="text-3xl font-bold text-[#2d2d2d] mt-1">{value}</p>
    </div>
  );
}
