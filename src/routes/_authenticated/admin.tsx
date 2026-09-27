import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Panel", exact: true, adminOnly: true },
  { to: "/admin/products", label: "Catálogo", adminOnly: false },
  { to: "/admin/orders", label: "Pedidos", adminOnly: false },
  { to: "/admin/quotes", label: "Cotizaciones", adminOnly: false },
  { to: "/admin/messages", label: "Mensajes", adminOnly: false },
  { to: "/admin/team", label: "Equipo", adminOnly: true },
] as const;

function AdminLayout() {
  const { user, isAdmin, isStaff, loading, roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!isStaff) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-soft">
          <h1 className="text-xl font-black">Cuenta sin permisos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta ({user?.email}) existe pero todavía no tiene acceso al panel. Pide a un
            administrador que te asigne el rol de administrador o staff.
          </p>
          <button onClick={signOut} className="mt-5 rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold">
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-warm text-sm font-black text-rose-foreground">
              JD
            </span>
            <span className="text-sm font-black tracking-tight">
              Jac Design <span className="text-muted-foreground">· Gestión</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user?.email} · {roles.join(", ") || "sin rol"}
            </span>
            <Link to="/" className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
              Ver tienda
            </Link>
            <button onClick={signOut} className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
              Salir
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.filter((n) => isAdmin || !n.adminOnly).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n ? n.exact : false }}
              activeProps={{ className: "bg-gradient-warm text-rose-foreground" }}
              className="whitespace-nowrap rounded-2xl px-3.5 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
