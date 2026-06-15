import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

function ProductsAdmin() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () => {
      let qb = supabase.from("products").select("id,name,sku,is_published,is_placeholder").order("created_at", { ascending: false }).limit(100);
      if (q) qb = qb.ilike("name", `%${q}%`);
      const { data } = await qb;
      return data ?? [];
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-navy">Products</h1>
        <input placeholder="Search products..." value={q} onChange={(e)=>setQ(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm w-64" />
      </div>
      <div className="mt-6 bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">SKU</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
            {data?.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                <td className="p-3"><span className={`text-xs rounded px-2 py-0.5 ${p.is_published ? "bg-green-100 text-green-800" : "bg-secondary"}`}>{p.is_published ? "Published" : "Draft"}</span>{p.is_placeholder && <span className="ml-2 text-xs rounded px-2 py-0.5 bg-orange/10 text-orange">Placeholder</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Full product editing (create, edit, image upload) coming in the next update. Data shown is live from the database.</p>
    </div>
  );
}
