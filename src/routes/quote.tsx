import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { useQuoteStore } from "@/lib/quote-store";
import { submitRfq } from "@/lib/submissions.functions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quote | Alfa Tooling Systems" },
      { name: "description", content: "Submit your CNC spare parts and tooling requirement — our team responds within one business day." },
      { property: "og:title", content: "Request a Quote | Alfa Tooling" },
      { property: "og:url", content: "/quote" },
    ],
    links: [{ rel: "canonical", href: "/quote" }],
  }),
  component: Quote,
});

function Quote() {
  const items = useQuoteStore((s) => s.items);
  const remove = useQuoteStore((s) => s.remove);
  const setQty = useQuoteStore((s) => s.setQty);
  const clear = useQuoteStore((s) => s.clear);
  const [form, setForm] = useState({ contact_name: "", company: "", email: "", phone: "", machine_model: "", notes: "" });
  const [adhoc, setAdhoc] = useState("");
  const [adhocQty, setAdhocQty] = useState(1);
  const submit = useServerFn(submitRfq);
  const mut = useMutation({
    mutationFn: submit,
    onSuccess: () => { toast.success("Quote request submitted — we'll respond within 1 business day"); clear(); setForm({ contact_name: "", company: "", email: "", phone: "", machine_model: "", notes: "" }); },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit"),
  });

  const allItems = [
    ...items,
    ...(adhoc ? [{ product_name: adhoc, quantity: adhocQty }] : []),
  ];

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Request for Quote</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">Your Quote Basket</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <div>
          <h2 className="font-display text-xl font-bold text-navy mb-4">Items ({items.length})</h2>
          {items.length === 0 && <p className="text-muted-foreground text-sm">Your basket is empty. <Link to="/catalog" className="text-orange underline">Browse the catalog</Link> and add products, or enter requirements below.</p>}
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.product_name} className="border border-border rounded p-3 flex items-center gap-3 bg-card">
                <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{it.product_name}</div></div>
                <input type="number" min={1} value={it.quantity} onChange={(e) => setQty(it.product_name, parseInt(e.target.value)||1)} className="w-20 rounded border border-input bg-background px-2 py-1 text-sm" />
                <button onClick={() => remove(it.product_name)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <div className="mt-6 border border-dashed border-border rounded p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Or add an ad-hoc requirement</div>
            <div className="flex gap-2">
              <input placeholder="e.g. Pall HC9601FUS8H filter" value={adhoc} onChange={(e) => setAdhoc(e.target.value)} className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm" />
              <input type="number" min={1} value={adhocQty} onChange={(e) => setAdhocQty(parseInt(e.target.value)||1)} className="w-24 rounded border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (allItems.length === 0) { toast.error("Add at least one item"); return; } mut.mutate({ data: { ...form, items: allItems } as any }); }} className="border border-border rounded-lg p-6 bg-card space-y-3 h-fit">
          <h2 className="font-display text-xl font-bold text-navy">Your Details</h2>
          {([["contact_name","Full Name *",true],["company","Company",false],["email","Email *",true],["phone","Phone",false],["machine_model","Machine Model",false]] as const).map(([k,l,req]) => (
            <div key={k}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l}</label>
              <input required={req} type={k==="email"?"email":"text"} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Notes</label>
            <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none" />
          </div>
          <button disabled={mut.isPending} className="w-full rounded bg-orange px-5 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50">{mut.isPending ? "Submitting..." : "Submit Quote Request"}</button>
        </form>
      </section>
    </SiteLayout>
  );
}
