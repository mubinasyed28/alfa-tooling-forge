import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { getProductBySlug } from "@/lib/catalog.functions";
import { ChevronRight, Download, MessageCircle, ShoppingCart, CheckCircle2 } from "lucide-react";
import { useQuoteStore } from "@/lib/quote-store";
import { toast } from "sonner";

const q = (slug: string) => queryOptions({ queryKey: ["product", slug], queryFn: () => getProductBySlug({ data: { slug } }) });

export const Route = createFileRoute("/catalog/$category/$product")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(q(params.product));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Product"} — ${loaderData?.brand?.name ?? "Alfa Tooling"} | CNC Spare Parts` },
      { name: "description", content: loaderData?.product.short_description ?? "Industrial spare part from Alfa Tooling Systems." },
      { property: "og:title", content: `${loaderData?.product.name} | Alfa Tooling` },
      { property: "og:description", content: loaderData?.product.short_description ?? "" },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/catalog/${params.category}/${params.product}` },
      ...(loaderData?.product.image_urls?.[0] ? [{ property: "og:image" as const, content: loaderData.product.image_urls[0] }] : []),
    ],
    links: [{ rel: "canonical", href: `/catalog/${params.category}/${params.product}` }],
    scripts: loaderData ? [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org", "@type": "Product",
        name: loaderData.product.name, sku: loaderData.product.sku,
        description: loaderData.product.short_description,
        brand: loaderData.brand ? { "@type": "Brand", name: loaderData.brand.name } : undefined,
        image: loaderData.product.image_urls,
      }),
    }] : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(q(params.product));
  const addItem = useQuoteStore((s) => s.add);
  if (!data) return null;
  const { product, brand, category, parentCategory, related } = data;
  const specs = (product.specs ?? {}) as Record<string, string>;

  return (
    <SiteLayout productName={product.name}>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-5">
          <nav className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-orange">Home</Link><ChevronRight className="h-3 w-3" />
            <Link to="/catalog" className="hover:text-orange">Catalog</Link><ChevronRight className="h-3 w-3" />
            {parentCategory && <><Link to="/catalog/$category" params={{ category: parentCategory.slug }} className="hover:text-orange">{parentCategory.name}</Link><ChevronRight className="h-3 w-3" /></>}
            {category && <Link to="/catalog/$category" params={{ category: category.slug }} className="hover:text-orange">{category.name}</Link>}
          </nav>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square border border-border rounded-lg overflow-hidden bg-secondary">
            {product.image_urls?.[0] && <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />}
          </div>
          {product.image_urls?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.image_urls.slice(0, 4).map((u: string, i: number) => (
                <div key={i} className="aspect-square border border-border rounded overflow-hidden bg-secondary">
                  <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {brand && <div className="text-xs font-mono uppercase tracking-wider text-orange mb-2">{brand.name}</div>}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">{product.name}</h1>
          {product.sku && <div className="mt-2 text-sm text-muted-foreground font-mono">SKU: {product.sku}</div>}
          <p className="mt-4 text-foreground leading-relaxed">{product.short_description}</p>

          {product.is_placeholder && (
            <div className="mt-4 rounded border border-orange/30 bg-orange/5 px-3 py-2 text-xs text-orange">
              Placeholder specifications — admin can edit this listing.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => { addItem({ product_id: product.id, product_name: product.name, quantity: 1, slug: product.slug }); toast.success("Added to quote basket"); }} className="inline-flex items-center gap-2 rounded bg-orange px-5 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90">
              <ShoppingCart className="h-4 w-4" />Add to Quote
            </button>
            <a href={`https://wa.me/919811089003?text=${encodeURIComponent(`Hello Alfa Tooling Team, I am interested in ${product.name}. Please provide pricing and availability.`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded border-2 border-navy bg-background px-5 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-navy-foreground transition-colors">
              <MessageCircle className="h-4 w-4" />WhatsApp Enquiry
            </a>
            {product.datasheet_url && (
              <a href={product.datasheet_url} className="inline-flex items-center gap-2 rounded border border-border px-5 py-3 text-sm font-semibold hover:border-orange hover:text-orange">
                <Download className="h-4 w-4" />Datasheet
              </a>
            )}
          </div>

          {/* Specs */}
          {Object.keys(specs).length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-navy mb-3">Technical Specifications</h2>
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
        ].map((b) => b.items.length > 0 && (
          <div key={b.title} className="border border-border rounded-lg p-5 bg-card">
            <h3 className="font-display font-bold text-navy mb-3">{b.title}</h3>
            <ul className="space-y-2">
              {b.items.map((it: string) => (
                <li key={it} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-orange shrink-0 mt-0.5" />{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Long description */}
      {product.long_description && (
        <section className="container mx-auto px-4 pb-10">
          <div className="prose prose-sm max-w-3xl whitespace-pre-line text-foreground">{product.long_description}</div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && category && (
        <section className="container mx-auto px-4 py-10 border-t border-border">
          <h2 className="font-display text-2xl font-bold text-navy mb-6">Related Products</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <Link key={p.slug} to="/catalog/$category/$product" params={{ category: category.slug, product: p.slug }} className="border border-border rounded-lg overflow-hidden bg-card hover:border-orange transition-colors">
                <div className="aspect-square bg-secondary">{p.image_urls?.[0] && <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}</div>
                <div className="p-3">
                  <div className="font-semibold text-sm line-clamp-2 text-navy">{p.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
