import { MessageCircle, Phone } from "lucide-react";

export function FloatingActions({ productName }: { productName?: string }) {
  const msg = productName
    ? `Hello Hass Global Team, I am interested in ${productName}. Please provide pricing and availability.`
    : `Hello Hass Global Team, I would like to enquire about your products.`;
  const waUrl = `https://wa.me/919311788034?text=${encodeURIComponent(msg)}`;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      <a href="tel:+919311788034" aria-label="Call" className="grid h-12 w-12 place-items-center rounded-full bg-navy text-navy-foreground shadow-lg hover:scale-105 transition-transform">
        <Phone className="h-5 w-5" />
      </a>
      <a href={waUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-12 w-12 place-items-center rounded-full shadow-lg hover:scale-105 transition-transform" style={{ background: "#25D366", color: "white" }}>
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}
