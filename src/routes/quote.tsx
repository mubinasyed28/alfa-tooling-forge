import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { useQuoteStore } from "@/lib/quote-store";
import { submitRfq } from "@/lib/submissions.functions";
import { Trash2, MessageCircle, Send, ShoppingCart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quote | Alfa Tooling Systems" },
      {
        name: "description",
        content:
          "Submit your CNC spare parts and tooling requirement — our team responds within one business day.",
      },
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

  const [form, setForm] = useState({
    contact_name: "",
    company: "",
    email: "",
    phone: "",
    city: "",
    gst: "",
    machine_model: "",
    notes: "",
  });
  const [adhoc, setAdhoc] = useState("");
  const [adhocQty, setAdhocQty] = useState(1);
  const [success, setSuccess] = useState<{ whatsappUrl: string } | null>(null);

  const doSubmit = useServerFn(submitRfq);

  const mut = useMutation({
    mutationFn: () => {
      const allItems = [
        ...items,
        ...(adhoc.trim() ? [{ product_name: adhoc.trim(), quantity: adhocQty }] : []),
      ];
      if (allItems.length === 0) throw new Error("Add at least one item");
      return doSubmit({ data: { ...form, items: allItems } as any });
    },
    onSuccess: (result: any) => {
      toast.success("Quote submitted! Email sent to Hass Global.");
      setSuccess({ whatsappUrl: result.whatsappUrl });
      clear();
      setForm({
        contact_name: "",
        company: "",
        email: "",
        phone: "",
        city: "",
        gst: "",
        machine_model: "",
        notes: "",
      });
      setAdhoc("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit"),
  });

  const inputCls =
    "mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  if (success) {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 py-24 max-w-lg text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600 mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-navy">Quote Submitted!</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Your quotation has been emailed to the Hass Global Team at{" "}
            <strong>sales@sphinxconsultants.in</strong>. We'll respond within 1 business day.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={success.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Also Send on WhatsApp
            </a>
            <button
              onClick={() => setSuccess(null)}
              className="inline-flex items-center justify-center gap-2 rounded border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
            >
              <ShoppingCart className="h-4 w-4" /> New Quote
            </button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">
            Request for Quote
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">
            Your Quote Basket
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill your details and we'll email + WhatsApp you a response.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 grid lg:grid-cols-[1.3fr_1fr] gap-10">
        {/* Cart Items */}
        <div>
          <h2 className="font-display text-xl font-bold text-navy mb-4">Items ({items.length})</h2>
          {items.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Your basket is empty.{" "}
              <Link to="/catalog" className="text-orange underline">
                Browse the catalog
              </Link>{" "}
              and add products, or enter requirements below.
            </p>
          )}
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.product_name}
                className="border border-border rounded p-3 flex items-center gap-3 bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{it.product_name}</div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => setQty(it.product_name, parseInt(e.target.value) || 1)}
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-sm text-center"
                />
                <button
                  onClick={() => remove(it.product_name)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Ad-hoc item */}
          <div className="mt-6 border border-dashed border-border rounded p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Add an ad-hoc requirement
            </div>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Pall HC9601FUS8H filter"
                value={adhoc}
                onChange={(e) => setAdhoc(e.target.value)}
                className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                value={adhocQty}
                onChange={(e) => setAdhocQty(parseInt(e.target.value) || 1)}
                className="w-20 rounded border border-input bg-background px-2 py-2 text-sm text-center"
              />
            </div>
          </div>

          {/* WhatsApp quick enquiry */}
          <div className="mt-6 bg-[#25D366]/5 border border-[#25D366]/30 rounded-lg p-4">
            <p className="text-sm font-medium text-[#128C7E]">Need a faster response?</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              You can also send your enquiry directly on WhatsApp.
            </p>
            <a
              href={`https://wa.me/${process.env.ALFA_WHATSAPP ?? "919311788034"}?text=${encodeURIComponent("Hello Hass Global Team, I need a quote for some products.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Open WhatsApp
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="border border-border rounded-xl p-6 bg-card space-y-4 h-fit shadow-sm"
        >
          <h2 className="font-display text-xl font-bold text-navy">Your Details</h2>
          <p className="text-xs text-muted-foreground">
            We'll send a quote confirmation to your email.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input
                required
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>GST No.</label>
              <input
                type="text"
                value={form.gst}
                onChange={(e) => setForm({ ...form, gst: e.target.value })}
                placeholder="e.g. 07AAAAA0000A1Z5"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Machine Model</label>
            <input
              type="text"
              value={form.machine_model}
              onChange={(e) => setForm({ ...form, machine_model: e.target.value })}
              placeholder="e.g. Mazak VTC-300C"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Additional Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Delivery timeline, specifications, etc."
              className={inputCls}
            />
          </div>

          <button
            disabled={mut.isPending}
            className="w-full flex items-center justify-center gap-2 rounded bg-orange px-5 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {mut.isPending ? "Submitting..." : "Submit Quote Request"}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            📧 Email sent to Hass Global + option to send on WhatsApp
          </p>
        </form>
      </section>
    </SiteLayout>
  );
}
