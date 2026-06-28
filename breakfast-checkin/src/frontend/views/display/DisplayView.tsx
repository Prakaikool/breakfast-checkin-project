'use client';

import { useEffect, useState } from 'react';
import { UtensilsCrossed, Megaphone } from 'lucide-react';

type Level = 'LOW' | 'MODERATE' | 'BUSY';

interface PublicStatus {
    level: Level;
    message: string;
    trend: { time: string; people: number }[];
    serviceHours: { start: string; end: string };
    announcement: {
        text: string;
        updatedBy: string;
        updatedAt: string | null;
        isVisible: boolean;
    };
}

const LEVEL_CONFIG: Record<
    Level,
    {
        label: string;
        sub: string;
        color: string;
        bg: string;
        border: string;
        dot: string;
    }
> = {
    LOW: {
        label: 'Low',
        sub: 'Light flow - plenty of seats available',
        color: 'text-[#4a7a3d]',
        bg: 'bg-[#eef5eb]',
        border: 'border-[#c8dfc2]',
        dot: 'bg-[#6b8a5e]'
    },
    MODERATE: {
        label: 'Moderate',
        sub: 'Normal flow - some seats available',
        color: 'text-[#9c5a1a]',
        bg: 'bg-[#fef5ec]',
        border: 'border-[#f2d5b0]',
        dot: 'bg-[#d4893f]'
    },
    BUSY: {
        label: 'Busy',
        sub: 'High traffic - expect a short wait',
        color: 'text-[#b03030]',
        bg: 'bg-[#fef0f0]',
        border: 'border-[#f5c0c0]',
        dot: 'bg-[#d45f5f]'
    }
};

function useClock() {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

function usePublicStatus() {
    const [data, setData] = useState<PublicStatus | null>(null);

    useEffect(() => {
        function fetchData() {
            fetch('/api/dashboard/public')
                .then((r) => r.json())
                .then((d) => {
                    if (d.success) setData(d.data);
                })
                .catch(() => {});
        }
        fetchData();
        const id = setInterval(fetchData, 10_000);
        return () => clearInterval(id);
    }, []);

    return data;
}

export default function DisplayView() {
    const now = useClock();
    const data = usePublicStatus();

    const level: Level = data?.level ?? 'LOW';
    const cfg = LEVEL_CONFIG[level];
    const trend = data?.trend ?? [];
    const serviceHours = data?.serviceHours ?? { start: '07:00', end: '10:30' };
    const announcement =
        data?.announcement?.isVisible && data.announcement.text
            ? data.announcement.text
            : '';

    const maxPeople = Math.max(...trend.map((s) => s.people), 1);
    const peakSlot = trend.reduce(
        (p, c) => (c.people > p.people ? c : p),
        trend[0] ?? { time: '–', people: 0 }
    );
    const quietSlot = trend.reduce(
        (p, c) => (c.people < p.people ? c : p),
        trend[0] ?? { time: '–', people: 999 }
    );

    const timeStr = now
        ? now.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
          })
        : '--:--';
    const dateStr = now
        ? now.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
          })
        : '';

    return (
        <div className="bg-[#f7f7f3] min-h-screen flex flex-col select-none overflow-hidden">
            <div className="bg-white border-b border-[#e0e0da] flex items-center justify-between px-10 py-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#6b8a5e] flex items-center justify-center">
                        <UtensilsCrossed size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-[#2d2d2d] leading-tight">
                            Hotel Breakfast
                        </p>
                        <p className="text-xs text-[#9e9e9e]">
                            Restaurant &middot; Floor 1
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-[#2d2d2d] tabular-nums">
                        {timeStr}
                    </p>
                    <p className="text-xs text-[#9e9e9e] mt-0.5">{dateStr}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-10 py-8 gap-6">

                {announcement && (
                    <div className="w-full max-w-2xl bg-[#fffbf0] border border-[#f0e0a0] rounded-2xl px-7 py-5 flex items-start gap-4">
                        <Megaphone
                            size={22}
                            className="text-[#a07820] shrink-0 mt-0.5"
                        />
                        <p className="text-base text-[#5a4a20] leading-relaxed font-medium">
                            {announcement}
                        </p>
                    </div>
                )}

                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#2d2d2d] tracking-wide uppercase">
                        Breakfast Status
                    </h1>
                    <p className="text-sm text-[#9e9e9e] mt-1">
                        Current activity at the breakfast area
                    </p>
                </div>

                <div
                    className={`w-full max-w-2xl rounded-3xl border-2 ${cfg.bg} ${cfg.border} flex flex-col items-center py-10 px-8 gap-3`}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-3 h-3 rounded-full ${cfg.dot} animate-pulse`}
                        />
                        <p className="text-sm font-semibold text-[#6b6b6b] uppercase tracking-widest">
                            Current Level
                        </p>
                    </div>
                    <p
                        className={`text-[50px] font-black leading-none ${cfg.color}`}
                        style={{ letterSpacing: '-2px' }}
                    >
                        {cfg.label}
                    </p>
                    <p className="text-lg text-[#6b6b6b]">{cfg.sub}</p>
                </div>

                <div className="w-full max-w-2xl bg-white border border-[#e5e5e0] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm font-bold text-[#2d2d2d] uppercase tracking-wider">
                            Crowd Trend Today
                        </p>
                        {trend.length > 0 && (
                            <div className="flex items-center gap-4 text-xs text-[#9e9e9e]">
                                <span>
                                    Peak:{' '}
                                    <span className="text-[#d4893f] font-semibold">
                                        {peakSlot.time}
                                    </span>
                                </span>
                                <span>
                                    Quietest:{' '}
                                    <span className="text-[#6b8a5e] font-semibold">
                                        {quietSlot.time}
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {trend.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-end gap-3 h-20">
                                {trend.map((slot) => {
                                    const heightPct = Math.max(
                                        (slot.people / maxPeople) * 100,
                                        slot.people > 0 ? 10 : 4
                                    );
                                    const isPeak =
                                        slot.people ===
                                            Math.max(
                                                ...trend.map((s) => s.people)
                                            ) && slot.people > 0;
                                    return (
                                        <div
                                            key={slot.time}
                                            className={`flex-1 rounded-lg transition-all ${isPeak ? 'bg-[#6b8a5e]' : 'bg-[#d9d9d0]'}`}
                                            style={{ height: `${heightPct}%` }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex gap-3">
                                {trend.map((slot) => (
                                    <span
                                        key={slot.time}
                                        className="flex-1 text-center text-xs text-[#9e9e9e]"
                                    >
                                        {slot.time}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-sm text-[#c0c0c0]">
                            No data yet - data appears once guests start
                            checking in.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border-t border-[#e0e0da] flex items-center justify-center gap-6 px-10 py-4 shrink-0">
                <span className="text-sm font-semibold text-[#6b8a5e]">
                    Breakfast Service
                </span>
                <span className="text-[#c0c0c0]">&middot;</span>
                <span className="text-sm text-[#6b6b6b]">
                    Open {serviceHours.start} &ndash; {serviceHours.end}
                </span>
                <span className="text-[#c0c0c0]">&middot;</span>
                <span className="text-sm text-[#6b6b6b]">
                    Restaurant &middot; Floor 1
                </span>
            </div>

        </div>
    );
}
