import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import {
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  listBrandsAdmin,
} from "@/lib/product-admin.functions";
import { Plus, Pencil, Trash2, X, Upload, Video, Image as ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

const EMPTY_FORM = {
  name: "", slug: "", sku: "", short_description: "", long_description: "",
  price: "", currency: "INR",
  image_urls: [] as string[], video_urls: [] as string[], datasheet_url: "",
  category_id: "", brand_id: "",
  features: "", applications: "", compatible_machines: "",
  specs: "", is_published: true, is_placeholder: false,
};

function ProductsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const doList = useServerFn(listAllProducts);
  const doCreate = useServerFn(createProduct);
  const doUpdate = useServerFn(updateProduct);
  const doDelete = useServerFn(deleteProduct);
  const doListCats = useServerFn(listCategories);
  const doListBrands = useServerFn(listBrandsAdmin);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: () => doList({ data: { q: q || undefined } }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => doListCats({ data: undefined } as any),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => doListBrands({ data: undefined } as any),
  });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      name: p.name ?? "", slug: p.slug ?? "", sku: p.sku ?? "",
      short_description: p.short_description ?? "",
      long_description: p.long_description ?? "",
      price: p.price ?? "", currency: p.currency ?? "INR",
      image_urls: p.image_urls ?? [], video_urls: p.video_urls ?? [],
      datasheet_url: p.datasheet_url ?? "",
      category_id: p.category_id ?? "", brand_id: p.brand_id ?? "",
      features: (p.features ?? []).join("\n"),
      applications: (p.applications ?? []).join("\n"),
      compatible_machines: (p.compatible_machines ?? []).join("\n"),
      specs: p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join("\n") : "",
      is_published: p.is_published ?? true,
      is_placeholder: p.is_placeholder ?? false,
    });
    setShowForm(true);
  }

  function parseSpecs(raw: string): Record<string, string> {
    const result: Record<string, string> = {};
    raw.split("\n").forEach((line) => {
      const idx = line.indexOf(":");
      if (idx > 0) { result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim(); }
    });
    return result;
  }

  function buildPayload() {
    return {
      name: form.name || undefined,
      slug: form.slug || undefined,
      sku: form.sku || undefined,
      short_description: form.short_description || undefined,
      long_description: form.long_description || undefined,
      price: form.price ? parseFloat(String(form.price)) : undefined,
      currency: form.currency || undefined,
      image_urls: form.image_urls.length ? form.image_urls : undefined,
      video_urls: form.video_urls.length ? form.video_urls : undefined,
      datasheet_url: form.datasheet_url || undefined,
      category_id: form.category_id || undefined,
      brand_id: form.brand_id || undefined,
      features: form.features ? form.features.split("\n").filter(Boolean) : undefined,
      applications: form.applications ? form.applications.split("\n").filter(Boolean) : undefined,
      compatible_machines: form.compatible_machines ? form.compatible_machines.split("\n").filter(Boolean) : undefined,
      specs: form.specs ? parseSpecs(form.specs) : undefined,
      is_published: form.is_published,
      is_placeholder: form.is_placeholder,
    };
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editId) return doUpdate({ data: { id: editId, data: payload } });
      return doCreate({ data: payload });
    },
    onSuccess: () => {
      toast.success(editId ? "Product updated!" : "Product created!");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => { toast.success("Product deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  async function handleFileUpload(files: FileList | null, type: "image" | "video") {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        if (type === "image") setForm((f) => ({ ...f, image_urls: [...f.image_urls, url] }));
        else setForm((f) => ({ ...f, video_urls: [...f.video_urls, url] }));
      }
      toast.success("Uploaded!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const inputCls = "w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-navy" />
          <h1 className="font-display text-2xl font-bold text-navy">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded border border-input bg-background px-3 py-2 text-sm w-52"
          />
          <button onClick={openCreate} className="flex items-center gap-2 rounded bg-orange px-4 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Product table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3 hidden md:table-cell">SKU</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>}
            {(products as any[]).length === 0 && !isLoading && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found. Click "Add Product" to create one.</td></tr>
            )}
            {(products as any[]).map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                <td className="p-3 font-medium max-w-[200px] truncate">{p.name || "(unnamed)"}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{p.sku || "—"}</td>
                <td className="p-3">
                  <span className={`text-xs rounded px-2 py-0.5 ${p.is_published ? "bg-green-100 text-green-800" : "bg-secondary text-muted-foreground"}`}>
                    {p.is_published ? "Published" : "Draft"}
                  </span>
                  {p.is_placeholder && <span className="ml-2 text-xs rounded px-2 py-0.5 bg-orange/10 text-orange">Placeholder</span>}
                </td>
                <td className="p-3 text-sm">{p.price ? `₹${p.price}` : "—"}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-orange hover:text-orange">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${p.name}"? This cannot be undone.`)) deleteMut.mutate(p.id); }}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background rounded-xl border border-border w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-xl font-bold text-navy">{editId ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setShowForm(false)} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="p-6 space-y-5">
              <p className="text-xs text-muted-foreground bg-secondary/50 rounded px-3 py-2">All fields are optional — fill in what you have.</p>

              {/* Basic Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Product Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pall HC9601FUS8H" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>SKU / Part No.</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. HC9601FUS8H" className={inputCls} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>URL Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Datasheet URL</label>
                  <input value={form.datasheet_url} onChange={(e) => setForm({ ...form, datasheet_url: e.target.value })} placeholder="https://..." className={inputCls} />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Price</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1500" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
                    <option value="">— Select category —</option>
                    {(categories as any[]).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Brand</label>
                  <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className={inputCls}>
                    <option value="">— Select brand —</option>
                    {(brands as any[]).map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className={labelCls}>Short Description</label>
                <textarea rows={2} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="1-2 sentence summary" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea rows={4} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} placeholder="Detailed product description..." className={inputCls} />
              </div>

              {/* Media Upload */}
              <div>
                <label className={labelCls}>Images</label>
                <div className="space-y-2">
                  {form.image_urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={url} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      placeholder="Paste image URL..."
                      className={`${inputCls} flex-1`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) { setForm((f) => ({ ...f, image_urls: [...f.image_urls, val] })); (e.target as HTMLInputElement).value = ""; }
                        }
                      }}
                    />
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:border-orange hover:text-orange">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </button>
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, "image")} />
                  <p className="text-xs text-muted-foreground">Press Enter to add URL, or upload a file. Accepts JPG, PNG, WebP.</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Videos</label>
                <div className="space-y-2">
                  {form.video_urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-orange shrink-0" />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, video_urls: f.video_urls.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      placeholder="Paste video URL (YouTube, direct, etc.)..."
                      className={`${inputCls} flex-1`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) { setForm((f) => ({ ...f, video_urls: [...f.video_urls, val] })); (e.target as HTMLInputElement).value = ""; }
                        }
                      }}
                    />
                    <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-xs hover:border-orange hover:text-orange">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </button>
                  </div>
                  <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, "video")} />
                </div>
              </div>

              {/* List fields */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Features (one per line)</label>
                  <textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"High flow rate\nLong service life"} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Applications (one per line)</label>
                  <textarea rows={4} value={form.applications} onChange={(e) => setForm({ ...form, applications: e.target.value })} placeholder={"CNC machining centers\nHydraulic systems"} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Compatible Machines (one per line)</label>
                  <textarea rows={4} value={form.compatible_machines} onChange={(e) => setForm({ ...form, compatible_machines: e.target.value })} placeholder={"Mazak VTC-300C\nFanuc 30i"} className={inputCls} />
                </div>
              </div>

              {/* Specs */}
              <div>
                <label className={labelCls}>Technical Specifications (Key: Value, one per line)</label>
                <textarea rows={4} value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} placeholder={"Flow Rate: 75 LPM\nPressure: 350 bar\nFilter Rating: 10 micron"} className={inputCls} />
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="accent-orange h-4 w-4" />
                  <span className="text-sm font-medium">Published (visible on site)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_placeholder} onChange={(e) => setForm({ ...form, is_placeholder: e.target.checked })} className="accent-orange h-4 w-4" />
                  <span className="text-sm font-medium text-muted-foreground">Placeholder</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={saveMut.isPending || uploading} className="rounded bg-orange px-5 py-2.5 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50">
                  {saveMut.isPending ? "Saving..." : editId ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
