import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/leads")({ component: LeadsInbox });

function LeadsInbox() {
  const { data } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">Contact Leads</h1>
      <div className="mt-6 space-y-3">
        {data?.length === 0 && <p className="text-muted-foreground text-sm">No contact leads yet.</p>}
        {data?.map((l) => (
          <div key={l.id} className="bg-background border border-border rounded-lg p-5">
            <div className="font-semibold text-navy">{l.name} <span className="font-normal text-muted-foreground">· {l.email}</span></div>
            <div className="text-xs text-muted-foreground">{l.company} · {l.phone} · {new Date(l.created_at).toLocaleString()}</div>
            <div className="mt-3 text-sm bg-secondary rounded p-3 whitespace-pre-wrap">{l.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
