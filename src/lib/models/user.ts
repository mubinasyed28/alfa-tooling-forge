import type { ObjectId } from "mongodb";

export type UserRole = "super_admin" | "editor" | "pending";

export interface User {
  _id?: ObjectId;
  id?: string;
  email: string;
  name?: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  approved_at?: Date;
  approved_by?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}
