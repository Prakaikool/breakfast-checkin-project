"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  GripVertical,
  ImageIcon,
  ShieldAlert,
  BookOpen,
  UploadCloud,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import TopBar from "@/frontend/components/layout/TopBar";
import { useAuth } from "@/frontend/hooks/useAuth";

interface Section {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  sortOrder: number;
}

interface EditDraft {
  title: string;
  content: string;
  imageUrl: string;
}

// ─── Image with fallback ──────────────────────────────────────
function SectionImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-36 bg-[#f5f5f0] border border-[#e5e5e0] rounded-lg flex flex-col items-center justify-center gap-2 text-[#c0c0c0]">
        <ImageIcon size={24} />
        <span className="text-xs">Image could not be loaded</span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-[#e5e5e0]" style={{ minHeight: 160 }}>
      <Image
        src={src}
        alt={alt}
        width={900}
        height={500}
        className="w-full h-auto object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

// ─── Single section (view mode) ───────────────────────────────
function SectionCard({
  section,
  isAdmin,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  section: Section;
  isAdmin: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const preview = section.content.split("\n").filter(Boolean)[0] ?? "";

  return (
    <div className={`bg-white border border-[#e5e5e0] rounded-xl overflow-hidden transition-shadow ${open ? "shadow-sm" : ""}`}>
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-[#fafaf8] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Reorder handles (admin only) */}
        {isAdmin && isEditing && (
          <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-0.5 text-[#c0c0c0] hover:text-[#6b8a5e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-0.5 text-[#c0c0c0] hover:text-[#6b8a5e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
        {isAdmin && isEditing && <GripVertical size={14} className="text-[#d0d0d0] shrink-0" />}

        {/* Number badge */}
        <div className="w-7 h-7 rounded-full bg-[#e8efe5] flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-[#5a7a4e]">{section.sortOrder}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2d2d2d]">{section.title}</p>
          {!open && (
            <p className="text-xs text-[#9e9e9e] truncate mt-0.5">{preview}</p>
          )}
        </div>

        {/* Admin actions */}
        {isAdmin && isEditing && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="p-1.5 text-[#9e9e9e] hover:text-[#6b8a5e] hover:bg-[#e8efe5] rounded-lg transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-[#9e9e9e] hover:text-[#d45f5f] hover:bg-[#fdeeee] rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <ChevronDown
          size={16}
          className={`text-[#9e9e9e] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Expandable content */}
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-500 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 pb-5 border-t border-[#f0f0eb] pt-4">
          {/* Content text */}
          <p className="text-sm text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">
            {section.content}
          </p>

          {/* Image */}
          {section.imageUrl && (
            <div className="mt-4">
              <SectionImage src={section.imageUrl} alt={section.title} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────
function EditModal({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: EditDraft;
  onSave: (draft: EditDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<EditDraft>(initial);
  const [imageTab, setImageTab] = useState<"upload" | "url">(initial.imageUrl ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setDraft((d) => ({ ...d, imageUrl: data.data.url }));
      } else {
        setUploadError(data.error || "Upload failed.");
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e0] shrink-0">
          <p className="text-sm font-semibold text-[#2d2d2d]">
            {initial.title ? "Edit Section" : "Add Section"}
          </p>
          <button onClick={onCancel} className="text-[#9e9e9e] hover:text-[#2d2d2d] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">
              Section Title
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Check-In Procedure"
              className="w-full border border-[#e5e5e0] rounded-lg px-3 py-2.5 text-sm text-[#2d2d2d] placeholder-[#c0c0c0] focus:outline-none focus:border-[#6b8a5e] transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">
              Content
            </label>
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder={"Write detailed instructions here.\n\nUse blank lines to separate paragraphs.\n\nExample:\n1. Greet the guest warmly\n2. Ask for room number\n3. Verify breakfast eligibility\n4. Press Check-In"}
              rows={10}
              className="w-full border border-[#e5e5e0] rounded-lg px-3 py-2.5 text-sm text-[#2d2d2d] placeholder-[#c0c0c0] focus:outline-none focus:border-[#6b8a5e] transition-colors resize-y font-[inherit] leading-relaxed"
            />
            <p className="text-[11px] text-[#c0c0c0] mt-1">Line breaks and spacing are preserved when displayed.</p>
          </div>

          {/* Image */}
          <div>
            <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-2 block">
              Image <span className="font-normal normal-case text-[#c0c0c0]">(optional)</span>
            </label>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#f5f5f0] rounded-lg p-1 mb-3 w-fit">
              <button
                onClick={() => setImageTab("upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${imageTab === "upload" ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"}`}
              >
                <UploadCloud size={12} /> Upload file
              </button>
              <button
                onClick={() => setImageTab("url")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${imageTab === "url" ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#9e9e9e] hover:text-[#6b6b6b]"}`}
              >
                <LinkIcon size={12} /> Paste URL
              </button>
            </div>

            {imageTab === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                  dragOver ? "border-[#6b8a5e] bg-[#e8efe5]" : "border-[#e0e0da] hover:border-[#6b8a5e] hover:bg-[#f9faf8]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={onFileChange}
                />
                {uploading ? (
                  <>
                    <Loader2 size={24} className="text-[#6b8a5e] animate-spin" />
                    <p className="text-xs text-[#6b6b6b]">Uploading…</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={24} className="text-[#b0b0b0]" />
                    <p className="text-xs font-medium text-[#6b6b6b]">Click to choose or drag & drop</p>
                    <p className="text-[11px] text-[#c0c0c0]">JPEG, PNG, WebP, GIF - max 8 MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LinkIcon size={14} className="text-[#c0c0c0] shrink-0" />
                <input
                  type="url"
                  value={draft.imageUrl}
                  onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 border border-[#e5e5e0] rounded-lg px-3 py-2.5 text-sm text-[#2d2d2d] placeholder-[#c0c0c0] focus:outline-none focus:border-[#6b8a5e] transition-colors"
                />
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-[#d45f5f] mt-1.5 flex items-center gap-1">
                <X size={11} /> {uploadError}
              </p>
            )}

            {/* Preview */}
            {draft.imageUrl && !uploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] text-[#9e9e9e]">Preview</p>
                  <button
                    onClick={() => setDraft({ ...draft, imageUrl: "" })}
                    className="text-[11px] text-[#d45f5f] hover:underline flex items-center gap-0.5"
                  >
                    <X size={10} /> Remove
                  </button>
                </div>
                <SectionImage src={draft.imageUrl} alt="Preview" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e5e5e0] shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[#6b6b6b] border border-[#e5e5e0] rounded-lg hover:border-[#c0c0c0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={saving || uploading || !draft.title.trim() || !draft.content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] disabled:opacity-40 transition-colors"
          >
            <Check size={14} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────
export default function InstructionView() {
  const { staff } = useAuth();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = staff?.role === "ADMIN";

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/instructions");
    const data = await res.json();
    if (data.success) setSections(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!staff) return null;

  // ── handlers ──
  async function handleSave(draft: EditDraft) {
    setSaving(true);
    if (editTarget) {
      await fetch(`/api/instructions/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
    } else {
      await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
    }
    setSaving(false);
    setEditTarget(null);
    setShowAddModal(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this section?")) return;
    await fetch(`/api/instructions/${id}`, { method: "DELETE" });
    load();
  }

  async function handleMove(id: number, direction: "up" | "down") {
    await fetch(`/api/instructions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    load();
  }

  const modalOpen = showAddModal || editTarget !== null;

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      <TopBar title="Breakfast Check-In" subtitle="Staff guide and procedures" staff={staff} />

      {/* Page tab */}
      <div className="bg-white border-b border-[#e5e5e0] px-7">
        <div className="py-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#2d2d2d] border-b-2 border-[#6b8a5e] pb-2.5">
            Instructions
          </span>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 pb-1">
              {isEditing ? (
                <>
                  <button
                    onClick={() => { setShowAddModal(true); setEditTarget(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6b8a5e] rounded-lg hover:bg-[#5a7a4e] transition-colors"
                  >
                    <Plus size={13} /> Add Section
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6b6b6b] border border-[#e5e5e0] rounded-lg hover:border-[#c0c0c0] transition-colors"
                  >
                    <Check size={13} /> Done
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6b6b6b] border border-[#e5e5e0] rounded-lg hover:border-[#6b8a5e] hover:text-[#6b8a5e] transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-7 max-w-3xl">
        {/* Role banner */}
        {!isAdmin && (
          <div className="flex items-start gap-3 bg-white border border-[#e5e5e0] rounded-xl px-5 py-3.5 mb-5">
            <BookOpen size={16} className="text-[#6b8a5e] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6b6b6b] leading-relaxed">
              This is the staff instruction guide. Contact your hotel manager to request changes.
            </p>
          </div>
        )}

        {isAdmin && isEditing && (
          <div className="flex items-start gap-3 bg-[#e8efe5] border border-[#c8dfc2] rounded-xl px-5 py-3.5 mb-5">
            <ShieldAlert size={16} className="text-[#4a7a3d] shrink-0 mt-0.5" />
            <p className="text-xs text-[#4a7a3d] leading-relaxed">
              You are in edit mode. Changes are visible to all staff immediately after saving.
            </p>
          </div>
        )}

        {/* Sections list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#e5e5e0] animate-pulse shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-40 bg-[#e5e5e0] rounded animate-pulse" />
                  <div className="h-2.5 w-64 bg-[#eeeeea] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#e8efe5] flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-[#6b8a5e]" />
            </div>
            <p className="text-sm font-semibold text-[#2d2d2d] mb-1">No instructions yet</p>
            <p className="text-xs text-[#9e9e9e]">
              {isAdmin ? "Click \"Edit\" then \"Add Section\" to create the first instruction." : "No instructions have been added yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sections.map((section, i) => (
              <SectionCard
                key={section.id}
                section={section}
                isAdmin={isAdmin}
                isEditing={isEditing}
                onEdit={() => {
                  setEditTarget(section);
                  setShowAddModal(false);
                }}
                onDelete={() => handleDelete(section.id)}
                onMoveUp={() => handleMove(section.id, "up")}
                onMoveDown={() => handleMove(section.id, "down")}
                isFirst={i === 0}
                isLast={i === sections.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit / Add modal */}
      {modalOpen && (
        <EditModal
          initial={
            editTarget
              ? { title: editTarget.title, content: editTarget.content, imageUrl: editTarget.imageUrl ?? "" }
              : { title: "", content: "", imageUrl: "" }
          }
          onSave={handleSave}
          onCancel={() => { setEditTarget(null); setShowAddModal(false); }}
          saving={saving}
        />
      )}
    </div>
  );
}
