import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { getProductBySlug } from "@/lib/catalog.functions";
import { updateProduct } from "@/lib/product-admin.functions";
import {
  ChevronRight,
  Download,
  MessageCircle,
  ShoppingCart,
  CheckCircle2,
  X,
  Pencil,
  Save,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { useQuoteStore } from "@/lib/quote-store";
import { useAuth } from "@/lib/use-auth";
import { EditModeBar } from "@/components/site/EditOverlay";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState, useRef } from "react";

const q = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/catalog/$category/$product")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(q(params.product));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: `${loaderData?.product.name ?? "Product"} — ${loaderData?.brand?.name ?? "Alfa Tooling"} | CNC Spare Parts`,
      },
      {
        name: "description",
        content:
          loaderData?.product.short_description ??
          "Industrial spare part from Alfa Tooling Systems.",
      },
      { property: "og:title", content: `${loaderData?.product.name} | Alfa Tooling` },
      { property: "og:description", content: loaderData?.product.short_description ?? "" },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/catalog/${params.category}/${params.product}` },
      ...(loaderData?.product.image_urls?.[0]
        ? [{ property: "og:image" as const, content: loaderData.product.image_urls[0] }]
        : []),
    ],
    links: [{ rel: "canonical", href: `/catalog/${params.category}/${params.product}` }],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: loaderData.product.name,
              sku: loaderData.product.sku,
              description: loaderData.product.short_description,
              brand: loaderData.brand
                ? { "@type": "Brand", name: loaderData.brand.name }
                : undefined,
              image: loaderData.product.image_urls,
            }),
          },
        ]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const params = Route.useParams();
  const { data, refetch } = useSuspenseQuery(q(params.product));
  const addItem = useQuoteStore((s) => s.add);
  const { isEditor } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const doUpdate = useServerFn(updateProduct);
  const qc = useQueryClient();

  if (!data) return null;
  const { product, brand, category, parentCategory, related } = data;
  const specs = (product.specs ?? {}) as Record<string, string>;

  async function handleSave(patch: Record<string, any>) {
    try {
      await doUpdate({ data: { id: product.id!, data: patch } });
      await qc.invalidateQueries({ queryKey: ["product", params.product] });
      toast.success("Product updated!");
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Update failed");
    }
  }

  return (
    <SiteLayout productName={product.name}>
      {/* Edit mode bar for editors */}
      <EditModeBar productId={product.id ?? ""} onEdit={() => setEditOpen(true)} />

      {/* Breadcrumb */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-5">
          <nav className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-orange">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/catalog" className="hover:text-orange">
              Catalog
            </Link>
            <ChevronRight className="h-3 w-3" />
            {parentCategory && (
              <>
                <Link
                  to="/catalog/$category"
                  params={{ category: parentCategory.slug }}
                  className="hover:text-orange"
                >
                  {parentCategory.name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            {category && (
              <Link
                to="/catalog/$category"
                params={{ category: category.slug }}
                className="hover:text-orange"
              >
                {category.name}
              </Link>
            )}
          </nav>
        </div>
      </section>

      {/* Main product section */}
      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square border border-border rounded-lg overflow-hidden bg-secondary">
            {product.image_urls?.[0] && (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
            {!product.image_urls?.[0] && isEditor && (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Upload className="h-8 w-8" />
                <span className="text-sm">No image — click Edit to add</span>
              </div>
            )}
          </div>
          {(product.image_urls?.length ?? 0) > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.image_urls!.slice(0, 4).map((u: string, i: number) => (
                <div
                  key={i}
                  className="aspect-square border border-border rounded overflow-hidden bg-secondary"
                >
                  <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {/* Videos */}
          {(product.video_urls?.length ?? 0) > 0 && (
            <div className="mt-4 space-y-2">
              {product.video_urls!.map((url: string, i: number) => (
                <video key={i} controls className="w-full rounded border border-border" src={url} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {brand && (
            <div className="text-xs font-mono uppercase tracking-wider text-orange mb-2">
              {brand.name}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">{product.name}</h1>
          {product.sku && (
            <div className="mt-2 text-sm text-muted-foreground font-mono">SKU: {product.sku}</div>
          )}
          {product.price && (
            <div className="mt-3 text-2xl font-bold text-navy">
              {product.currency === "INR" ? "₹" : product.currency === "USD" ? "$" : "€"}
              {product.price.toLocaleString()}
            </div>
          )}
          <p className="mt-4 text-foreground leading-relaxed">{product.short_description}</p>

          {product.is_placeholder && (
            <div className="mt-4 rounded border border-orange/30 bg-orange/5 px-3 py-2 text-xs text-orange">
              Placeholder specifications — admin can edit this listing.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                addItem({
                  product_id: product.id,
                  product_name: product.name ?? "",
                  quantity: 1,
                  slug: product.slug,
                });
                toast.success("Added to quote basket");
              }}
              className="inline-flex items-center gap-2 rounded bg-orange px-5 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Quote
            </button>
            <a
              href={`https://wa.me/${process.env.ALFA_WHATSAPP ?? "919311788034"}?text=${encodeURIComponent(`Hello Hass Global Team, I am interested in ${product.name}. Please provide pricing and availability.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded border-2 border-navy bg-background px-5 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-navy-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
            </a>
            {product.datasheet_url && (
              <a
                href={product.datasheet_url}
                className="inline-flex items-center gap-2 rounded border border-border px-5 py-3 text-sm font-semibold hover:border-orange hover:text-orange"
              >
                <Download className="h-4 w-4" /> Datasheet
              </a>
            )}
            {isEditor && (
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded border-2 border-orange px-5 py-3 text-sm font-semibold text-orange hover:bg-orange hover:text-white transition-colors"
              >
                <Pencil className="h-4 w-4" /> Edit Product
              </button>
            )}
          </div>

          {/* Specs */}
          {Object.keys(specs).length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-navy mb-3">
                Technical Specifications
              </h2>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(specs).map(([k, v], i) => (
                      <tr key={k} className={i % 2 ? "bg-secondary" : ""}>
                        <td className="px-4 py-2 font-medium text-muted-foreground w-1/2">{k}</td>
                        <td className="px-4 py-2 text-foreground">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features / Applications / Machines */}
      <section className="container mx-auto px-4 pb-10 grid md:grid-cols-3 gap-6">
        {[
          { title: "Features & Benefits", items: product.features ?? [] },
          { title: "Applications", items: product.applications ?? [] },
          { title: "Compatible Machines", items: product.compatible_machines ?? [] },
        ].map(
          (b) =>
            b.items.length > 0 && (
              <div key={b.title} className="border border-border rounded-lg p-5 bg-card">
                <h3 className="font-display font-bold text-navy mb-3">{b.title}</h3>
                <ul className="space-y-2">
                  {b.items.map((it: string) => (
                    <li key={it} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-orange shrink-0 mt-0.5" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )}
      </section>

      {/* Long description */}
      {product.long_description && (
        <section className="container mx-auto px-4 pb-10">
          <div className="prose prose-sm max-w-3xl whitespace-pre-line text-foreground">
            {product.long_description}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && category && (
        <section className="container mx-auto px-4 py-10 border-t border-border">
          <h2 className="font-display text-2xl font-bold text-navy mb-6">Related Products</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <Link
                key={p.slug}
                to="/catalog/$category/$product"
                params={{ category: category.slug, product: p.slug }}
                className="border border-border rounded-lg overflow-hidden bg-card hover:border-orange transition-colors"
              >
                <div className="aspect-square bg-secondary">
                  {p.image_urls?.[0] && (
                    <img
                      src={p.image_urls[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm line-clamp-2 text-navy">{p.name}</div>
                  {p.price && (
                    <div className="text-xs text-orange font-semibold mt-1">
                      ₹{p.price.toLocaleString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Inline Edit Modal */}
      {editOpen && isEditor && (
        <ProductEditModal
          product={product}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
        />
      )}
    </SiteLayout>
  );
}

function ProductEditModal({
  product,
  onSave,
  onClose,
}: {
  product: any;
  onSave: (d: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name ?? "",
    sku: product.sku ?? "",
    short_description: product.short_description ?? "",
    long_description: product.long_description ?? "",
    price: product.price ?? "",
    currency: product.currency ?? "INR",
    image_urls: (product.image_urls ?? []) as string[],
    video_urls: (product.video_urls ?? []) as string[],
    features: (product.features ?? []).join("\n"),
    applications: (product.applications ?? []).join("\n"),
    compatible_machines: (product.compatible_machines ?? []).join("\n"),
    specs: product.specs
      ? Object.entries(product.specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "",
    is_published: product.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  function parseSpecs(raw: string): Record<string, string> {
    const r: Record<string, string> = {};
    raw.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) r[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return r;
  }

  async function handleUpload(files: FileList | null, type: "image" | "video") {
    if (!files?.length) return;
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
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name || undefined,
        sku: form.sku || undefined,
        short_description: form.short_description || undefined,
        long_description: form.long_description || undefined,
        price: form.price ? parseFloat(String(form.price)) : undefined,
        currency: form.currency || undefined,
        image_urls: form.image_urls.length ? form.image_urls : undefined,
        video_urls: form.video_urls.length ? form.video_urls : undefined,
        features: form.features ? form.features.split("\n").filter(Boolean) : undefined,
        applications: form.applications ? form.applications.split("\n").filter(Boolean) : undefined,
        compatible_machines: form.compatible_machines
          ? form.compatible_machines.split("\n").filter(Boolean)
          : undefined,
        specs: form.specs ? parseSpecs(form.specs) : undefined,
        is_published: form.is_published,
      });
    } finally {
      setSaving(false);
    }
  }

  const inp =
    "w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none";
  const lbl = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-background rounded-xl border border-border w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-xl z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Edit Product</h2>
            <p className="text-xs text-muted-foreground">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className={inp}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={inp}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Short Description</label>
            <textarea
              rows={2}
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Full Description</label>
            <textarea
              rows={4}
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
              className={inp}
            />
          </div>

          {/* Images */}
          <div>
            <label className={lbl}>Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.image_urls.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="h-16 w-16 rounded object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, j) => j !== i) }))
                    }
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                disabled={uploading}
                className="h-16 w-16 rounded border-2 border-dashed border-border hover:border-orange flex items-center justify-center text-muted-foreground hover:text-orange transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files, "image")}
            />
          </div>

          {/* Videos */}
          <div>
            <label className={lbl}>Videos</label>
            <div className="space-y-1 mb-2">
              {form.video_urls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 truncate text-muted-foreground">{url}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, video_urls: f.video_urls.filter((_, j) => j !== i) }))
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs hover:border-orange hover:text-orange"
            >
              <Upload className="h-3.5 w-3.5" /> Upload Video
            </button>
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files, "video")}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Features (one/line)</label>
              <textarea
                rows={4}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Applications (one/line)</label>
              <textarea
                rows={4}
                value={form.applications}
                onChange={(e) => setForm({ ...form, applications: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Machines (one/line)</label>
              <textarea
                rows={4}
                value={form.compatible_machines}
                onChange={(e) => setForm({ ...form, compatible_machines: e.target.value })}
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Specs (Key: Value per line)</label>
            <textarea
              rows={4}
              value={form.specs}
              onChange={(e) => setForm({ ...form, specs: e.target.value })}
              placeholder={"Flow Rate: 75 LPM\nPressure: 350 bar"}
              className={inp}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="accent-orange h-4 w-4"
            />
            <span className="text-sm font-medium">Published (visible on site)</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 rounded bg-orange px-5 py-2.5 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
