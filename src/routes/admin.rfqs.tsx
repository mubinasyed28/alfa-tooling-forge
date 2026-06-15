import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/rfqs")({ component: RfqInbox });

function RfqInbox() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-rfqs"],
    queryFn: async () => {
      const { data: rfqs } = await supabase.from("rfqs").select("*, rfq_items(*)").order("created_at", { ascending: false }).limit(100);
      return rfqs ?? [];
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("rfqs").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-rfqs"] }),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">Quote Requests</h1>
      <div className="mt-6 space-y-3">
        {data?.length === 0 && <p className="text-muted-foreground text-sm">No quote requests yet.</p>}
        {data?.map((r: any) => (
          <div key={r.id} className="bg-background border border-border rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-semibold text-navy">{r.contact_name} <span className="text-muted-foreground font-normal">· {r.email}</span></div>
                <div className="text-xs text-muted-foreground">{r.company} · {r.phone} · {new Date(r.created_at).toLocaleString()}</div>
                {r.machine_model && <div className="text-xs mt-1">Machine: {r.machine_model}</div>}
              </div>
              <select value={r.status} onChange={(e) => setStatus.mutate({ id: r.id, status: e.target.value })} className="rounded border border-input bg-background px-2 py-1 text-xs">
                <option value="new">New</option><option value="in_progress">In Progress</option><option value="quoted">Quoted</option><option value="closed">Closed</option>
              </select>
            </div>
            {r.notes && <div className="mt-3 text-sm bg-secondary rounded p-3">{r.notes}</div>}
            {r.rfq_items?.length > 0 && (
              <ul className="mt-3 text-sm space-y-1">
                {r.rfq_items.map((it: any) => <li key={it.id} className="flex justify-between border-b border-border py-1"><span>{it.product_name}</span><span className="font-mono text-muted-foreground">× {it.quantity}</span></li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
