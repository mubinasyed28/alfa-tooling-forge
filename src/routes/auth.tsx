import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { signIn, signUp } from "@/lib/auth.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Login | Alfa Tooling" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [pending, setPending] = useState(false);

  const doSignIn = useServerFn(signIn);
  const doSignUp = useServerFn(signUp);

  const signInMut = useMutation({
    mutationFn: () => doSignIn({ data: { email: form.email, password: form.password } }),
    onSuccess: async (result: any) => {
      await refresh();
      toast.success("Welcome back!");
      const role = result?.user?.role;
      nav({ to: role === "super_admin" || role === "editor" ? "/admin" : "/" });
    },
    onError: (e: any) => toast.error(e.message ?? "Sign in failed"),
  });

  const signUpMut = useMutation({
    mutationFn: () => doSignUp({ data: { email: form.email, password: form.password, name: form.name } }),
    onSuccess: () => {
      setPending(true);
      toast.success("Account created! Awaiting super admin approval.");
    },
    onError: (e: any) => toast.error(e.message ?? "Sign up failed"),
  });

  const loading = signInMut.isPending || signUpMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signin") signInMut.mutate();
    else signUpMut.mutate();
  }

  if (pending) {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 py-24 max-w-md text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-orange/10 text-orange mx-auto mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">Account Pending Approval</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Your account has been created and is now awaiting approval by the Super Admin. You'll be able to log in once approved.
          </p>
          <button onClick={() => { setMode("signin"); setPending(false); setForm({ email: "", password: "", name: "" }); }} className="mt-6 text-sm text-orange underline">
            Back to Sign In
          </button>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-navy text-navy-foreground mx-auto mb-4">
            {mode === "signin" ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
          </div>
          <h1 className="font-display text-3xl font-bold text-navy">
            {mode === "signin" ? "Staff Sign In" : "Request Access"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to access the admin dashboard."
              : "Create an account — super admin will approve your access."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input
                required
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2.5 text-sm focus:border-orange focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              required
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2.5 text-sm focus:border-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              required
              type="password"
              minLength={6}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2.5 text-sm focus:border-orange focus:outline-none"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded bg-orange px-4 py-3 text-sm font-semibold text-orange-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Request Access"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-sm text-muted-foreground hover:text-orange transition-colors"
        >
          {mode === "signin" ? "Need access? Request an account →" : "Already have an account? Sign in →"}
        </button>
      </section>
    </SiteLayout>
  );
}
