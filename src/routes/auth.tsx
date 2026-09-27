import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso administrativo — Jac Design" },
      {
        name: "description",
        content:
          "Panel privado de Jac Design: gestiona catálogo, pedidos, cotizaciones y reportes del negocio.",
      },
      { property: "og:title", content: "Acceso administrativo — Jac Design" },
      {
        property: "og:description",
        content: "Entra al panel de gestión de Jac Design.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/admin", replace: true });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/admin", replace: true });
        else setMsg("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-soft">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-amber-600">
          ← Jac Design
        </Link>
        <h1 className="mt-4 text-2xl font-black tracking-tight">
          {mode === "in" ? "Entrar al panel" : "Crear cuenta de administración"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona catálogo, pedidos, cotizaciones, mensajes y reportes.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-3">
          {mode === "up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              aria-label="Nombre completo"
              maxLength={120}
              className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
            />
          )}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            aria-label="Correo"
            className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            aria-label="Contraseña"
            className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
          />
          {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
          {msg && <p className="text-xs font-semibold text-emerald-600">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-2xl bg-gradient-warm py-3.5 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {busy ? "Un momento…" : mode === "in" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setErr(null);
            setMsg(null);
          }}
          className="mt-4 w-full text-xs font-semibold text-muted-foreground underline"
        >
          {mode === "in" ? "No tengo cuenta todavía" : "Ya tengo cuenta"}
        </button>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          La primera cuenta registrada queda como administradora. Las siguientes quedan sin permisos
          hasta que un administrador las autorice desde Equipo.
        </p>
      </div>
    </main>
  );
}
