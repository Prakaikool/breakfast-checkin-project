"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";

type Level = "LOW" | "MODERATE" | "BUSY";

interface DayRow {
  date: string;
  label: string;
  adults: number;
  children: number;
  total: number;
  level: Level;
}

interface ReportData {
  summary: {
    totalGuests: number;
    avgPerDay: number;
    peakDay: string;
    busiestHour: string;
    totalChange: number | null;
    avgChange: number | null;
  };
  days: DayRow[];
  guestsPerDay: { label: string; total: number }[];
  peakHours: { time: string; people: number }[];
}

const LEVEL_PILL: Record<Level, string> = {
  LOW:      "bg-[#e8efe5] text-[#4a7a3d]",
  MODERATE: "bg-[#fff3e8] text-[#a05c1e]",
  BUSY:     "bg-[#fdeeee] text-[#c04040]",
};

const LEVEL_DOT: Record<Level, string> = {
  LOW:      "bg-[#6b8a5e]",
  MODERATE: "bg-[#d4893f]",
  BUSY:     "bg-[#d45f5f]",
};

function BarChart({
  bars,
  labelKey,
  valueKey,
}: {
  bars: { label: string; time?: string; total?: number; people?: number }[];
  labelKey: "label" | "time";
  valueKey: "total" | "people";
}) {
  const values = bars.map((b) => (valueKey === "total" ? b.total ?? 0 : b.people ?? 0));
  const max = Math.max(...values, 1);
  const maxVal = Math.max(...values);

  return (
    <div className="flex flex-col gap-1">
      {/* Bar area - fixed height so percentage heights resolve correctly */}
      <div className="flex items-end gap-2 h-16">
        {values.map((val, i) => {
          const isPeak = val === maxVal && val > 0;
          const heightPct = Math.max((val / max) * 100, val > 0 ? 8 : 3);
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${isPeak ? "bg-[#6b8a5e]" : "bg-[#d9d9d0]"}`}
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>
      {/* Label row */}
      <div className="flex gap-2">
        {bars.map((bar, i) => {
          const label = labelKey === "time" ? (bar.time ?? bar.label) : bar.label;
          return (
            <span key={i} className="flex-1 text-center text-[9px] text-[#9e9e9e] whitespace-nowrap overflow-hidden">
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function exportCSV(days: DayRow[]) {
  const header = "Date,Adults,Children,Total,Status";
  const rows = days.map(
    (d) => `${d.label},${d.adults},${d.children},${d.total},${d.level}`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `breakfast-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(data: ReportData, period: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const green = [107, 138, 94] as const;
  const dark  = [45, 45, 45]  as const;
  const grey  = [107, 107, 107] as const;
  const light = [245, 245, 240] as const;

  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const dateStr = new Date().toISOString().slice(0, 10);

  // ── Header banner ──────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Breakfast Check-In Report", margin, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Period: ${period === "this_week" ? "This Week" : "Last Week"}   •   Generated: ${dateStr}`,
    margin, 20
  );

  // ── Summary cards ──────────────────────────────────────────
  const s = data.summary;
  const cards = [
    { label: "Total Guests",  value: String(s.totalGuests), sub: s.totalChange != null ? `${s.totalChange >= 0 ? "+" : ""}${s.totalChange}% vs prev` : undefined },
    { label: "Avg / Day",     value: String(s.avgPerDay),   sub: s.avgChange != null ? `${s.avgChange >= 0 ? "+" : ""}${s.avgChange}% vs prev` : undefined },
    { label: "Peak Day",      value: s.peakDay },
    { label: "Busiest Hour",  value: s.busiestHour },
  ];

  const cardW = (contentW - 9) / 4;
  let y = 34;
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, 22, 2, 2, "F");
    doc.setDrawColor(229, 229, 224);
    doc.roundedRect(x, y, cardW, 22, 2, 2, "S");

    doc.setTextColor(...grey);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(card.label, x + 4, y + 6);

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(card.value, x + 4, y + 14);

    if (card.sub) {
      const isPos = card.sub.startsWith("+");
      doc.setTextColor(isPos ? 107 : 212, isPos ? 138 : 95, isPos ? 94 : 95);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(card.sub, x + 4, y + 20);
    }
  });

  y += 28;

  // ── Bar chart: Guests Per Day ───────────────────────────────
  const chartW = (contentW - 5) / 2;
  const chartH = 38;

  function drawBarChart(
    cx: number, cy: number, cw: number, ch: number,
    bars: { label: string; val: number }[], title: string
  ) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cx, cy, cw, ch + 16, 2, 2, "F");
    doc.setDrawColor(229, 229, 224);
    doc.roundedRect(cx, cy, cw, ch + 16, 2, 2, "S");

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title, cx + 4, cy + 7);

    const maxVal = Math.max(...bars.map((b) => b.val), 1);
    const barAreaX = cx + 4;
    const barAreaY = cy + 10;
    const barAreaW = cw - 8;
    const barAreaH = ch - 4;
    const barW = barAreaW / bars.length;
    const gap = barW * 0.25;

    bars.forEach((bar, i) => {
      const bx = barAreaX + i * barW + gap / 2;
      const bw = barW - gap;
      const bh = bar.val > 0 ? Math.max((bar.val / maxVal) * barAreaH, 2) : 2;
      const by = barAreaY + barAreaH - bh;

      const isPeak = bar.val === maxVal && bar.val > 0;
      if (isPeak) doc.setFillColor(...green);
      else doc.setFillColor(217, 217, 208);
      doc.roundedRect(bx, by, bw, bh, 0.8, 0.8, "F");

      doc.setTextColor(...grey);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.text(bar.label, bx + bw / 2, barAreaY + barAreaH + 4, { align: "center" });
    });
  }

  drawBarChart(
    margin, y, chartW, chartH,
    data.guestsPerDay.map((b) => ({ label: b.label, val: b.total })),
    "Guests Per Day"
  );

  drawBarChart(
    margin + chartW + 5, y, chartW, chartH,
    data.peakHours.map((h) => ({ label: h.time.slice(0, 5), val: h.people })),
    "Peak Hours"
  );

  y += chartH + 22;

  // ── Daily Summary table ─────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
  doc.setDrawColor(229, 229, 224);
  doc.setLineWidth(0.3);

  // Table header
  doc.setFillColor(...light);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const cols = [
    { label: "Date",     x: margin + 3,           w: 55 },
    { label: "Adults",   x: margin + 58,           w: 25 },
    { label: "Children", x: margin + 83,           w: 28 },
    { label: "Total",    x: margin + 111,          w: 25 },
    { label: "Status",   x: margin + 136,          w: 40 },
  ];
  cols.forEach((c) => doc.text(c.label, c.x, y + 5.5));
  y += 8;

  // Table rows
  const LEVEL_COLOR: Record<Level, [number, number, number]> = {
    LOW:      [74, 122, 61],
    MODERATE: [160, 92, 30],
    BUSY:     [192, 64, 64],
  };
  const LEVEL_BG: Record<Level, [number, number, number]> = {
    LOW:      [232, 239, 229],
    MODERATE: [255, 243, 232],
    BUSY:     [253, 238, 238],
  };

  data.days.forEach((day, i) => {
    const rowH = 8;
    if (i % 2 === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentW, rowH, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text(day.label, cols[0].x, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.text(String(day.adults),   cols[1].x, y + 5.5);
    doc.text(String(day.children), cols[2].x, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(String(day.total), cols[3].x, y + 5.5);

    // Status pill
    const pill = day.level.charAt(0) + day.level.slice(1).toLowerCase();
    const pillX = cols[4].x;
    const pillW = 22;
    doc.setFillColor(...LEVEL_BG[day.level]);
    doc.roundedRect(pillX, y + 1.5, pillW, 5, 1, 1, "F");
    doc.setTextColor(...LEVEL_COLOR[day.level]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(pill, pillX + pillW / 2, y + 5.4, { align: "center" });

    // Row separator
    doc.setDrawColor(240, 240, 235);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);
    y += rowH;
  });

  // Border around table
  doc.setDrawColor(229, 229, 224);
  doc.roundedRect(margin, y - data.days.length * 8 - 8, contentW, data.days.length * 8 + 8, 2, 2, "S");

  // ── Footer ──────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text("Breakfast Check-In System", margin, 290);
  doc.text(dateStr, pageW - margin, 290, { align: "right" });

  doc.save(`breakfast-report-${dateStr}.pdf`);
}

type Period = "this_week" | "last_week";
const PERIOD_LABEL: Record<Period, string> = {
  this_week: "This Week",
  last_week: "Last Week",
};

export default function ReportsView() {
  const { staff } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState<Period>("this_week");
  const [periodOpen, setPeriodOpen] = useState(false);

  useEffect(() => {
    setData(null);
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); });
  }, [period]);

  if (!staff) return null;

  const summary = data?.summary;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar
        title="Breakfast Check-In"
        subtitle="Analytics and reports"
        staff={staff}
      />

      {/* Page tab */}
      <div className="bg-white border-b border-[#e5e5e0] px-4 md:px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Reports
          </span>
        </div>
      </div>

      <div className="p-4 md:p-7">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <div className="relative">
            <button
              onClick={() => setPeriodOpen((o) => !o)}
              className="flex items-center gap-2 bg-white border border-[#e5e5e0] rounded-lg px-3 py-2 text-sm text-[#2d2d2d] hover:border-[#c0c0c0] transition-colors"
            >
              {PERIOD_LABEL[period]} <ChevronDown size={12} className="inline" />
            </button>
            {periodOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e0] rounded-lg shadow-md z-10 min-w-35">
                {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      period === p
                        ? "bg-[#e8efe5] text-[#4a7a3d] font-medium"
                        : "text-[#2d2d2d] hover:bg-[#f5f5f0]"
                    }`}
                  >
                    {PERIOD_LABEL[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => data && exportCSV(data.days)}
              disabled={!data}
              className="px-4 py-2 bg-white border border-[#e5e5e0] text-[#2d2d2d] text-sm font-semibold rounded-lg hover:border-[#c0c0c0] disabled:opacity-40 transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => data && exportPDF(data, period)}
              disabled={!data}
              className="px-4 py-2 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] disabled:opacity-40 transition-colors"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Total Guests */}
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6b6b6b] mb-1">Total Guests</p>
            <p className="text-[22px] font-bold text-[#2d2d2d] leading-none mb-1">
              {summary?.totalGuests ?? "–"}
            </p>
            {summary?.totalChange != null && (
              <p className={`text-xs font-medium ${summary.totalChange >= 0 ? "text-[#6b8a5e]" : "text-[#d45f5f]"}`}>
                {summary.totalChange >= 0 ? "+" : ""}{summary.totalChange}%
              </p>
            )}
          </div>

          {/* Avg / Day */}
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6b6b6b] mb-1">Avg / Day</p>
            <p className="text-[22px] font-bold text-[#2d2d2d] leading-none mb-1">
              {summary?.avgPerDay ?? "–"}
            </p>
            {summary?.avgChange != null && (
              <p className={`text-xs font-medium ${summary.avgChange >= 0 ? "text-[#6b8a5e]" : "text-[#d45f5f]"}`}>
                {summary.avgChange >= 0 ? "+" : ""}{summary.avgChange}%
              </p>
            )}
          </div>

          {/* Peak Day */}
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6b6b6b] mb-1">Peak Day</p>
            <p className="text-[22px] font-bold text-[#2d2d2d] leading-none">
              {summary?.peakDay ?? "–"}
            </p>
          </div>

          {/* Busiest Hour */}
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6b6b6b] mb-1">Busiest Hour</p>
            <p className="text-[22px] font-bold text-[#2d2d2d] leading-none">
              {summary?.busiestHour ?? "–"}
            </p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Guests Per Day */}
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
            <p className="text-sm font-semibold text-[#2d2d2d] mb-4">Guests Per Day</p>
            {data ? (
              <BarChart
                bars={data.guestsPerDay}
                labelKey="label"
                valueKey="total"
              />
            ) : (
              <div className="h-22.5 flex items-center justify-center text-xs text-[#9e9e9e]">
                Loading...
              </div>
            )}
          </div>

          {/* Peak Hours */}
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
            <p className="text-sm font-semibold text-[#2d2d2d] mb-4">Peak Hours</p>
            {data ? (
              <BarChart
                bars={data.peakHours.map((h) => ({ ...h, label: h.time }))}
                labelKey="time"
                valueKey="people"
              />
            ) : (
              <div className="h-22.5 flex items-center justify-center text-xs text-[#9e9e9e]">
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Daily Summary table */}
        <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e5e0]">
            <p className="text-sm font-semibold text-[#2d2d2d]">Daily Summary</p>
          </div>

          <div className="overflow-x-auto">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] px-5 py-2 border-b border-[#e5e5e0] min-w-100">
              {["Date", "Adults", "Children", "Total", "Status"].map((h) => (
                <span key={h} className="text-xs font-semibold text-[#9e9e9e]">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {!data ? (
              <div className="px-5 py-6 text-sm text-[#9e9e9e]">Loading...</div>
            ) : data.days.length === 0 ? (
              <div className="px-5 py-6 text-sm text-[#9e9e9e]">No data for this week yet.</div>
            ) : (
              data.days.map((day, i) => (
                <div
                  key={day.date}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] px-5 py-3 items-center min-w-100 ${
                    i < data.days.length - 1 ? "border-b border-[#f0f0eb]" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[#2d2d2d]">{day.label}</span>
                  <span className="text-sm text-[#6b6b6b]">{day.adults}</span>
                  <span className="text-sm text-[#6b6b6b]">{day.children}</span>
                  <span className="text-sm font-semibold text-[#2d2d2d]">{day.total}</span>
                  <span>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full ${LEVEL_PILL[day.level]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[day.level]}`} />
                      {day.level.charAt(0) + day.level.slice(1).toLowerCase()}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
