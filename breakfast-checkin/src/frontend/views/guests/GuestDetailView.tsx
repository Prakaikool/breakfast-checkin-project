"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import type { GuestDetail } from "@/types";

const GUEST_TYPE_LABEL: Record<string, string> = {
  HOTEL: "Hotel",
  SPA: "Spa",
  VIP: "VIP",
  EXTERNAL: "External",
};

const GUEST_TYPE_STYLE: Record<string, string> = {
  HOTEL: "bg-[#e8efe5] text-[#4a7a3d]",
  SPA: "bg-[#e5eff3] text-[#3d6a7a]",
  VIP: "bg-[#fff3e8] text-[#a05c1e]",
  EXTERNAL: "bg-[#f0f0eb] text-[#6b6b6b]",
};

function formatVisitDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function formatStayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GuestDetailView() {
  const { staff } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [guest, setGuest] = useState<GuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/guests/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setGuest(d.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (!staff) return null;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar
        title="Breakfast Check-In"
        subtitle="Guest profile"
        staff={staff}
      />

      <div className="bg-white border-b border-[#e5e5e0] px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Guest Detail
          </span>
        </div>
      </div>

      <div className="p-7">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#2d2d2d] mb-6 transition-colors"
        >
          ← Back
        </button>

        {loading && (
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-12 text-center text-sm text-[#9e9e9e]">
            Loading guest profile…
          </div>
        )}

        {notFound && !loading && (
          <div className="bg-white border border-[#e5e5e0] rounded-xl p-12 text-center">
            <p className="text-sm font-medium text-[#c04040] mb-1">Guest not found</p>
            <p className="text-xs text-[#9e9e9e]">This guest may have been removed or the link is invalid.</p>
          </div>
        )}

        {guest && (
          <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
            <div className="flex items-center gap-6 px-8 py-6 border-b border-[#e5e5e0]">
              <div className="w-16 h-16 rounded-full bg-[#e8efe5] flex items-center justify-center text-xl font-semibold text-[#4a7a3d] shrink-0">
                {guest.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-[#2d2d2d]">
                    {guest.name}
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${GUEST_TYPE_STYLE[guest.guestType]}`}>
                    {GUEST_TYPE_LABEL[guest.guestType]}
                  </span>
                  {guest.hasBreakfast && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#e8efe5] text-[#4a7a3d]">
                      Breakfast incl.
                    </span>
                  )}
                  {guest.isChild && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f0f0eb] text-[#9e9e9e]">
                      Child
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-[#e5e5e0] border-b border-[#e5e5e0]">
              <div className="px-8 py-5">
                <p className="text-xs text-[#9e9e9e] mb-1">Room</p>
                <p className="text-xl font-bold text-[#2d2d2d]">
                  {guest.room.roomNumber}
                </p>
                <p className="text-xs text-[#9e9e9e] mt-0.5">Floor {guest.room.floor}</p>
              </div>
              <div className="px-8 py-5">
                <p className="text-xs text-[#9e9e9e] mb-1">Total Visits</p>
                <p className="text-xl font-bold text-[#2d2d2d]">
                  {guest.totalCheckIns}
                </p>
                <p className="text-xs text-[#9e9e9e] mt-0.5">breakfast check-ins</p>
              </div>
              <div className="px-8 py-5">
                <p className="text-xs text-[#9e9e9e] mb-1">Arrival</p>
                <p className="text-base font-semibold text-[#2d2d2d]">
                  {formatStayDate(guest.checkInDate)}
                </p>
              </div>
              <div className="px-8 py-5">
                <p className="text-xs text-[#9e9e9e] mb-1">Departure</p>
                <p className="text-base font-semibold text-[#2d2d2d]">
                  {formatStayDate(guest.checkOutDate)}
                </p>
              </div>
            </div>

            {guest.roommates.length > 0 && (
              <div className="px-8 py-5 border-b border-[#e5e5e0]">
                <p className="text-sm font-semibold text-[#2d2d2d] mb-3">
                  Roommates
                </p>
                <div className="flex flex-wrap gap-2">
                  {guest.roommates.map((r) => (
                    <span
                      key={r.id}
                      className="flex items-center gap-1.5 text-sm text-[#2d2d2d] bg-[#f5f5f0] border border-[#e5e5e0] px-3 py-1 rounded-full"
                    >
                      {r.name}
                      {r.isChild && (
                        <span className="text-[10px] text-[#9e9e9e]">child</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {guest.notes && (
              <div className="px-8 py-5 border-b border-[#e5e5e0]">
                <p className="text-sm font-semibold text-[#2d2d2d] mb-1">Notes</p>
                <p className="text-sm text-[#6b6b6b]">{guest.notes}</p>
              </div>
            )}

            <div className="px-8 py-5">
              <p className="text-sm font-semibold text-[#2d2d2d] mb-4">
                Recent Breakfast Visits
              </p>

              {guest.checkIns.length === 0 ? (
                <p className="text-sm text-[#9e9e9e]">No check-ins recorded yet.</p>
              ) : (
                <div>
                  {guest.checkIns.map((ci, i) => (
                    <div key={ci.id}>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-[#2d2d2d]">
                          {formatVisitDate(ci.checkedInAt)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#9e9e9e]">
                            {ci.adultCount}a · {ci.childCount}c · by {ci.staffName}
                          </span>
                          {ci.isDuplicate && (
                            <span className="text-[10px] bg-[#fff3e8] text-[#a05c1e] border border-[#f5d9b8] px-2 py-0.5 rounded-full">
                              duplicate
                            </span>
                          )}
                        </div>
                      </div>
                      {i < guest.checkIns.length - 1 && (
                        <div className="h-px bg-[#f0f0eb]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
