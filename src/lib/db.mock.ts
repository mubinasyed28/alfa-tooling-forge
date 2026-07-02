import { ObjectId } from "mongodb";

export const MOCK_DATA: Record<string, any[]> = {
  categories: [
    { _id: new ObjectId(), name: "CNC Tooling", slug: "cnc-tooling", description: "High-precision tools for CNC machines.", sort_order: 1 },
    { _id: new ObjectId(), name: "Filtration Systems", slug: "filtration-systems", description: "Advanced industrial filtration solutions.", sort_order: 2 },
    { _id: new ObjectId(), name: "ATC Spare Parts", slug: "atc-spare-parts", description: "Replacement parts for Automatic Tool Changers.", sort_order: 3 },
    { _id: new ObjectId(), name: "Hydraulic Components", slug: "hydraulic-components", description: "Reliable hydraulic pumps and valves.", sort_order: 4 },
  ],
  brands: [
    { _id: new ObjectId(), name: "Mitsubishi", slug: "mitsubishi", sort_order: 1 },
    { _id: new ObjectId(), name: "Finetech", slug: "finetech", sort_order: 2 },
    { _id: new ObjectId(), name: "Pall", slug: "pall", sort_order: 3 },
    { _id: new ObjectId(), name: "Hass", slug: "hass", sort_order: 4 },
  ],
  industries: [
    { _id: new ObjectId(), name: "Automotive", slug: "automotive", sort_order: 1 },
    { _id: new ObjectId(), name: "Aerospace", slug: "aerospace", sort_order: 2 },
    { _id: new ObjectId(), name: "Medical", slug: "medical", sort_order: 3 },
    { _id: new ObjectId(), name: "Oil & Gas", slug: "oil-gas", sort_order: 4 },
  ],
  products: [],
  posts: [
    { _id: new ObjectId(), title: "The Future of CNC Machining", slug: "future-cnc", body_md: "CNC machining is evolving fast...", published_at: new Date() },
    { _id: new ObjectId(), title: "Optimizing Filtration Performance", slug: "opt-filtration", body_md: "Filtration is key to longevity...", published_at: new Date() },
  ],
};

// Add child categories
const cncTooling = MOCK_DATA.categories.find(c => c.slug === "cnc-tooling");
if (cncTooling) {
  MOCK_DATA.categories.push(
    { _id: new ObjectId(), name: "End Mills", slug: "end-mills", parent_id: cncTooling._id.toString(), sort_order: 1 },
    { _id: new ObjectId(), name: "Collets", slug: "collets", parent_id: cncTooling._id.toString(), sort_order: 2 }
  );
}

// Add some products
const endMills = MOCK_DATA.categories.find(c => c.slug === "end-mills");
if (endMills) {
  MOCK_DATA.products.push({
    _id: new ObjectId(),
    name: "Carbide End Mill 10mm",
    slug: "carbide-end-mill-10mm",
    sku: "EM-10-CARB",
    category_id: endMills._id.toString(),
    short_description: "Premium carbide end mill for steel.",
    price: 1200,
    currency: "INR",
    is_published: true,
    image_urls: ["https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=800&q=80"],
  });
}
