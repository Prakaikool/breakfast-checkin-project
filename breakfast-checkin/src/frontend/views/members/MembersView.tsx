"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Star, Diamond, ChevronRight, X } from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";
import type { SpaMember } from "@/types";

type FilterType = "all" | "VIP" | "SPA";
type FilterStatus = "all" | "active" | "expired";

interface FormState {
  name: string;
  phone: string;
  memberType: "SPA" | "VIP";
  validUntil: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  memberType: "SPA",
  validUntil: "",
};

function AddMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (m: SpaMember) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFieldError("Name is required.");
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/spa/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          memberType: form.memberType,
          validUntil: form.validUntil || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setFieldError(json.error ?? "Failed to create member.");
        return;
      }
      onCreated(json.data);
    } catch {
      setFieldError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-105 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e0]">
          <h2 className="text-sm font-semibold text-[#2d2d2d]">Add New Member</h2>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#2d2d2d] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Member type toggle */}
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">Member Type</label>
            <div className="flex gap-2">
              {(["SPA", "VIP"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("memberType", t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    form.memberType === t
                      ? t === "SPA"
                        ? "bg-[#f3eef8] border-[#c4a8e0] text-[#6a3e8a]"
                        : "bg-[#fff3e8] border-[#f0c896] text-[#a05c1e]"
                      : "bg-white border-[#e5e5e0] text-[#9e9e9e] hover:border-[#c0c0c0]"
                  }`}
                >
                  {t === "SPA" ? "♦ SPA" : "★ VIP"}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">
              Full Name <span className="text-[#c04040]">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Somchai Jaidee"
              className="w-full px-3.5 py-2.5 bg-white border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e]"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. 066-123-4567"
              className="w-full px-3.5 py-2.5 bg-white border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e]"
            />
          </div>

          {/* Valid until */}
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1.5">Membership Valid Until (optional)</label>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) => set("validUntil", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e]"
            />
            <p className="text-[11px] text-[#9e9e9e] mt-1">Leave blank for no expiry</p>
          </div>

          {/* Error */}
          {fieldError && (
            <p className="text-xs text-[#c04040] bg-[#fdeeee] border border-[#f5c0c0] rounded-lg px-3 py-2">
              {fieldError}
            </p>
          )}

          {/* Auto-generated ID note */}
          <p className="text-[11px] text-[#9e9e9e]">
            Member ID will be generated automatically (e.g. SPA-20250421-A3F9)
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#e5e5e0] text-sm text-[#6b6b6b] hover:bg-[#f5f5f0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#6b8a5e] text-white text-sm font-semibold hover:bg-[#5a7a4e] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MembersView() {
  const { staff } = useAuth();
  const [members, setMembers] = useState<SpaMember[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addedBanner, setAddedBanner] = useState("");

  useEffect(() => {
    fetch("/api/spa/members")
      .then((r) => r.json())
      .then((d) => { if (d.success) setMembers(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (!staff) return null;

  function handleCreated(newMember: SpaMember) {
    setMembers((prev) => [newMember, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
    setAddedBanner(`${newMember.name} (${newMember.memberId}) added successfully.`);
    setTimeout(() => setAddedBanner(""), 4000);
  }

  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase();
      return !q || m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q);
    })
    .filter((m) => filterType === "all" || m.memberType === filterType)
    .filter((m) => {
      if (filterStatus === "active") return m.isActive;
      if (filterStatus === "expired") return !m.isActive;
      return true;
    });

  const vipCount = members.filter((m) => m.memberType === "VIP").length;
  const spaCount = members.filter((m) => m.memberType === "SPA").length;
  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="Spa and VIP members" staff={staff} />

      <div className="bg-white border-b border-[#e5e5e0] px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">Members</span>
        </div>
      </div>

      <div className="p-7">
        {/* Success banner */}
        {addedBanner && (
          <div className="flex items-center gap-2 bg-[#e8efe5] border border-[#b8d4b0] text-[#4a7a3d] text-sm px-4 py-2.5 rounded-lg mb-4">
            <span className="text-base">✓</span>
            {addedBanner}
          </div>
        )}

        {/* Summary + Add button */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-[#fff3e8] px-3 py-1.5 rounded-full">
            <Star size={11} className="text-[#a05c1e]" />
            <span className="text-xs font-semibold text-[#a05c1e]">{vipCount} VIP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#f3eef8] px-3 py-1.5 rounded-full">
            <Diamond size={11} className="text-[#6a3e8a]" />
            <span className="text-xs font-semibold text-[#6a3e8a]">{spaCount} SPA</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#e8efe5] px-3 py-1.5 rounded-full">
            <span className="text-xs font-semibold text-[#4a7a3d]">{activeCount} Active</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#6b8a5e] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#5a7a4e] transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Member
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or member ID…"
            className="flex-1 max-w-sm px-4 py-2.5 bg-white border border-[#e5e5e0] rounded-lg text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e]"
          />

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-[#f0f0eb] rounded-lg p-1">
            {(["all", "VIP", "SPA"] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterType === t ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"}`}
              >
                {t === "all" ? "All types" : t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-[#f0f0eb] rounded-lg p-1">
            {(["all", "active", "expired"] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${filterStatus === s ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_110px_80px_90px_60px_40px] gap-4 px-5 py-3 border-b border-[#e5e5e0] bg-[#f9f9f7]">
            {["Name", "Member ID", "Type", "Status", "Visits", ""].map((h) => (
              <span key={h} className="text-xs font-semibold text-[#9e9e9e] uppercase tracking-wide">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#9e9e9e]">Loading members…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-[#9e9e9e]">No members match your search.</p>
              {(search || filterType !== "all" || filterStatus !== "all") && (
                <button onClick={() => { setSearch(""); setFilterType("all"); setFilterStatus("all"); }} className="mt-2 text-xs text-[#6b8a5e] hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_110px_80px_90px_60px_40px] gap-4 px-5 py-3.5 border-b border-[#f0f0eb] last:border-0 items-center hover:bg-[#fafaf8] transition-colors"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    member.memberType === "VIP" ? "bg-[#fff3e8] text-[#a05c1e]" : "bg-[#f3eef8] text-[#6a3e8a]"
                  }`}>
                    {member.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-[#2d2d2d] truncate">{member.name}</span>
                </div>

                {/* Member ID */}
                <span className="text-xs text-[#9e9e9e] font-mono">{member.memberId}</span>

                {/* Type */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                  member.memberType === "VIP"
                    ? "bg-[#fff3e8] text-[#a05c1e]"
                    : "bg-[#f3eef8] text-[#6a3e8a]"
                }`}>
                  {member.memberType}
                </span>

                {/* Status */}
                <span className={`flex items-center gap-1.5 text-xs font-medium ${
                  member.isActive ? "text-[#4a7a3d]" : "text-[#c04040]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${member.isActive ? "bg-[#4a7a3d]" : "bg-[#c04040]"}`} />
                  {member.isActive ? "Active" : "Expired"}
                </span>

                {/* Visits */}
                <span className="text-sm font-semibold text-[#2d2d2d]">{member.totalVisits}</span>

                {/* Arrow */}
                <Link href={`/members/${member.id}`} className="text-[#9e9e9e] hover:text-[#6b8a5e] transition-colors"><ChevronRight size={16} /></Link>
              </div>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-[#9e9e9e] mt-3 text-right">{filtered.length} of {members.length} members</p>
        )}
      </div>

      {/* Add member modal */}
      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
