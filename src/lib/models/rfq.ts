import type { ObjectId } from "mongodb";

export interface RfqItem {
  product_id?: string;
  product_name: string;
  quantity: number;
}

export interface Rfq {
  _id?: ObjectId;
  id?: string;
  contact_name: string;
  company?: string;
  email: string;
  phone?: string;
  city?: string;
  gst?: string;
  machine_model?: string;
  notes?: string;
  items: RfqItem[];
  sent_email?: boolean;
  created_at: Date;
}
