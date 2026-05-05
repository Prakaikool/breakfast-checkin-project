'use client';

import { useEffect, useState } from 'react';
import {
    UtensilsCrossed,
    Megaphone,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChefHat,
    Wifi,
    RefreshCw,
    Shield,
    X,
    Info,
} from 'lucide-react';

const GDPR_KEY = 'gdpr_guest_acknowledged';

function GdprBanner() {
    const [visible, setVisible] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(GDPR_KEY)) setVisible(true);
    }, []);

    function accept() {
        localStorage.setItem(GDPR_KEY, '1');
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-4 pb-4">
            <div className="bg-[#2d2d2d] rounded-2xl overflow-hidden shadow-2xl">
                {/* Main banner */}
                <div className="px-4 py-4 flex items-start gap-3">
                    <Shield size={16} className="text-[#a8c5a0] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">Privacy Notice</p>
                        <p className="text-[#b0b0b0] text-xs mt-1 leading-relaxed">
                            This page displays restaurant information only.{' '}
                            <strong className="text-[#d0d0d0]">No personal data is collected or stored</strong>{' '}
                            from your device.
                        </p>
                        <button
                            onClick={() => setShowDetail((v) => !v)}
                            className="text-[#a8c5a0] text-xs mt-1.5 flex items-center gap-1 hover:text-[#c0ddb8] transition-colors"
                        >
                            <Info size={11} />
                            {showDetail ? 'Hide details' : 'Learn more'}
                        </button>
                    </div>
                    <button
                        onClick={accept}
                        className="text-[#6b6b6b] hover:text-[#9e9e9e] transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Detail panel */}
                {showDetail && (
                    <div className="border-t border-[#3d3d3d] px-4 py-4 flex flex-col gap-2.5">
                        <DetailRow
                            title="What this page shows"
                            text="Crowd level, food availability, service hours, and announcements — all anonymised operational data."
                        />
                        <DetailRow
                            title="Data collected from you"
                            text="None. No cookies, no tracking, no login required. Your IP address may appear in standard server access logs, which are deleted after 30 days."
                        />
                        <DetailRow
                            title="Auto-refresh requests"
                            text="This page contacts our server every 30 seconds to update information. No personal data is sent in these requests."
                        />
                        <DetailRow
                            title="Your rights (GDPR)"
                            text="Under the General Data Protection Regulation (EU 2016/679), you have the right to access, rectify, or erase any personal data we hold. Contact the hotel reception for any requests."
                        />
                        <DetailRow
                            title="Data controller"
                            text="The hotel operating this system. Please ask reception for the full Privacy Policy."
                        />
                    </div>
                )}

                {/* Accept button */}
                <div className="px-4 pb-4">
                    <button
                        onClick={accept}
                        className="w-full py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-xl hover:bg-[#5a7a4e] active:scale-95 transition-all"
                    >
                        I understand — Continue
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="text-[#c0c0c0] text-[11px] font-semibold uppercase tracking-wide">{title}</p>
            <p className="text-[#8a8a8a] text-xs mt-0.5 leading-relaxed">{text}</p>
        </div>
    );
}

type Level = 'LOW' | 'MODERATE' | 'BUSY' | 'VERY_BUSY';
type ItemStatus = 'AVAILABLE' | 'LOW' | 'SOLD_OUT';

interface PublicStatus {
    level: Level;
    message: string;
    trend: { time: string; people: number }[];
    serviceHours: { start: string; end: string };
    announcement: {
        text: string;
        isVisible: boolean;
    };
}

interface KitchenItem {
    id: number;
    name: string;
    status: ItemStatus;
}

const LEVEL_CONFIG: Record<
    Level,
    { label: string; sub: string; color: string; bg: string; border: string; dot: string; pill: string }
> = {
    LOW: {
        label: 'Quiet',
        sub: 'Plenty of seats available',
        color: 'text-[#3a6b30]',
        bg: 'bg-[#eef5eb]',
        border: 'border-[#b8d9b0]',
        dot: 'bg-[#6b8a5e]',
        pill: 'bg-[#6b8a5e]',
    },
    MODERATE: {
        label: 'Moderate',
        sub: 'Some seats available',
        color: 'text-[#8a4a10]',
        bg: 'bg-[#fef5ec]',
        border: 'border-[#f2c880]',
        dot: 'bg-[#d4893f]',
        pill: 'bg-[#d4893f]',
    },
    BUSY: {
        label: 'Busy',
        sub: 'Short wait expected',
        color: 'text-[#a02828]',
        bg: 'bg-[#fef0f0]',
        border: 'border-[#f5b8b8]',
        dot: 'bg-[#d45f5f]',
        pill: 'bg-[#d45f5f]',
    },
    VERY_BUSY: {
        label: 'Very Busy',
        sub: 'Please be patient',
        color: 'text-[#7a1010]',
        bg: 'bg-[#fde8e8]',
        border: 'border-[#e89090]',
        dot: 'bg-[#b03030]',
        pill: 'bg-[#b03030]',
    },
};

const ITEM_CONFIG: Record<ItemStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
    AVAILABLE:  { label: 'Available',  icon: CheckCircle2, color: 'text-[#3a6b30]', bg: 'bg-[#eef5eb]', border: 'border-[#b8d9b0]' },
    LOW:        { label: 'Running Low', icon: AlertCircle,  color: 'text-[#8a4a10]', bg: 'bg-[#fef5ec]', border: 'border-[#f2c880]' },
    SOLD_OUT:   { label: 'Sold Out',    icon: XCircle,      color: 'text-[#9e9e9e]', bg: 'bg-[#f5f5f0]', border: 'border-[#e0e0da]' },
};

