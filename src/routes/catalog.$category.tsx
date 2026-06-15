import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { getCategoryBySlug } from "@/lib/catalog.functions";
import { ChevronRight } from "lucide-react";

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
              <Link key={p.id} to="/catalog/$category/$product" params={{ category: data.category.slug, product: p.slug }} className="group border border-border rounded-lg overflow-hidden bg-card hover:border-orange hover:shadow-md transition-all">
                <div className="aspect-square bg-secondary overflow-hidden">
                  {p.image_urls?.[0] && <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />}
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{p.sku}</div>
                  <div className="font-display font-bold text-navy mt-1 line-clamp-2">{p.name}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
