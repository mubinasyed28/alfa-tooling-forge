import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Truck, Wrench, Factory, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { listCategoriesTree, listBrands, listIndustries } from "@/lib/catalog.functions";

const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const [categories, brands, industries] = await Promise.all([
      listCategoriesTree(),
      listBrands(),
      listIndustries(),
    ]);
    return { categories, brands, industries };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alfa Tooling Systems | CNC Tooling & Industrial Spare Parts Supplier India" },
      {
        name: "description",
        content:
          "Your trusted partner for CNC tooling, filtration systems, ATC spare parts, hydraulic components and industrial maintenance solutions. Supplying Indian industry since 2005.",
      },
      { property: "og:title", content: "Alfa Tooling Systems | CNC Spare Parts Supplier" },
      {
        property: "og:description",
        content: "Quality CNC tooling, filtration systems and industrial spare parts since 2005.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const topCategories = data.categories.filter((c) => !c.parent_id);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-secondary to-background">
        <div className="container mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange mb-4">
              <span className="h-px w-8 bg-orange" />
              Since 2005
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-navy">
              Your Trusted Partner for CNC Tooling & Industrial Spare Parts
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Supplying quality tooling, filtration systems, machine spare parts and industrial
              maintenance solutions to Indian manufacturers since 2005.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/quote"
                className="inline-flex items-center gap-2 rounded bg-orange px-6 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
              >
                Request a Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded border-2 border-navy bg-background px-6 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-navy-foreground transition-colors"
              >
                Contact Sales
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <dt className="text-2xl font-bold text-navy">20+</dt>
                <dd className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  Years
                </dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-navy">1000+</dt>
                <dd className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  Products
                </dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-navy">500+</dt>
                <dd className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  Clients
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative hidden lg:block">
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border bg-secondary">
              <img
                src="https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80"
                alt="CNC tooling and spare parts"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-navy text-navy-foreground p-5 rounded shadow-xl max-w-xs">
              <div className="font-display font-bold text-lg">Engineering Reliability</div>
              <p className="text-sm text-navy-foreground/70 mt-1">
                OEM-equivalent parts, vetted brands, dispatched across India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">
              Product Catalog
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-sm font-semibold text-navy hover:text-orange inline-flex items-center gap-1"
          >
            View all categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topCategories.map((c) => (
            <Link
              key={c.id}
              to="/catalog/$category"
              params={{ category: c.slug }}
              className="group border border-border rounded-lg p-6 hover:border-orange hover:shadow-md transition-all bg-card"
            >
              <div className="grid h-12 w-12 place-items-center rounded bg-secondary text-navy mb-4 group-hover:bg-orange group-hover:text-orange-foreground transition-colors">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="font-display font-bold text-navy">{c.name}</div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
              <div className="mt-4 text-xs font-semibold text-orange inline-flex items-center gap-1">
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-secondary border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">
              Why Alfa Tooling
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy">
              Engineering-Grade Reliability
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Genuine & Equivalent Parts",
                desc: "We supply OEM and verified equivalent parts vetted by our engineering team.",
              },
              {
                icon: Truck,
                title: "Pan-India Dispatch",
                desc: "Same-day dispatch on stocked items from our Delhi warehouse.",
              },
              {
                icon: Factory,
                title: "Trusted Since 2005",
                desc: "Two decades of supplying CNC and tool-room consumables to Indian industry.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-background border border-border rounded-lg p-6">
                <div className="grid h-11 w-11 place-items-center rounded bg-navy text-navy-foreground mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-display font-bold text-navy">{f.title}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">
            Trusted Brand Partners
          </div>
          <h2 className="font-display text-3xl font-bold text-navy">
            Partnered with Global Leaders
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-border border border-border rounded overflow-hidden">
          {data.brands.map((b) => (
            <Link
              key={b.id}
              to="/brands"
              className="bg-background p-6 flex items-center justify-center text-center hover:bg-secondary transition-colors"
            >
              <span className="font-display font-bold text-sm text-navy">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">
              Industries Served
            </div>
            <h2 className="font-display text-3xl font-bold text-navy">
              Solutions for Every Sector
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.industries.map((i) => (
            <Link
              key={i.id}
              to="/industries"
              className="border border-border rounded p-4 text-center hover:border-orange hover:shadow-sm transition-all bg-card"
            >
              <CheckCircle2 className="h-5 w-5 text-orange mx-auto mb-2" />
              <div className="font-semibold text-sm text-navy">{i.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-navy-foreground">
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Need a part urgently?</h2>
            <p className="mt-3 text-navy-foreground/80 max-w-xl">
              Send us your requirement with machine model and quantity — our team responds within
              one business day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 rounded bg-orange px-6 py-3 text-sm font-semibold text-orange-foreground"
            >
              Request Quote
            </Link>
            <a
              href="tel:+919311788034"
              className="inline-flex items-center gap-2 rounded border border-navy-foreground/30 px-6 py-3 text-sm font-semibold hover:bg-navy-foreground/10"
            >
              Call Sales
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