function useData<T>(url: string, interval = 30_000) {
    const [data, setData] = useState<T | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    function fetch_() {
        fetch(url)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) { setData(d.data); setLastUpdated(new Date()); }
            })
            .catch(() => {});
    }

    useEffect(() => {
        fetch_();
        const id = setInterval(fetch_, interval);
        return () => clearInterval(id);
    }, [url]);

    return { data, lastUpdated, refetch: fetch_ };
}

function useClock() {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

export default function GuestView() {
    const now = useClock();
    const { data: status, lastUpdated, refetch: refetchStatus } = useData<PublicStatus>('/api/dashboard/public');
    const { data: kitchenItems, refetch: refetchKitchen } = useData<KitchenItem[]>('/api/kitchen/public');

    const level: Level = status?.level ?? 'LOW';
    const cfg = LEVEL_CONFIG[level];
    const serviceHours = status?.serviceHours ?? { start: '07:00', end: '10:30' };
    const announcement = status?.announcement?.isVisible && status.announcement.text ? status.announcement.text : '';

    const available  = kitchenItems?.filter((i) => i.status === 'AVAILABLE') ?? [];
    const low        = kitchenItems?.filter((i) => i.status === 'LOW') ?? [];
    const soldOut    = kitchenItems?.filter((i) => i.status === 'SOLD_OUT') ?? [];

    const timeStr = now
        ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '--:--';

    function refresh() { refetchStatus(); refetchKitchen(); }

    return (
        <div className="min-h-screen bg-[#f7f7f3] flex flex-col max-w-md mx-auto">
            <GdprBanner />

            {/* Header */}
            <div className="bg-white border-b border-[#e5e5e0] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#6b8a5e] flex items-center justify-center">
                        <UtensilsCrossed size={15} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#2d2d2d]">Hotel Breakfast</p>
                        <p className="text-[11px] text-[#9e9e9e]">Restaurant · Floor 1</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-[#2d2d2d] tabular-nums">{timeStr}</p>
                    <button
                        onClick={refresh}
                        className="w-7 h-7 rounded-full bg-[#f0f0eb] flex items-center justify-center text-[#9e9e9e] hover:bg-[#e5e5e0] active:scale-95 transition-all"
                    >
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 px-4 py-5">

                {/* Announcement */}
                {announcement && (
                    <div className="bg-[#fffbf0] border border-[#f0d880] rounded-2xl px-4 py-4 flex items-start gap-3">
                        <Megaphone size={16} className="text-[#a07820] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#5a4010] leading-relaxed font-medium">{announcement}</p>
                    </div>
                )}

                {/* Service hours */}
                <div className="bg-white border border-[#e5e5e0] rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Clock size={15} className="text-[#6b8a5e] shrink-0" />
                    <div>
                        <p className="text-[11px] text-[#9e9e9e] font-medium">Breakfast Service</p>
                        <p className="text-sm font-bold text-[#2d2d2d]">
                            {serviceHours.start} – {serviceHours.end}
                        </p>
                    </div>
                </div>

                {/* Crowd level */}
                <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} px-5 py-5`}>
                    <p className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Users size={11} />
                        Current Crowd
                    </p>
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${cfg.dot} animate-pulse shrink-0`} />
                        <div>
                            <p className={`text-2xl font-black ${cfg.color}`}>{cfg.label}</p>
                            <p className="text-sm text-[#6b6b6b] mt-0.5">{cfg.sub}</p>
                        </div>
                    </div>
                </div>

                {/* Food availability */}
                <div className="bg-white border border-[#e5e5e0] rounded-2xl overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-[#e5e5e0] flex items-center gap-2">
                        <ChefHat size={15} className="text-[#6b8a5e]" />
                        <p className="text-sm font-bold text-[#2d2d2d]">Food Availability</p>
                    </div>

                    {!kitchenItems ? (
                        <div className="px-4 py-8 text-center text-sm text-[#c0c0c0]">Loading…</div>
                    ) : kitchenItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-[#c0c0c0]">No items listed yet.</div>
                    ) : (
                        <div className="divide-y divide-[#f0f0eb]">
                            {/* Available */}
                            {available.map((item) => (
                                <FoodRow key={item.id} item={item} />
                            ))}
                            {/* Low */}
                            {low.map((item) => (
                                <FoodRow key={item.id} item={item} />
                            ))}
                            {/* Sold out */}
                            {soldOut.map((item) => (
                                <FoodRow key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Last updated */}
                {lastUpdated && (
                    <div className="flex items-center justify-center gap-1.5 pb-2">
                        <Wifi size={10} className="text-[#c0c0c0]" />
                        <p className="text-[11px] text-[#c0c0c0]">
                            Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            · auto-refreshes every 30s
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function FoodRow({ item }: { item: KitchenItem }) {
    const cfg = ITEM_CONFIG[item.status];
    const Icon = cfg.icon;
    const isSoldOut = item.status === 'SOLD_OUT';

    return (
        <div className={`flex items-center justify-between px-4 py-3 ${isSoldOut ? 'opacity-50' : ''}`}>
            <p className={`text-sm font-medium ${isSoldOut ? 'line-through text-[#9e9e9e]' : 'text-[#2d2d2d]'}`}>
                {item.name}
            </p>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                <Icon size={10} />
                {cfg.label}
            </div>
        </div>
    );
}
