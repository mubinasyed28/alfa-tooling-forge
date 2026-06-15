import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [p, r, l, posts] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("rfqs").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
      ]);
      return { products: p.count ?? 0, rfqs: r.count ?? 0, leads: l.count ?? 0, posts: posts.count ?? 0 };
    },
  });
  const stats = [
    { label: "Products", value: data?.products ?? "—" },
    { label: "Quote Requests", value: data?.rfqs ?? "—" },
    { label: "Contact Leads", value: data?.leads ?? "—" },
    { label: "Blog Posts", value: data?.posts ?? "—" },
  ];
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Welcome to the Alfa Tooling admin panel.</p>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background border border-border rounded-lg p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-display font-bold text-navy">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
