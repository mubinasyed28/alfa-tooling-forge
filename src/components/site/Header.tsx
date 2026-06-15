import { Link } from "@tanstack/react-router";
import { Phone, Mail, Menu, ShoppingCart, Search } from "lucide-react";
import { useState } from "react";
import { useQuoteStore } from "@/lib/quote-store";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
  { to: "/brands", label: "Brands" },
  { to: "/industries", label: "Industries" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const count = useQuoteStore((s) => s.items.length);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="hidden md:block bg-navy text-navy-foreground text-xs">
        <div className="container mx-auto flex h-9 items-center justify-between px-4">
          <div className="flex items-center gap-5">
            <a href="tel:+919811089003" className="flex items-center gap-1.5 hover:text-orange transition-colors"><Phone className="h-3 w-3" />+91 98110 89003</a>
            <a href="mailto:sales@alfatooling.com" className="flex items-center gap-1.5 hover:text-orange transition-colors"><Mail className="h-3 w-3" />sales@alfatooling.com</a>
          </div>
          <div>Pandav Nagar, New Delhi · CNC Tooling & Industrial Spares since 2005</div>
        </div>
      </div>
      <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded bg-navy text-navy-foreground font-display font-bold">A</div>
          <div className="leading-tight">
            <div className="font-display font-bold text-base tracking-tight">Alfa Tooling Systems</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Industrial Spare Parts</div>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((n) => (
            <Link key={n.to} to={n.to} className="px-3 py-2 text-sm font-medium text-foreground hover:text-orange transition-colors" activeProps={{ className: "px-3 py-2 text-sm font-medium text-orange" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/catalog" className="hidden sm:inline-grid h-9 w-9 place-items-center rounded border border-border hover:border-orange hover:text-orange transition-colors"><Search className="h-4 w-4" /></Link>
          <Link to="/quote" className="relative inline-flex items-center gap-2 rounded bg-orange px-3 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Quote</span>
            {count > 0 && <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-[10px] font-bold text-navy-foreground">{count}</span>}
          </Link>
          <button onClick={() => setOpen(!open)} className="lg:hidden grid h-9 w-9 place-items-center rounded border border-border"><Menu className="h-4 w-4" /></button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto flex flex-col px-4 py-2">
            {navItems.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium border-b border-border last:border-0">{n.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
