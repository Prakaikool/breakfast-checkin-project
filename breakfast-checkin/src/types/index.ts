// ===========================================
// TYPES - Shared across frontend and backend
// ===========================================

// ---- API Response wrapper ----
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---- Auth ----
export interface StaffInfo {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "ENTRANCE" | "KITCHEN";
}

export interface LoginRequest {
  email: string;
  pin: string;
}

// ---- Guest Search ----
export interface GuestResult {
  id: number;
  name: string;
  roomId: number;
  guestType: "HOTEL" | "SPA" | "VIP" | "EXTERNAL";
  isChild: boolean;
  hasBreakfast: boolean;
  checkInDate: string;
  checkOutDate: string;
  notes: string | null;
  room: {
    id: number;
    roomNumber: string;
    maxGuests: number;
  };
  checkIns: {
    id: number;
    checkedInAt: string;
  }[];
}

export interface RoomResult {
  roomId: number;
  roomNumber: string;
  guests: GuestResult[];
  alreadyCheckedIn: boolean;
  totalAdults: number;
  totalChildren: number;
  checkedInAdults: number;
  checkedInChildren: number;
  checkedInCount: number;
  checkStatus: "none" | "partial" | "full";
}

// ---- Check-in ----
export interface CheckInRequest {
  roomId: number;
  guestId?: number;
  adultCount: number;
  childCount: number;
  note?: string;
  overrideDuplicate?: boolean;
}

export interface CheckInRecord {
  id: number;
  roomNumber: string;
  guestName: string | null;
  guestType: string;
  adultCount: number;
  childCount: number;
  staffName: string;
  isDuplicate: boolean;
  isOverride: boolean;
  checkedInAt: string;
}

// ---- Dashboard ----
export interface DashboardStats {
  totalCheckIns: number;
  totalPeopleInside: number;
  totalAdults: number;
  totalChildren: number;
  duplicatesBlocked: number;
  sessionStatus: string;
}

export interface TimelineSlot {
  time: string;
  count: number;
  people: number;
}

export interface ActivityLevel {
  level: "LOW" | "MODERATE" | "BUSY";
  description: string;
  recentCheckIns: number;
  totalToday: number;
}

// ---- Kitchen ----
export interface KitchenItem {
  id: number;
  name: string;
  status: "AVAILABLE" | "LOW" | "SOLD_OUT";
  sortOrder: number;
}

// ---- Guest Detail ----
export interface GuestDetail {
  id: number;
  name: string;
  guestType: "HOTEL" | "SPA" | "VIP" | "EXTERNAL";
  isChild: boolean;
  hasBreakfast: boolean;
  checkInDate: string;
  checkOutDate: string;
  notes: string | null;
  room: {
    id: number;
    roomNumber: string;
    floor: number;
    maxGuests: number;
  };
  roommates: {
    id: number;
    name: string;
    isChild: boolean;
  }[];
  checkIns: {
    id: number;
    adultCount: number;
    childCount: number;
    staffName: string;
    isDuplicate: boolean;
    checkedInAt: string;
  }[];
  totalCheckIns: number;
}

// ---- Spa Member ----
export interface SpaMember {
  id: number;
  memberId: string;
  name: string;
  phone: string | null;
  memberType: "SPA" | "VIP";
  isActive: boolean;
  validUntil: string | null;
  totalVisits: number;
}
