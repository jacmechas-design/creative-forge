import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso administrativo — JTP" },
      {
        name: "description",
        content:
          "Panel privado de JTP: gestiona catálogo, pedidos, cotizaciones y reportes del negocio.",
      },
      { property: "og:title", content: "Acceso administrativo — JTP" },
      {
        property: "og:description",
        content: "Entra al panel de gestión de JTP.",
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
  const [showPassword, setShowPassword] = useState(false);
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
        if (email.toLowerCase().trim() !== "jptproducts1946@gmail.com") {
          throw new Error("Acceso denegado: Este panel es privado y solo admite el correo del administrador.");
        }
        
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
          ← JTP
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
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            aria-label="Contraseña"
            className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((v) => !v)}
              className="h-3.5 w-3.5"
            />
            Mostrar contraseña
          </label>
          {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
          {msg && <p className="text-xs font-semibold text-emerald-600">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-2xl bg-gradient-warm py-3.5 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {busy ? "Un momento…" : mode === "in" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
          {mode === "in" && (
            <button
              type="button"
              onClick={async () => {
                if (!email) { setErr("Ingresa tu correo primero."); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/auth`,
                });
                if (error) setErr(error.message);
                else setMsg("Correo de restablecimiento enviado. Revisa tu bandeja de entrada.");
              }}
              className="text-xs text-blue-400 underline text-center mt-1"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
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
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground text-center">
          Panel exclusivo para administración de JTP.<br/>
          Solo el correo autorizado puede registrarse.
        </p>
      </div>
    </main>
  );
}
