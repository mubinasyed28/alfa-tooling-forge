import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Package, Inbox, Mail, FileText, LogOut, Users, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { seedSuperAdmin } from "@/lib/auth.functions";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Alfa Tooling" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShell,
});

function AdminShell() {
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading, isEditor, isSuperAdmin, refresh } = useAuth();
  const doSignOut = useServerFn(signOut);
  const doSeed = useServerFn(seedSuperAdmin);

  // Seed super admin on first load (idempotent)
  const seedMut = useMutation({
    mutationFn: () => doSeed({ data: undefined } as any),
  });

  useEffect(() => {
    seedMut.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && !isEditor && !isSuperAdmin) nav({ to: "/auth" });
  }, [loading, user, isEditor, isSuperAdmin, nav]);

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;
  if (!user || (!isEditor && !isSuperAdmin)) return null;

  async function handleSignOut() {
    try {
      await doSignOut({ data: undefined } as any);
      await refresh();
      nav({ to: "/" });
    } catch {
      window.location.href = "/";
    }
  }

  const items = [
    { to: "/admin", label: "Overview", icon: FileText, adminOnly: false },
    { to: "/admin/products", label: "Products", icon: Package, adminOnly: false },
    { to: "/admin/rfqs", label: "Quote Requests", icon: Inbox, adminOnly: false },
    { to: "/admin/leads", label: "Contact Leads", icon: Mail, adminOnly: false },
    ...(isSuperAdmin ? [{ to: "/admin/users", label: "Users", icon: Users, adminOnly: true }] : []),
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr] bg-secondary">
      <aside className="bg-navy text-navy-foreground p-4 lg:min-h-screen">
        <Link to="/" className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="Alfa Tooling" className="h-8 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </Link>
        <div className="flex items-center gap-2 text-xs text-navy-foreground/60 mb-6">
          <ShieldCheck className="h-3 w-3 text-orange" />
          {isSuperAdmin ? "Super Admin" : "Editor"} · {user.email}
        </div>
        <nav className="space-y-1">
          {items.map((i) => {
            const active = path === i.to || (i.to !== "/admin" && path.startsWith(i.to));
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  active ? "bg-orange text-orange-foreground" : "hover:bg-navy-foreground/10"
                }`}
              >
                <i.icon className="h-4 w-4" />
                {i.label}
                {i.adminOnly && <span className="ml-auto text-[10px] bg-orange/20 text-orange px-1.5 py-0.5 rounded font-semibold">Admin</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-8 flex items-center gap-2 text-sm text-navy-foreground/70 hover:text-orange"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
