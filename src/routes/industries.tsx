import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { listIndustries } from "@/lib/catalog.functions";
import { useAuth } from "@/lib/use-auth";
import { createIndustry, updateIndustry, deleteIndustry } from "@/lib/industry.functions";
import { Factory, Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const q = queryOptions({ queryKey: ["industries"], queryFn: () => listIndustries() });

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industries Served | Automotive, Aerospace, Tool Rooms | Alfa Tooling" },
      {
        name: "description",
        content:
          "We serve automotive, aerospace, general and heavy engineering, precision machining and tool-room industries with CNC consumables and spares.",
      },
      { property: "og:title", content: "Industries Served | Alfa Tooling" },
      { property: "og:url", content: "/industries" },
    ],
    links: [{ rel: "canonical", href: "/industries" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Industries,
});

const EMPTY_INDUSTRY = {
  name: "",
  description: "",
  logo_url: "",
  sort_order: 0,
};

function Industries() {
  const { data: industries } = useSuspenseQuery(q);
  const { isEditor } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_INDUSTRY);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const doCreate = useServerFn(createIndustry);
  const doUpdate = useServerFn(updateIndustry);
  const doDelete = useServerFn(deleteIndustry);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        logo_url: form.logo_url || undefined,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editId) return doUpdate({ data: { id: editId, data: payload } });
      return doCreate({ data: payload });
    },
    onSuccess: () => {
      toast.success(editId ? "Industry updated!" : "Industry created!");
      setShowForm(false);
      setForm(EMPTY_INDUSTRY);
      qc.invalidateQueries({ queryKey: ["industries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Industry deleted");
      qc.invalidateQueries({ queryKey: ["industries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_INDUSTRY);
    setShowForm(true);
  }

  function openEdit(item: any) {
    setEditId(item.id);
    setForm({
      name: item.name ?? "",
      description: item.description ?? "",
      logo_url: item.logo_url ?? "",
      sort_order: item.sort_order ?? 0,
    });
    setShowForm(true);
  }

  async function handleLogoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setForm((f) => ({ ...f, logo_url: url }));
      toast.success("Logo uploaded!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

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
              Industries
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">
              Industries We Serve
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              We support various manufacturing sectors with specialized spare parts and maintenance
              services.
            </p>
          </div>
          {isEditor && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded bg-orange px-4 py-2.5 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Industry
            </button>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {industries.map((i) => (
          <div
            key={i.id}
            className="group relative border border-border rounded-xl p-6 bg-card hover:border-orange hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header Icon/Logo */}
              <div className="flex items-center justify-between mb-4">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary text-navy overflow-hidden border border-border">
                  {i.logo_url ? (
                    <img
                      src={i.logo_url}
                      alt={i.name}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Factory className="h-6 w-6" />
                  )}
                </div>

                {isEditor && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(i)}
                      className="p-1.5 rounded border border-border bg-background text-navy hover:text-orange hover:border-orange transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${i.name}"?`)) deleteMut.mutate(i.id);
                      }}
                      className="p-1.5 rounded border border-border bg-background text-red-500 hover:text-red-700 hover:border-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h2 className="font-display font-bold text-navy text-lg">{i.name}</h2>
              {i.description && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {i.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Editor Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background rounded-xl border border-border w-full max-w-md my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-xl z-10">
              <h2 className="font-display text-xl font-bold text-navy">
                {editId ? "Edit Industry / Client" : "Add Industry / Client"}
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
                <label className={labelCls}>Industry/Client Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Automotive Engineering"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief details about clients served..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className={inputCls}
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className={labelCls}>Logo (Image URL or upload) (Optional)</label>
                <div className="space-y-2">
                  {form.logo_url && (
                    <div className="flex items-center gap-2 border border-border p-2 rounded bg-muted/30">
                      <img
                        src={form.logo_url}
                        alt="Logo preview"
                        className="h-8 w-8 object-contain border border-border rounded"
                      />
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {form.logo_url}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      placeholder="Paste image URL..."
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:border-orange hover:text-orange whitespace-nowrap bg-background"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload Logo
                    </button>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files)}
                  />
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
                  disabled={saveMut.isPending || uploading || !form.name.trim()}
                  className="rounded bg-orange px-4 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saveMut.isPending ? "Saving..." : editId ? "Save Changes" : "Create Industry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
