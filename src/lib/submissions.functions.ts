import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RfqSchema = z.object({
  contact_name: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  machine_model: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  items: z.array(z.object({
    product_id: z.string().uuid().optional().nullable(),
    product_name: z.string().trim().min(1).max(300),
    quantity: z.number().int().min(1).max(99999),
  })).min(1).max(50),
});

export const submitRfq = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RfqSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rfq, error } = await supabaseAdmin
      .from("rfqs")
      .insert({
        contact_name: data.contact_name,
        company: data.company ?? null,
        email: data.email,
        phone: data.phone ?? null,
        machine_model: data.machine_model ?? null,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error || !rfq) throw new Error(error?.message ?? "Failed to submit");
    const { error: itemsErr } = await supabaseAdmin
      .from("rfq_items")
      .insert(data.items.map((i) => ({ rfq_id: rfq.id, product_id: i.product_id ?? null, product_name: i.product_name, quantity: i.quantity })));
    if (itemsErr) throw new Error(itemsErr.message);
    return { ok: true, id: rfq.id };
  });

const LeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1).max(5000),
  source: z.string().trim().max(100).optional().nullable(),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LeadSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name, email: data.email, phone: data.phone ?? null,
      company: data.company ?? null, message: data.message, source: data.source ?? "contact",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
