import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { getCategoryBySlug } from "@/lib/catalog.functions";
import { ChevronRight, ShoppingCart, X } from "lucide-react";
import { useQuoteStore } from "@/lib/quote-store";
import { toast } from "sonner";
import { useState } from "react";

const catQ = (slug: string) => queryOptions({ queryKey: ["category", slug], queryFn: () => getCategoryBySlug({ data: { slug } }) });

export const Route = createFileRoute("/catalog/$category")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(catQ(params.category));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? "Category"} — CNC Spare Parts | Alfa Tooling` },
      { name: "description", content: loaderData?.category.description ?? "Industrial spare parts and tooling from Alfa Tooling Systems." },
      { property: "og:title", content: `${loaderData?.category.name} | Alfa Tooling` },
      { property: "og:url", content: `/catalog/${loaderData?.category.slug}` },
    ],
    links: [{ rel: "canonical", href: `/catalog/${loaderData?.category.slug}` }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(catQ(params.category));
  const addItem = useQuoteStore((s) => s.add);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  if (!data) return null;

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-8">
          <nav className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
            <Link to="/" className="hover:text-orange">Home</Link><ChevronRight className="h-3 w-3" />
            <Link to="/catalog" className="hover:text-orange">Catalog</Link><ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{data.category.name}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">{data.category.name}</h1>
          {data.category.description && <p className="mt-2 text-muted-foreground max-w-2xl">{data.category.description}</p>}
        </div>
      </section>

      {data.children.length > 0 && (
        <section className="container mx-auto px-4 pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-orange mb-4">Sub-categories</h2>
          <div className="flex flex-wrap gap-2">
            {data.children.map((c) => (
              <Link key={c.id} to="/catalog/$category" params={{ category: c.slug }} className="rounded border border-border bg-card px-4 py-2 text-sm font-medium hover:border-orange hover:text-orange transition-colors">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-orange mb-4">Products ({data.products.length})</h2>
        {data.products.length === 0 ? (
          <p className="text-muted-foreground">No products listed yet. <Link to="/contact" className="text-orange underline">Contact us</Link> for availability.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.products.map((p) => (
              <div key={p.id} className="group border border-border rounded-lg overflow-hidden bg-card hover:border-orange hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <button 
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className="block w-full aspect-square bg-secondary overflow-hidden text-left focus:outline-none cursor-pointer"
                  >
                    {p.image_urls?.[0] ? (
                      <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-muted">No Image</div>
                    )}
                  </button>
                  <div className="p-4 pb-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{p.sku || "NO SKU"}</div>
                    <button 
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className="font-display font-bold text-navy mt-1 line-clamp-2 hover:text-orange text-left w-full focus:outline-none cursor-pointer"
                    >
                      {p.name}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                  </div>
                </div>
                <div className="p-4 pt-0 space-y-2">
                  <button 
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className="text-xs text-orange hover:underline font-semibold block text-center py-1 w-full focus:outline-none cursor-pointer"
                  >
                    Show Detailed Description
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addItem({ product_id: p.id, product_name: p.name ?? "", quantity: 1, slug: p.slug });
                      toast.success("Added to quote basket");
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-orange py-2 text-xs font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background rounded-xl border border-border w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-xl z-10">
              <div>
                <h2 className="font-display text-xl font-bold text-navy">{selectedProduct.name}</h2>
                {selectedProduct.sku && <p className="text-xs text-muted-foreground font-mono">SKU: {selectedProduct.sku}</p>}
              </div>
              <button onClick={() => setSelectedProduct(null)} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Media */}
              <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-border">
                {selectedProduct.image_urls?.[0] ? (
                  <img src={selectedProduct.image_urls[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-muted">No Image Available</div>
                )}
              </div>

              {/* Product Price */}
              {selectedProduct.price && (
                <div className="text-2xl font-bold text-navy">
                  {selectedProduct.currency === "INR" ? "₹" : selectedProduct.currency === "USD" ? "$" : "€"}
                  {selectedProduct.price.toLocaleString()}
                </div>
              )}

              {/* Descriptions */}
              <div className="space-y-4">
                {selectedProduct.short_description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Description</h3>
                    <p className="mt-1 text-sm text-foreground">{selectedProduct.short_description}</p>
                  </div>
                )}
                {selectedProduct.long_description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Description</h3>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-line leading-relaxed">{selectedProduct.long_description}</p>
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Technical Specifications</h3>
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <tbody>
                        {Object.entries(selectedProduct.specs).map(([k, v], idx) => (
                          <tr key={k} className={idx % 2 ? "bg-secondary" : ""}>
                            <td className="px-3 py-1.5 font-medium text-muted-foreground w-1/2">{k}</td>
                            <td className="px-3 py-1.5 text-foreground">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Features, Applications, Compatible Machines */}
              <div className="grid sm:grid-cols-3 gap-4">
                {selectedProduct.features && selectedProduct.features.length > 0 && (
                  <div className="border border-border rounded p-3 bg-secondary/30">
                    <h4 className="text-xs font-bold text-navy mb-1.5">Features</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      {selectedProduct.features.map((f: string) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {selectedProduct.applications && selectedProduct.applications.length > 0 && (
                  <div className="border border-border rounded p-3 bg-secondary/30">
                    <h4 className="text-xs font-bold text-navy mb-1.5">Applications</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      {selectedProduct.applications.map((a: string) => <li key={a}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {selectedProduct.compatible_machines && selectedProduct.compatible_machines.length > 0 && (
                  <div className="border border-border rounded p-3 bg-secondary/30">
                    <h4 className="text-xs font-bold text-navy mb-1.5">Compatible Machines</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      {selectedProduct.compatible_machines.map((m: string) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border sticky bottom-0 bg-background rounded-b-xl z-10">
              <button onClick={() => setSelectedProduct(null)} className="rounded border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
                Close
              </button>
              <button
                onClick={() => {
                  addItem({ product_id: selectedProduct.id, product_name: selectedProduct.name ?? "", quantity: 1, slug: selectedProduct.slug });
                  toast.success("Added to quote basket");
                }}
                className="inline-flex items-center gap-1.5 rounded bg-orange px-4 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
