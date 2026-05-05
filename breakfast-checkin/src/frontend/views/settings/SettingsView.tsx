"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-[#6b8a5e]" : "bg-[#d0d0d0]"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-5.5" : "left-0.5"}`}
      />
    </button>
  );
}

function EditableRow({
  label, value, onSave,
}: { label: string; value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-[#6b6b6b]">{label}</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus
              className="w-32 px-2 py-1 text-sm border border-[#6b8a5e] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 text-[#2d2d2d]"
            />
            <button onClick={save} className="text-xs font-semibold text-[#4a7a3d] hover:underline">Save</button>
            <button onClick={cancel} className="text-xs text-[#9e9e9e] hover:underline">Cancel</button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-[#2d2d2d]">{draft}</span>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#6b8a5e] hover:underline"
            >
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsView() {
  const { staff, logout } = useAuth();
  const router = useRouter();

  const [blockDuplicates, setBlockDuplicates] = useState(true);
  const [soundOnCheckIn, setSoundOnCheckIn] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  const [breakfastHours, setBreakfastHours] = useState("07:00 – 10:30");
  const [maxGuests, setMaxGuests] = useState("4");
  const [ageLimit, setAgeLimit] = useState("Under 12");
  const [saved, setSaved] = useState(false);

  if (!staff) return null;

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
    setter(!val);
    showSaved();
  };

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="System configuration" staff={staff} />

      <div className="bg-white border-b border-[#e5e5e0] px-7">
        <div className="py-2">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">Settings</span>
        </div>
      </div>

      <div className="p-7 max-w-175">

        {/* Saved flash */}
        {saved && (
          <div className="bg-[#e8efe5] border border-[#b8d4b0] text-[#4a7a3d] text-sm px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Preference saved
          </div>
        )}

        {/* Check-in Rules */}
        <div className="bg-white border border-[#e5e5e0] rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#2d2d2d] mb-4">Check-in rules</h3>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[#2d2d2d]">Block duplicate check-in</p>
              <p className="text-xs text-[#9e9e9e] mt-0.5">Prevent same room checking in twice</p>
            </div>
            <Toggle on={blockDuplicates} onChange={() => handleToggle(setBlockDuplicates, blockDuplicates)} />
          </div>

          <div className="h-px bg-[#f0f0eb]" />

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[#2d2d2d]">Sound on check-in</p>
              <p className="text-xs text-[#9e9e9e] mt-0.5">Play confirmation sound</p>
            </div>
            <Toggle on={soundOnCheckIn} onChange={() => handleToggle(setSoundOnCheckIn, soundOnCheckIn)} />
          </div>

          <div className="h-px bg-[#f0f0eb]" />

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[#2d2d2d]">Auto logout (15 min)</p>
              <p className="text-xs text-[#9e9e9e] mt-0.5">Log out after inactivity</p>
            </div>
            <Toggle on={autoLogout} onChange={() => handleToggle(setAutoLogout, autoLogout)} />
          </div>
        </div>

        {/* Breakfast Rules */}
        <div className="bg-white border border-[#e5e5e0] rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#2d2d2d] mb-2">Breakfast rules</h3>
          <div className="divide-y divide-[#f0f0eb]">
            <EditableRow label="Breakfast hours" value={breakfastHours} onSave={(v) => { setBreakfastHours(v); showSaved(); }} />
            <EditableRow label="Max guests per room" value={maxGuests} onSave={(v) => { setMaxGuests(v); showSaved(); }} />
            <EditableRow label="Children age limit" value={ageLimit} onSave={(v) => { setAgeLimit(v); showSaved(); }} />
          </div>
        </div>

        {/* User settings */}
        <div className="bg-white border border-[#e5e5e0] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#2d2d2d] mb-4">User settings</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-[#e8efe5] flex items-center justify-center text-lg font-bold text-[#4a7a3d] shrink-0">
              {staff.name.charAt(0)}
            </div>
            <div>
              <p className="text-base font-semibold text-[#2d2d2d]">{staff.name}</p>
              <p className="text-sm text-[#9e9e9e]">{staff.role}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#f5f5f0] border border-[#e5e5e0] text-sm font-medium text-[#2d2d2d] rounded-lg hover:bg-[#eceee8] transition-colors">
              Change PIN
            </button>
            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              className="px-4 py-2 bg-[#fdeeee] text-sm font-medium text-[#c04040] rounded-lg hover:bg-[#f9dddd] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {/* App info */}
        <div className="mt-5 text-center text-xs text-[#c0c0c0]">
          Breakfast Check-In · v0.1.0
        </div>
      </div>
    </div>
  );
}
