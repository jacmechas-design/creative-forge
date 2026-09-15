import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, LoaderCircle, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | ForgeLab" },
      { name: "description", content: "Sign in to ForgeLab to submit designs and track your fabrication quotes." },
      { property: "og:title", content: "Sign in | ForgeLab" },
      { property: "og:description", content: "Access your ForgeLab fabrication workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);

  const handleGoogle = async () => {
    setPending(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setPending(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      setPending(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Account created. Check your email to confirm your sign-up.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <main className="grid-surface flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-md border border-border bg-background">
        <div className="border-b border-border p-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Back to ForgeLab home">
            <span className="relative grid size-8 place-items-center border border-primary text-primary">
              <Flame className="size-4" />
              <span className="absolute -bottom-1 -right-1 size-2 bg-primary" />
            </span>
            <span className="font-display text-xl font-bold">
              FORGE<span className="text-primary">LAB</span>
            </span>
          </Link>
          <h1 className="mt-8 text-3xl font-semibold">
            {mode === "signin" ? "Access your workspace." : "Create your account."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to submit designs and track your quotes."
              : "Save quotes, upload files, and follow production."}
          </p>
        </div>

        <div className="p-8">
          <Button variant="industrial" size="lg" className="w-full" onClick={handleGoogle} disabled={pending}>
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.9-5.35 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 3.95 1.45l2.2-2.2A9 9 0 1 0 12 21c5.2 0 9-3.65 9-8.8 0-.4-.05-.75-.15-1.1Z" />
            </svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase text-muted-foreground">or with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <label className="block text-sm font-medium">
                Full name
                <Input
                  className="mt-2 h-12 rounded-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                />
              </label>
            )}
            <label className="block text-sm font-medium">
              Email
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-none pl-10"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Password
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-none pl-10"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </label>
            <Button variant="forge" size="xl" className="w-full" type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to ForgeLab?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
