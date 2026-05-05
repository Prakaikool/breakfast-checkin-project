"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatDate, formatTime } from "@/frontend/utils";
import { useAuth } from "@/frontend/hooks/useAuth";
import type { StaffInfo } from "@/types";

interface TopBarProps {
  title: string;
  subtitle: string;
  staff: StaffInfo;
}

export default function TopBar({ title, subtitle, staff }: TopBarProps) {
  const now = new Date();
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-15 bg-white border-b border-[#e5e5e0] flex items-center justify-between px-4 md:px-7">
      <div>
        <h1 className="text-lg font-semibold text-[#2d2d2d]">{title}</h1>
        <p className="text-sm text-[#6b6b6b]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-sm text-[#6b6b6b]">
          {formatDate(now)}, {formatTime(now)}
        </span>

        {/* Staff dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm text-[#2d2d2d] bg-[#f5f5f0] hover:bg-[#eceee8] px-3 py-1.5 rounded-md transition-colors"
          >
            {staff.name} <ChevronDown size={12} className="inline" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#e5e5e0] rounded-xl shadow-md z-50 min-w-[180px] py-1">
              <div className="px-4 py-2.5 border-b border-[#f0f0eb]">
                <p className="text-sm font-semibold text-[#2d2d2d]">{staff.name}</p>
                <p className="text-xs text-[#9e9e9e]">{staff.role}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2d2d2d] hover:bg-[#f5f5f0] transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-[#d45f5f] hover:bg-[#fdeeee] transition-colors rounded-b-xl"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
