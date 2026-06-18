import type { ObjectId } from "mongodb";

export interface Product {
  _id?: ObjectId;
  id?: string; // string version of _id for client use
  name?: string;
  slug?: string;
  sku?: string;
  short_description?: string;
  long_description?: string;
  price?: number;
  currency?: string;
  image_urls?: string[];
  video_urls?: string[];
  datasheet_url?: string;
  category_id?: string;
  brand_id?: string;
  specs?: Record<string, string>;
  features?: string[];
  applications?: string[];
  compatible_machines?: string[];
  is_published?: boolean;
  is_placeholder?: boolean;
  sort_order?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Category {
  _id?: ObjectId;
  id?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  sort_order?: number;
}

export interface Brand {
  _id?: ObjectId;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  sort_order?: number;
}

export interface Industry {
  _id?: ObjectId;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
}
