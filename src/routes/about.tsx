import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Alfa Tooling Systems | CNC Spare Parts Supplier Since 2005" },
      { name: "description", content: "Alfa Tooling Systems has been supplying CNC tooling, filtration and industrial spare parts to Indian manufacturers since 2005." },
      { property: "og:title", content: "About Alfa Tooling Systems" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">About Us</div>
          <h1 className="font-display text-4xl font-bold text-navy max-w-3xl">Two decades of supplying the Indian industrial backbone.</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid lg:grid-cols-2 gap-12">
        <div className="space-y-4 text-foreground leading-relaxed">
          <p>Alfa Tooling Systems was founded in 2005 in New Delhi with a clear mission: make quality CNC tooling and industrial spare parts accessible to every Indian manufacturer — from large OEMs to single-shop tool rooms.</p>
          <p>Over twenty years we have built deep relationships with global brands like Mitsubishi, Pall, Parker, NSK, THK, Omron and Schneider, and an extensive in-house inventory of consumables and replacement parts for almost every CNC platform deployed in India.</p>
          <p>Our engineering team helps customers identify the right part, sources OEM-equivalent alternatives when lead times are critical, and supports installation and troubleshooting.</p>
        </div>
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-display font-bold text-navy mb-2">Mission</h3>
            <p className="text-sm text-muted-foreground">Keep India's machine shops running by supplying reliable, vetted spare parts and tooling with engineering support.</p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-display font-bold text-navy mb-2">Vision</h3>
            <p className="text-sm text-muted-foreground">Become the most trusted single-source supplier for CNC and industrial consumables across South Asia.</p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-display font-bold text-navy mb-3">Certifications & Partnerships</h3>
            <ul className="space-y-2 text-sm">
              {["Authorised distributor for major OEM brands","ISO-compliant quality processes","20+ years in industrial supply","Pan-India dispatch network"].map((c) => (
                <li key={c} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-orange shrink-0 mt-0.5" />{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
