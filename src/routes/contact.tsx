import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { submitLead } from "@/lib/submissions.functions";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Alfa Tooling Systems | CNC Spare Parts Supplier Delhi" },
      { name: "description", content: "Get in touch for CNC tooling, filtration systems and industrial spare parts. Call +91-9311788034 or email sales@sphinxconsultants.in." },
      { property: "og:title", content: "Contact Alfa Tooling Systems" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const submit = useServerFn(submitLead);
  const mut = useMutation({ mutationFn: submit, onSuccess: () => { toast.success("Message sent — we'll be in touch shortly"); setForm({ name: "", email: "", phone: "", company: "", message: "" }); }, onError: () => toast.error("Failed to send") });
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Contact</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">Talk to our team</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 grid lg:grid-cols-[1fr_1.2fr] gap-10">
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card space-y-4">
            <div className="flex gap-3"><MapPin className="h-5 w-5 text-orange shrink-0 mt-0.5" /><div><div className="font-semibold text-navy">Address</div><div className="text-sm text-muted-foreground">Pandav Nagar, New Delhi, India</div></div></div>
            <div className="flex gap-3"><Phone className="h-5 w-5 text-orange shrink-0 mt-0.5" /><div><div className="font-semibold text-navy">Phone</div><div className="text-sm text-muted-foreground">011-43052451<br />011-22788034</div></div></div>
            <div className="flex gap-3"><Phone className="h-5 w-5 text-orange shrink-0 mt-0.5" /><div><div className="font-semibold text-navy">Mobile / WhatsApp</div><div className="text-sm text-muted-foreground">+91-9311788034</div></div></div>
            <div className="flex gap-3"><Mail className="h-5 w-5 text-orange shrink-0 mt-0.5" /><div><div className="font-semibold text-navy">Email</div><div className="text-sm text-muted-foreground"><a href="mailto:sales@sphinxconsultants.in" className="hover:underline">sales@sphinxconsultants.in</a><br />hidayat@alfatooling.com</div></div></div>
          </div>
          <a href="https://wa.me/919311788034" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold text-white" style={{ background: "#25D366" }}>
            <MessageCircle className="h-4 w-4" />Chat on WhatsApp
          </a>
          <div className="aspect-video rounded-lg overflow-hidden border border-border">
            <iframe title="Map" loading="lazy" className="w-full h-full" src="https://www.google.com/maps?q=Pandav+Nagar+New+Delhi&output=embed" />
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate({ data: form }); }} className="border border-border rounded-lg p-6 bg-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy">Send us a message</h2>
          {(["name","email","phone","company"] as const).map((f) => (
            <div key={f}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f}</label>
              <input required={f==="name"||f==="email"} type={f==="email"?"email":"text"} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:border-orange focus:outline-none" />
          </div>
          <button disabled={mut.isPending} className="w-full rounded bg-orange px-5 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50">{mut.isPending ? "Sending..." : "Send Message"}</button>
        </form>
      </section>
    </SiteLayout>
  );
}
