import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { listCategoriesTree } from "@/lib/catalog.functions";
import { ArrowRight } from "lucide-react";

const q = queryOptions({ queryKey: ["categories"], queryFn: () => listCategoriesTree() });

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "Product Catalog — CNC Spare Parts & Industrial Tooling | Alfa Tooling" },
      { name: "description", content: "Browse our complete catalog of CNC tooling, filtration systems, ATC spare parts, mechanical and electrical components, sensors and hydraulic products." },
      { property: "og:title", content: "Product Catalog | Alfa Tooling Systems" },
      { property: "og:url", content: "/catalog" },
    ],
    links: [{ rel: "canonical", href: "/catalog" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Catalog,
});

function Catalog() {
  const { data: cats } = useSuspenseQuery(q);
  const top = cats.filter((c) => !c.parent_id);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Catalog</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">All Product Categories</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">Industrial tooling, spare parts and maintenance products organised by category.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
        {top.map((t) => {
          const subs = cats.filter((c) => c.parent_id === t.id);
          return (
            <div key={t.id} className="border border-border rounded-lg p-6 bg-card">
              <Link to="/catalog/$category" params={{ category: t.slug }} className="font-display text-xl font-bold text-navy hover:text-orange inline-flex items-center gap-1">{t.name} <ArrowRight className="h-4 w-4" /></Link>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              <ul className="mt-4 grid grid-cols-2 gap-1">
                {subs.map((s) => (
                  <li key={s.id}>
                    <Link to="/catalog/$category" params={{ category: s.slug }} className="text-sm text-foreground hover:text-orange py-1 block">· {s.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </SiteLayout>
  );
}
