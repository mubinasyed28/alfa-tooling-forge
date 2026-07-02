import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { useAuth } from "@/lib/use-auth";
import {
  listGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from "@/lib/gallery.functions";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Event Gallery | Alfa Tooling Systems" },
      {
        name: "description",
        content:
          "Explore photos and videos of our company events, awards, inaugurations, and exhibitions.",
      },
      { property: "og:title", content: "Event Gallery | Alfa Tooling" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

const EMPTY_EVENT = {
  title: "",
  category: "events",
  description: "",
  media_urls: [] as string[],
  external_url: "",
  date: "",
};

function GalleryPage() {
  const qc = useQueryClient();
  const { isEditor } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const doList = useServerFn(listGalleryItems);
  const doCreate = useServerFn(createGalleryItem);
  const doUpdate = useServerFn(updateGalleryItem);
  const doDelete = useServerFn(deleteGalleryItem);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gallery-items"],
    queryFn: () => doList({ data: undefined } as any),
  });

  const categories = ["All", ...Array.from(new Set(items.map((i: any) => i.category)))];

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((i: any) => i.category.toLowerCase() === selectedCategory.toLowerCase());

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        category: form.category.trim(),
        description: form.description || undefined,
        media_urls: form.media_urls,
        external_url: form.external_url || undefined,
        date: form.date || undefined,
      };
      if (editId) return doUpdate({ data: { id: editId, data: payload } });
      return doCreate({ data: payload });
    },
    onSuccess: () => {
      toast.success(editId ? "Event updated!" : "Event created!");
      setShowForm(false);
      setForm(EMPTY_EVENT);
      qc.invalidateQueries({ queryKey: ["gallery-items"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["gallery-items"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_EVENT);
    setShowForm(true);
  }

  function openEdit(item: any) {
    setEditId(item.id);
    setForm({
      title: item.title ?? "",
      category: item.category ?? "events",
      description: item.description ?? "",
      media_urls: item.media_urls ?? [],
      external_url: item.external_url ?? "",
      date: item.date ?? "",
    });
    setShowForm(true);
  }

  async function handleMediaUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        setForm((f) => ({ ...f, media_urls: [...f.media_urls, url] }));
      }
      toast.success("Uploaded successfully!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const isVideo = (url: string) => {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    return ext && ["mp4", "webm", "ogg", "mov"].includes(ext);
  };

  const inputCls =
    "w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none";
  const labelCls =
    "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">
              Moments &amp; Milestone Gallery
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">Event Gallery</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              A glimpse into our company milestones, inaugurations, exhibitions, and achievements.
            </p>
          </div>
          {isEditor && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded bg-orange px-4 py-2.5 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Event
            </button>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-6 border-b border-border">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-orange text-orange-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="container mx-auto px-4 py-12">
        {isLoading && (
          <div className="text-center text-muted-foreground py-12">Loading gallery...</div>
        )}
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No events found in this category.
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item: any) => (
            <div
              key={item.id}
              className="border border-border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Media Container */}
                <div className="relative aspect-video bg-secondary overflow-hidden border-b border-border">
                  {item.media_urls?.[0] ? (
                    isVideo(item.media_urls[0]) ? (
                      <video
                        src={item.media_urls[0]}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.media_urls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No media available
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-navy/80 text-navy-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {item.category}
                  </span>

                  {isEditor && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded bg-white/95 text-navy hover:text-orange shadow transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.title}"?`)) deleteMut.mutate(item.id);
                        }}
                        className="p-1.5 rounded bg-white/95 text-red-500 hover:text-red-700 shadow transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {item.date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5 text-orange" />
                      {new Date(item.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}
                  <h3 className="font-display text-lg font-bold text-navy line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.external_url && (
                <div className="p-5 pt-0 border-t border-border/50 mt-4">
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline pt-3"
                  >
                    Read More <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Editor Event Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background rounded-xl border border-border w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-xl z-10">
              <h2 className="font-display text-xl font-bold text-navy">
                {editId ? "Edit Gallery Event" : "Add Gallery Event"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="grid h-8 w-8 place-items-center rounded hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className={labelCls}>Event Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Dealer Meet 2026"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category *</label>
                  {!isAddingCat ? (
                    <div className="space-y-1">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className={inputCls}
                      >
                        <option value="events">Events</option>
                        <option value="awards">Awards</option>
                        <option value="inauguration">Inauguration</option>
                        <option value="exhibitions">Exhibitions</option>
                        {Array.from(new Set(items.map((i: any) => i.category)))
                          .filter(
                            (c: any) =>
                              !["events", "awards", "inauguration", "exhibitions"].includes(
                                c.toLowerCase(),
                              ),
                          )
                          .map((c: any) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsAddingCat(true)}
                        className="text-[10px] text-orange hover:underline font-semibold"
                      >
                        + Add new category
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className={inputCls}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newCatName.trim()) {
                              setForm({ ...form, category: newCatName.trim() });
                              setIsAddingCat(false);
                              setNewCatName("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCatName.trim()) {
                            setForm({ ...form, category: newCatName.trim() });
                            setIsAddingCat(false);
                            setNewCatName("");
                          }
                        }}
                        className="px-2 py-1.5 text-xs font-semibold bg-orange text-orange-foreground rounded hover:opacity-90"
                      >
                        Ok
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCat(false);
                          setNewCatName("");
                        }}
                        className="px-2 py-1.5 text-xs font-semibold border border-border rounded hover:bg-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Event Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Add a short summary of the event..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>External Link URL</label>
                <input
                  value={form.external_url}
                  onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  placeholder="e.g. Press release link, YouTube link, etc."
                  className={inputCls}
                />
              </div>

              {/* Media Upload */}
              <div>
                <label className={labelCls}>Media Files (Images/Videos) *</label>
                <div className="space-y-2">
                  {form.media_urls.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 border border-border p-1.5 rounded bg-muted/30"
                    >
                      {isVideo(url) ? (
                        <Video className="h-4 w-4 text-orange" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-navy" />
                      )}
                      <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            media_urls: f.media_urls.filter((_, j) => j !== i),
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input
                      placeholder="Paste media URL or upload a file..."
                      className={`${inputCls} flex-1`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setForm((f) => ({ ...f, media_urls: [...f.media_urls, val] }));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:border-orange hover:text-orange whitespace-nowrap bg-background"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload File
                    </button>
                  </div>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMediaUpload(e.target.files)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Press Enter to add pasted URL, or click Upload to select files.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMut.isPending || uploading || form.media_urls.length === 0}
                  className="rounded bg-orange px-4 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saveMut.isPending ? "Saving..." : editId ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
