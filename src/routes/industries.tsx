import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { listIndustries } from "@/lib/catalog.functions";
import { Factory } from "lucide-react";

const q = queryOptions({ queryKey: ["industries"], queryFn: () => listIndustries() });

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industries Served | Automotive, Aerospace, Tool Rooms | Alfa Tooling" },
      { name: "description", content: "We serve automotive, aerospace, general and heavy engineering, precision machining and tool-room industries with CNC consumables and spares." },
      { property: "og:title", content: "Industries Served | Alfa Tooling" },
      { property: "og:url", content: "/industries" },
    ],
    links: [{ rel: "canonical", href: "/industries" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Industries,
});

function Industries() {
  const { data: industries } = useSuspenseQuery(q);
  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Industries</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">Industries We Serve</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {industries.map((i) => (
          <div key={i.id} className="border border-border rounded-lg p-6 bg-card hover:border-orange transition-colors">
            <div className="grid h-11 w-11 place-items-center rounded bg-secondary text-navy mb-4"><Factory className="h-5 w-5" /></div>
            <div className="font-display font-bold text-navy text-lg">{i.name}</div>
            <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
