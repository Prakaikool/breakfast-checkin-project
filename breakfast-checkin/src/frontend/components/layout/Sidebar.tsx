'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CheckCircle,
  LayoutDashboard,
  Monitor,
  Star,
  BookOpen,
  PenLine,
  BarChart2,
  Bell,
  UtensilsCrossed,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/frontend/utils';
import type { StaffInfo } from '@/types';

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Home',         href: '/home',        icon: Home            },
  { label: 'Check-In',    href: '/checkin',      icon: CheckCircle     },
  { label: 'Dashboard',   href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Public Dash', href: '/public-dash',  icon: Monitor         },
  { label: 'Members',     href: '/members',      icon: Star            },
  { label: 'Instruction', href: '/instruction',  icon: BookOpen        },
  { label: 'Daily Log',   href: '/daily-log',    icon: PenLine         },
  { label: 'Reports',     href: '/reports',      icon: BarChart2       },
  { label: 'Reminders',   href: '/reminders',    icon: Bell            },
  { label: 'Kitchen',     href: '/kitchen',      icon: UtensilsCrossed },
  { label: 'Settings',    href: '/settings',     icon: Settings        },
];

interface SidebarProps {
  staff: StaffInfo;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  staff,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-[#2c3e2d] flex flex-col z-30',
          'transition-all duration-300 ease-in-out',
          // Width: collapsed = 56px, expanded = 200px
          collapsed ? 'w-14' : 'w-50',
          // Mobile: hidden unless mobileOpen (always expanded when open on mobile)
          mobileOpen ? 'translate-x-0 w-50' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* ── Logo / brand ── */}
        <div
          className={cn(
            'flex items-center shrink-0 h-15 overflow-hidden',
            collapsed ? 'justify-center px-0' : 'px-5 gap-2'
          )}
        >
          {/* Icon mark — always visible */}
          <div className="w-7 h-7 rounded-lg bg-[#6b8a5e] flex items-center justify-center shrink-0">
            <UtensilsCrossed size={14} className="text-white" />
          </div>
          {/* Wordmark — hidden when collapsed */}
          {!collapsed && (
            <span className="text-[15px] font-bold text-white leading-none whitespace-nowrap overflow-hidden">
              Breakfast
            </span>
          )}
        </div>

        <div className="h-px bg-white/10 shrink-0" />

        {/* ── User info ── */}
        <div
          className={cn(
            'flex items-center shrink-0 py-3 overflow-hidden',
            collapsed ? 'justify-center px-0' : 'px-3.5 gap-2.5'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {staff.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[12px] font-semibold text-white truncate leading-none mb-0.5">
                {staff.name}
              </p>
              <p className="text-[10px] text-white/45 leading-none">{staff.role}</p>
            </div>
          )}
        </div>

        <div className="h-px bg-white/10 mx-3 shrink-0" />

        {/* ── Navigation ── */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-[13px] font-medium transition-colors group relative',
                  collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-[#6b8a5e] text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[#1a2a1b] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer: logout + collapse toggle ── */}
        <div className="px-2 pb-4 shrink-0">
          <div className="h-px bg-white/10 mb-2" />

          {/* Logout */}
          <button
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'w-full flex items-center rounded-lg text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/10 transition-colors group relative',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            )}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#1a2a1b] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                Logout
              </span>
            )}
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex w-full items-center rounded-lg text-[13px] font-medium text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors mt-1',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
