import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RfqSchema = z.object({
  contact_name: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  gst: z.string().trim().max(50).optional().nullable(),
  machine_model: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.string().optional().nullable(),
        product_name: z.string().trim().min(1).max(300),
        quantity: z.number().int().min(1).max(99999),
      })
    )
    .min(1)
    .max(50),
});

function buildQuoteEmailHtml(data: z.infer<typeof RfqSchema>): string {
  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.product_name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td></tr>`
    )
    .join("");
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#0d1b36;padding:24px 32px">
      <img src="https://alfatooling.com/logo.png" alt="Alfa Tooling" height="40" style="height:40px" />
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 20px;color:#0d1b36;font-size:22px">New Quote Request</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
        <tr><td style="padding:6px 0;color:#666;width:140px">Name</td><td style="padding:6px 0;font-weight:600">${data.contact_name}</td></tr>
        ${data.company ? `<tr><td style="padding:6px 0;color:#666">Company</td><td style="padding:6px 0;font-weight:600">${data.company}</td></tr>` : ""}
        ${data.gst ? `<tr><td style="padding:6px 0;color:#666">GST No.</td><td style="padding:6px 0">${data.gst}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${data.email}">${data.email}</a></td></tr>
        ${data.phone ? `<tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0">${data.phone}</td></tr>` : ""}
        ${data.city ? `<tr><td style="padding:6px 0;color:#666">City</td><td style="padding:6px 0">${data.city}</td></tr>` : ""}
        ${data.machine_model ? `<tr><td style="padding:6px 0;color:#666">Machine Model</td><td style="padding:6px 0">${data.machine_model}</td></tr>` : ""}
      </table>
      <h3 style="margin:0 0 12px;color:#0d1b36;font-size:16px">Requested Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #eee;border-radius:6px;overflow:hidden">
        <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left">Product</th><th style="padding:8px 12px;text-align:center">Qty</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${data.notes ? `<div style="margin-top:20px;padding:14px;background:#f9f9f9;border-radius:6px;font-size:13px;color:#444"><strong>Notes:</strong><br>${data.notes}</div>` : ""}
    </div>
    <div style="background:#f5f5f5;padding:16px 32px;font-size:12px;color:#999;text-align:center">Hass Global Team · Pandav Nagar, New Delhi · sales@sphinxconsultants.in</div>
  </div>`;
}

function buildWhatsAppMessage(data: z.infer<typeof RfqSchema>): string {
  const itemLines = data.items.map((i) => `• ${i.product_name} × ${i.quantity}`).join("\n");
  return (
    `Hello Hass Global Team,\n\n` +
    `I'd like to request a quote for the following:\n\n` +
    itemLines +
    `\n\n` +
    `*Name:* ${data.contact_name}\n` +
    (data.company ? `*Company:* ${data.company}\n` : "") +
    (data.gst ? `*GST:* ${data.gst}\n` : "") +
    `*Email:* ${data.email}\n` +
    (data.phone ? `*Phone:* ${data.phone}\n` : "") +
    (data.city ? `*City:* ${data.city}\n` : "") +
    (data.machine_model ? `*Machine:* ${data.machine_model}\n` : "") +
    (data.notes ? `\n*Notes:* ${data.notes}` : "")
  );
}

export const submitRfq = createServerFn({ method: "POST" })
  .validator((d: unknown) => RfqSchema.parse(d))
  .handler(async ({ data }) => {
    // 1. Save to MongoDB
    const { getCollection } = await import("./db.server");
    const rfqs = await getCollection("rfqs");
    const rfqDoc = {
      ...data,
      sent_email: false,
      created_at: new Date(),
    };
    const result = await rfqs.insertOne(rfqDoc as any);

    // 2. Send email
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: `"Hass Global Website" <${process.env.EMAIL_USER}>`,
        to: process.env.ALFA_EMAIL ?? "sales@sphinxconsultants.in",
        replyTo: data.email,
        subject: `New Quote Request from ${data.contact_name}${data.company ? ` (${data.company})` : ""}`,
        html: buildQuoteEmailHtml(data),
      });
      await rfqs.updateOne({ _id: result.insertedId }, { $set: { sent_email: true } });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      // Don't fail the request if email fails
    }

    const waNumber = process.env.ALFA_WHATSAPP ?? "919311788034";
    const waMsg = buildWhatsAppMessage(data);
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

    return { ok: true, id: result.insertedId.toString(), whatsappUrl: waUrl };
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
  .validator((d: unknown) => LeadSchema.parse(d))
  .handler(async ({ data }) => {
    const { getCollection } = await import("./db.server");
    const leads = await getCollection("leads");
    await leads.insertOne({ ...data, created_at: new Date() } as any);
    return { ok: true };
  });
