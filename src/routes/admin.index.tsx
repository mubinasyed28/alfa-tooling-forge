import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview({ data: undefined } as any),
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
