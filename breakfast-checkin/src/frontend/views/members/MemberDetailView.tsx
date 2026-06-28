"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";

interface MemberDetail {
  id: number;
  memberId: string;
  name: string;
  phone: string | null;
  memberType: "SPA" | "VIP";
  isActive: boolean;
  validUntil: string | null;
  totalVisits: number;
  createdAt: string;
}

export default function MemberDetailView({ id }: { id: string }) {
  const { staff } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/spa/members/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMember(d.data);
        setLoading(false);
      });
  }, [id]);

  if (!staff) return null;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar
        title="Breakfast Check-In"
        subtitle="Member profile"
        staff={staff}
      />

      <div className="bg-white border-b border-[#e5e5e0] px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Member Detail
          </span>
        </div>
      </div>

      <div className="p-7 max-w-175">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#6b8a5e] hover:underline mb-5 inline-block"
        >
          ← Back to Members
        </button>

        {loading ? (
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-8 text-center text-sm text-[#9e9e9e]">
            Loading...
          </div>
        ) : !member ? (
          <div className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-8 text-center text-sm text-[#9e9e9e]">
            Member not found.
          </div>
        ) : (
          <>
            <div className="bg-white border border-[#e5e5e0] rounded-xl p-5 mb-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-xl font-semibold text-purple-700 shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#2d2d2d]">{member.name}</h2>
                <p className="text-sm text-[#6b6b6b]">{member.memberId}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${member.memberType === "VIP" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                    {member.memberType}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${member.isActive ? "bg-[#e8efe5] text-[#4a7a3d]" : "bg-[#fdeeee] text-[#c04040]"}`}>
                    {member.isActive ? "Active" : "Expired"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#2d2d2d] mb-4">Member Information</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#f0f0eb]">
                  <span className="text-sm text-[#6b6b6b]">Phone</span>
                  <span className="text-sm text-[#2d2d2d]">{member.phone ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f0f0eb]">
                  <span className="text-sm text-[#6b6b6b]">Total Visits</span>
                  <span className="text-sm font-semibold text-[#2d2d2d]">{member.totalVisits}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f0f0eb]">
                  <span className="text-sm text-[#6b6b6b]">Valid Until</span>
                  <span className="text-sm text-[#2d2d2d]">
                    {member.validUntil
                      ? new Date(member.validUntil).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[#6b6b6b]">Member Since</span>
                  <span className="text-sm text-[#2d2d2d]">
                    {new Date(member.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
