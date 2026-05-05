"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/hooks/useAuth";
import Sidebar from "@/frontend/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { staff, loading, logout, isLoggedIn } = useAuth();
  const router = useRouter();

  // Desktop: sidebar collapsed
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: overlay drawer open/closed
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn || !staff) {
    router.push("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Sidebar
        staff={staff}
        onLogout={handleLogout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content — shifts right based on sidebar state */}
      <main
        className={
          collapsed
            ? "lg:ml-14 transition-all duration-300"
            : "lg:ml-50 transition-all duration-300"
        }
      >
        {/* Mobile header bar with hamburger */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-10 h-15 bg-white border-b border-[#e5e5e0] flex items-center px-4 gap-3 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[#6b6b6b] hover:bg-[#f5f5f0] hover:text-[#2d2d2d] transition-colors"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect y="3"    width="18" height="1.8" rx="0.9" fill="currentColor"/>
              <rect y="8.1"  width="18" height="1.8" rx="0.9" fill="currentColor"/>
              <rect y="13.2" width="18" height="1.8" rx="0.9" fill="currentColor"/>
            </svg>
          </button>
          <span className="text-sm font-semibold text-[#2d2d2d]">Breakfast Check-In</span>
        </div>

        {/* Offset for mobile header */}
        <div className="lg:hidden h-15" />

        {children}
      </main>
    </div>
  );
}
