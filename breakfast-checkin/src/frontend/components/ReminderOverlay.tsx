'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BellRing, Check, X } from 'lucide-react';
import { useAuth } from '@/frontend/hooks/useAuth';

const PUBLIC_PATHS = ['/guest', '/display', '/login'];
const ALLOWED_ROLES = ['ADMIN', 'SUPERVISOR'];
const MAX_DISMISSALS = 2;

interface Reminder {
    id: number;
    title: string;
    time: string;
    isOverdue: boolean;
    status: string;
}

export default function ReminderOverlay() {
    const pathname = usePathname();
    const { staff } = useAuth();
    const [due, setDue] = useState<Reminder | null>(null);
    const dismissCounts = useRef<Map<number, number>>(new Map());

    const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const isAllowedRole = staff ? ALLOWED_ROLES.includes(staff.role) : false;

    useEffect(() => {
        if (!isAllowedRole) return;

        async function check() {
            try {
                const res = await fetch('/api/reminders');
                if (!res.ok) return;
                const json = await res.json();
                if (!json.success) return;

                const now = new Date();
                const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                const hit: Reminder | undefined = (json.data as Reminder[]).find(
                    (r) =>
                        r.status !== 'COMPLETED' &&
                        r.time <= hhmm &&
                        (dismissCounts.current.get(r.id) ?? 0) < MAX_DISMISSALS
                );
                setDue(hit ?? null);
            } catch {
            }
        }

        check();
        const id = setInterval(check, 30_000);
        return () => clearInterval(id);
    }, [isAllowedRole]);

    function dismiss() {
        if (!due) return;
        const prev = dismissCounts.current.get(due.id) ?? 0;
        dismissCounts.current.set(due.id, prev + 1);
        setDue(null);
    }

    async function markDone() {
        if (!due) return;
        dismissCounts.current.set(due.id, MAX_DISMISSALS);
        setDue(null);
        await fetch(`/api/reminders/${due.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED' }),
        });
    }

    if (!due || isPublicPage || !isAllowedRole) return null;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center px-6">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={dismiss}
            />

            <div
                className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                style={{ animation: 'reminderPop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
                <div className="bg-[#d97706] px-6 py-5 flex items-center gap-3">
                    <BellRing size={22} className="text-white shrink-0 animate-bounce" />
                    <p className="text-white text-sm font-bold uppercase tracking-widest flex-1">
                        Reminder
                    </p>
                    <button
                        onClick={dismiss}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="bg-white px-6 py-7 flex flex-col gap-5">
                    <div>
                        <p className="text-[22px] font-bold text-[#2d2d2d] leading-snug">
                            {due.title}
                        </p>
                        <p className="text-sm text-[#9e9e9e] mt-1.5">
                            {due.isOverdue ? 'Overdue · ' : ''}Scheduled at {due.time}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={markDone}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-xl hover:bg-[#5a7a4e] transition-colors"
                        >
                            <Check size={15} />
                            Mark as Done
                        </button>
                        <button
                            onClick={dismiss}
                            className="px-4 py-2.5 border border-[#e5e5e0] text-[#9e9e9e] text-sm font-medium rounded-xl hover:bg-[#f5f5f0] transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes reminderPop {
                    from { opacity: 0; transform: scale(0.88) translateY(16px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);     }
                }
            `}</style>
        </div>
    );
}
