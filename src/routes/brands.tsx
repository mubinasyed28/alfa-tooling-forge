import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { listBrands } from "@/lib/catalog.functions";

const q = queryOptions({ queryKey: ["brands"], queryFn: () => listBrands() });

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Brand Partners | Mitsubishi, Pall, Parker, NSK, THK | Alfa Tooling" },
      { name: "description", content: "Authorised supplier of global brands including Mitsubishi, Pall, Parker, NSK, THK, Omron and Schneider Electric." },
      { property: "og:title", content: "Brand Partners | Alfa Tooling" },
      { property: "og:url", content: "/brands" },
    ],
    links: [{ rel: "canonical", href: "/brands" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Brands,
});

function Brands() {
  const { data: brands } = useSuspenseQuery(q);
  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Partners</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">Brand Partners</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">We supply genuine products from these globally recognised industrial brands.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map((b) => (
          <div key={b.id} className="border border-border rounded-lg p-6 bg-card hover:border-orange transition-colors">
            <div className="font-display font-bold text-xl text-navy">{b.name}</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
