import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteLayout } from "@/components/site/Layout";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin Sign In | Alfa Tooling" }, { name: "robots", content: "noindex" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/admin" }); });
  }, [nav]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Account created — signing in...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: "/admin" });
    } catch (err: any) { toast.error(err.message ?? "Auth failed"); } finally { setLoading(false); }
  }

  async function handleGoogle() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/admin" });
    if (res.error) toast.error("Google sign-in failed");
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <h1 className="font-display text-3xl font-bold text-navy text-center">{mode === "signin" ? "Admin Sign In" : "Create Account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">First sign-up becomes the admin.</p>
        <button onClick={handleGoogle} className="mt-6 w-full rounded border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary">Continue with Google</button>
        <div className="my-5 text-center text-xs text-muted-foreground">or</div>
        <form onSubmit={handleEmail} className="space-y-3">
          <input required type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded border border-input bg-background px-3 py-2 text-sm" />
          <input required type="password" minLength={6} placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={loading} className="w-full rounded bg-orange px-4 py-2.5 text-sm font-semibold text-orange-foreground disabled:opacity-50">{loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}</button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-sm text-muted-foreground hover:text-orange">
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </section>
    </SiteLayout>
  );
}
