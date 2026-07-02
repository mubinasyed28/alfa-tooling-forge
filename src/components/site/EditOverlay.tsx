"use client";
import { useState, type ReactNode } from "react";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

interface EditOverlayProps {
  children: ReactNode;
  label?: string;
  onEdit: () => void;
  className?: string;
}

/** Wraps any element with an edit button overlay shown only to editors */
export function EditOverlay({
  children,
  label = "Edit",
  onEdit,
  className = "",
}: EditOverlayProps) {
  const { isEditor } = useAuth();
  if (!isEditor) return <>{children}</>;
  return (
    <div className={`relative group ${className}`}>
      {children}
      <button
        onClick={onEdit}
        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded bg-orange px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100 focus:opacity-100"
        title={label}
      >
        <Pencil className="h-3 w-3" /> {label}
      </button>
      <div className="absolute inset-0 border-2 border-dashed border-orange/30 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface InlineTextEditProps {
  value: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}

/** Click-to-edit inline text field (for editors only) */
export function InlineTextEdit({
  value,
  onSave,
  multiline = false,
  className = "",
  placeholder,
}: InlineTextEditProps) {
  const { isEditor } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  if (!isEditor) {
    return <span className={className}>{value}</span>;
  }

  if (!editing) {
    return (
      <span
        className={`relative group cursor-text border-b-2 border-transparent hover:border-orange/50 transition-colors ${className}`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        title="Click to edit"
      >
        {value || (
          <span className="text-muted-foreground/50 italic">{placeholder ?? "Click to edit"}</span>
        )}
        <Pencil className="inline h-3 w-3 text-orange/50 ml-1 opacity-0 group-hover:opacity-100" />
      </span>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex items-start gap-1 flex-wrap">
      {multiline ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className={`rounded border border-orange bg-background px-2 py-1 text-sm focus:outline-none ${className}`}
        />
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          className={`rounded border border-orange bg-background px-2 py-1 text-sm focus:outline-none ${className}`}
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-orange p-1 text-white disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="rounded border border-border p-1 hover:bg-secondary"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

interface EditModeBarProps {
  productId: string;
  onEdit: () => void;
}

/** Floating bar shown at the top when editor is viewing a product page */
export function EditModeBar({ productId, onEdit }: EditModeBarProps) {
  const { isEditor } = useAuth();
  if (!isEditor) return null;

  return (
    <div className="sticky top-16 z-30 bg-orange/95 backdrop-blur text-white px-4 py-2 flex items-center justify-between text-sm font-semibold shadow">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4" />
        <span>Editor Mode — You can edit this product</span>
      </div>
      <button
        onClick={onEdit}
        className="rounded bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs font-bold transition-colors"
      >
        Open Edit Panel
      </button>
    </div>
  );
}
