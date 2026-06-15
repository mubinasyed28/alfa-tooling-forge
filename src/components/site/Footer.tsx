import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground mt-20">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="font-display font-bold text-lg mb-3">Alfa Tooling Systems</div>
          <p className="text-sm text-navy-foreground/70 leading-relaxed">Trusted supplier of CNC tooling, filtration systems and industrial spare parts since 2005.</p>
        </div>
        <div>
          <div className="font-semibold text-sm uppercase tracking-wider mb-3">Catalog</div>
          <ul className="space-y-2 text-sm text-navy-foreground/70">
            <li><Link to="/catalog" className="hover:text-orange transition-colors">All Categories</Link></li>
            <li><Link to="/catalog/$category" params={{ category: "cnc-tooling" }} className="hover:text-orange">CNC Tooling</Link></li>
            <li><Link to="/catalog/$category" params={{ category: "filtration-systems" }} className="hover:text-orange">Filtration Systems</Link></li>
            <li><Link to="/catalog/$category" params={{ category: "atc-spare-parts" }} className="hover:text-orange">ATC Spare Parts</Link></li>
            <li><Link to="/brands" className="hover:text-orange">Brands</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-sm uppercase tracking-wider mb-3">Company</div>
          <ul className="space-y-2 text-sm text-navy-foreground/70">
            <li><Link to="/about" className="hover:text-orange">About Us</Link></li>
            <li><Link to="/industries" className="hover:text-orange">Industries Served</Link></li>
            <li><Link to="/resources" className="hover:text-orange">Resources</Link></li>
            <li><Link to="/quote" className="hover:text-orange">Request a Quote</Link></li>
            <li><Link to="/contact" className="hover:text-orange">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-sm uppercase tracking-wider mb-3">Contact</div>
          <ul className="space-y-3 text-sm text-navy-foreground/70">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-orange" />Pandav Nagar, New Delhi, India</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-orange" /><span>011-43052451<br />+91-9811089003</span></li>
            <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-orange" />sales@alfatooling.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="container mx-auto px-4 py-5 text-xs text-navy-foreground/60 flex flex-wrap justify-between gap-2">
          <div>© {new Date().getFullYear()} Alfa Tooling Systems. All rights reserved.</div>
          <div>CNC Spare Parts Supplier · Industrial Tooling · Delhi, India</div>
        </div>
      </div>
    </footer>
  );
}
