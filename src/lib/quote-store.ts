import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QuoteItem = { product_id?: string; product_name: string; quantity: number; slug?: string };

type State = {
  items: QuoteItem[];
  add: (item: QuoteItem) => void;
  remove: (name: string) => void;
  setQty: (name: string, qty: number) => void;
  clear: () => void;
};

export const useQuoteStore = create<State>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => {
        const existing = s.items.find((i) => i.product_name === item.product_name);
        if (existing) return { items: s.items.map((i) => i.product_name === item.product_name ? { ...i, quantity: i.quantity + item.quantity } : i) };
        return { items: [...s.items, item] };
      }),
      remove: (name) => set((s) => ({ items: s.items.filter((i) => i.product_name !== name) })),
      setQty: (name, qty) => set((s) => ({ items: s.items.map((i) => i.product_name === name ? { ...i, quantity: Math.max(1, qty) } : i) })),
      clear: () => set({ items: [] }),
    }),
    { name: "alfa-quote-basket" }
  )
);
