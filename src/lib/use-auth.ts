import { useContext } from "react";
import { AuthCtx } from "./auth-context";

export function useAuth() {
  const context = useContext(AuthCtx);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
