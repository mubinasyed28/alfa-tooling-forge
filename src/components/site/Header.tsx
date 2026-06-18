import { Link, useNavigate } from "@tanstack/react-router";
import { Phone, Mail, Menu, ShoppingCart, Search, LogIn, LogOut, Settings, UserCheck } from "lucide-react";
import { useState } from "react";
import { useQuoteStore } from "@/lib/quote-store";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
  { to: "/brands", label: "Brands" },
  { to: "/industries", label: "Industries" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const count = useQuoteStore((s) => s.items.length);
  const { user, isEditor, isSuperAdmin } = useAuth();
  const nav = useNavigate();
  const doSignOut = useServerFn(signOut);

  async function handleSignOut() {
    try {
      await doSignOut({ data: undefined } as any);
      // Clear cookie by redirecting — the server fn returns the clear cookie header
      window.location.href = "/";
    } catch {
      toast.error("Sign out failed");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      {/* Top bar */}
      <div className="hidden md:block bg-navy text-navy-foreground text-xs">
        <div className="container mx-auto flex h-9 items-center justify-between px-4">
          <div className="flex items-center gap-5">
            <a href="tel:+919811089003" className="flex items-center gap-1.5 hover:text-orange transition-colors">
              <Phone className="h-3 w-3" />+91 98110 89003
            </a>
            <a href="mailto:sales@alfatooling.com" className="flex items-center gap-1.5 hover:text-orange transition-colors">
              <Mail className="h-3 w-3" />sales@alfatooling.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span>Pandav Nagar, New Delhi · CNC Tooling &amp; Industrial Spares since 2005</span>
            {user ? (
              <div className="flex items-center gap-3">
                {(isEditor || isSuperAdmin) && (
                  <span className="flex items-center gap-1 text-orange font-semibold">
                    <UserCheck className="h-3 w-3" />
                    {isSuperAdmin ? "Super Admin" : "Editor"}
                  </span>
                )}
                <button onClick={handleSignOut} className="flex items-center gap-1 hover:text-orange transition-colors">
                  <LogOut className="h-3 w-3" /> Sign Out
                </button>
              </div>
            ) : (
              <Link to="/auth" className="flex items-center gap-1 hover:text-orange transition-colors">
                <LogIn className="h-3 w-3" /> Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.png"
            alt="Alfa Tooling Systems"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              // Fallback to letter mark if logo doesn't load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-foreground hover:text-orange transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-orange" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/catalog"
            className="hidden sm:inline-grid h-9 w-9 place-items-center rounded border border-border hover:border-orange hover:text-orange transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Admin link for editors */}
          {(isEditor || isSuperAdmin) && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded border border-navy/30 text-navy hover:bg-navy hover:text-white transition-colors text-xs font-semibold"
            >
              <Settings className="h-3.5 w-3.5" /> Dashboard
            </Link>
          )}

          <Link
            to="/quote"
            className="relative inline-flex items-center gap-2 rounded bg-orange px-3 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Quote</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-[10px] font-bold text-navy-foreground">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile: sign in / sign out */}
          {!user ? (
            <Link
              to="/auth"
              className="md:hidden grid h-9 w-9 place-items-center rounded border border-border hover:border-orange hover:text-orange transition-colors"
            >
              <LogIn className="h-4 w-4" />
            </Link>
          ) : null}

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded border border-border"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium border-b border-border last:border-0"
              >
                {n.label}
              </Link>
            ))}
            {(isEditor || isSuperAdmin) && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-navy border-b border-border">
                Dashboard
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className="py-2.5 text-sm font-medium text-left text-muted-foreground hover:text-orange">
                Sign Out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium">
                Staff Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
