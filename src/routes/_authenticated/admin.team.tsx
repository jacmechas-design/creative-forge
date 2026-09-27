import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, Empty, Pill, dateShort } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: TeamAdmin,
});

type Role = "admin" | "staff";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

function TeamAdmin() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const profiles = useQuery({
    queryKey: ["team", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Profile[];
    },
  });

  const roles = useQuery({
    queryKey: ["team", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as unknown as { user_id: string; role: Role }[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["team"] });

  const clearError = () => setError(null);

  const grant = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      clearError();
      refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const revoke = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      if (role === "admin") {
        const admins = (roles.data ?? []).filter((r) => r.role === "admin");
        if (admins.length <= 1)
          throw new Error("Debe quedar al menos un administrador. Asigna otro antes de quitar este.");
        if (userId === user?.id)
          throw new Error("No puedes quitarte a ti mismo el rol de administrador.");
      }
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      clearError();
      refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!isAdmin) {
    return (
      <Card title="Equipo">
        <p className="text-sm text-muted-foreground">Solo los administradores pueden gestionar permisos.</p>
      </Card>
    );
  }

  const has = (id: string, role: Role) => (roles.data ?? []).some((r) => r.user_id === id && r.role === role);

  return (
    <Card title="Equipo y permisos">
      {error && <p className="mb-3 text-xs font-semibold text-rose-600">{error}</p>}
      <p className="mb-4 text-xs text-muted-foreground">
        Administrador: control total (catálogo, borrados, reportes, permisos). Staff: puede ver y atender
        pedidos, cotizaciones y mensajes.
      </p>
      {profiles.isLoading ? (
        <Empty>Cargando equipo…</Empty>
      ) : (profiles.data ?? []).length === 0 ? (
        <Empty>Todavía no hay cuentas registradas.</Empty>
      ) : (
        <ul className="grid gap-2">
          {(profiles.data ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {p.full_name || p.email || "Cuenta sin nombre"}
                  {p.id === user?.id && <span className="ml-2 text-[11px] text-muted-foreground">(tú)</span>}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {p.email} · alta {dateShort(p.created_at)}
                </p>
              </div>
              {(["admin", "staff"] as Role[]).map((role) => {
                const active = has(p.id, role);
                return (
                  <button
                    key={role}
                    onClick={() =>
                      active ? revoke.mutate({ userId: p.id, role }) : grant.mutate({ userId: p.id, role })
                    }
                    className={`rounded-2xl px-3 py-2 text-xs font-bold transition-colors ${
                      active ? "bg-gradient-warm text-rose-foreground" : "border border-border hover:bg-muted"
                    }`}
                  >
                    {role === "admin" ? "Administrador" : "Staff"}
                  </button>
                );
              })}
              {!has(p.id, "admin") && !has(p.id, "staff") && <Pill tone="warn">Sin acceso</Pill>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
