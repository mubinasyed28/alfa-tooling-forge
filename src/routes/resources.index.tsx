import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { listPosts } from "@/lib/catalog.functions";

const q = queryOptions({ queryKey: ["posts"], queryFn: () => listPosts() });

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: "Resources & Technical Guides | CNC Maintenance, Filtration | Alfa Tooling" },
      { name: "description", content: "Maintenance guides, buying guides and technical articles on CNC tooling, filtration and industrial spare parts." },
      { property: "og:title", content: "Resources | Alfa Tooling" },
      { property: "og:url", content: "/resources" },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Resources,
});

function Resources() {
  const { data: posts } = useSuspenseQuery(q);
  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Resources</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">Technical Guides & Articles</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
        {posts.map((p) => (
          <Link key={p.slug} to="/resources/$slug" params={{ slug: p.slug }} className="border border-border rounded-lg p-6 bg-card hover:border-orange transition-colors block">
            <div className="text-xs font-mono uppercase text-muted-foreground mb-2">{p.tags?.join(" · ")}</div>
            <h2 className="font-display text-xl font-bold text-navy">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
            <div className="mt-4 text-sm font-semibold text-orange">Read article →</div>
          </Link>
        ))}
      </section>
    </SiteLayout>
  );
}
