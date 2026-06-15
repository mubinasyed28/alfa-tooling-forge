import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Inbox, Mail, FileText, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Alfa Tooling" }, { name: "robots", content: "noindex" }] }),
  component: AdminShell,
});

function AdminShell() {
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) nav({ to: "/auth" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (!session) nav({ to: "/auth" }); });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [nav]);

  if (!ready) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;

  const items = [
    { to: "/admin", label: "Overview", icon: FileText },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/rfqs", label: "Quote Requests", icon: Inbox },
    { to: "/admin/leads", label: "Contact Leads", icon: Mail },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr] bg-secondary">
      <aside className="bg-navy text-navy-foreground p-4 lg:min-h-screen">
        <Link to="/" className="font-display font-bold text-lg">Alfa Tooling</Link>
        <div className="text-xs text-navy-foreground/60 mb-6">Admin</div>
        <nav className="space-y-1">
          {items.map((i) => {
            const active = path === i.to || (i.to !== "/admin" && path.startsWith(i.to));
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${active ? "bg-orange text-orange-foreground" : "hover:bg-navy-foreground/10"}`}>
                <i.icon className="h-4 w-4" />{i.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }} className="mt-8 flex items-center gap-2 text-sm text-navy-foreground/70 hover:text-orange">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </aside>
      <main className="p-6 lg:p-10"><Outlet /></main>
    </div>
  );
}
