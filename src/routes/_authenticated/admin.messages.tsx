import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, Empty, Pill, SearchInput, btnGhost, dateShort, downloadCsv, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesAdmin,
});

const STATUS = ["nuevo", "en_proceso", "cerrado"] as const;
type Status = (typeof STATUS)[number];
const LABEL: Record<Status, string> = {
  nuevo: "Nuevo",
  en_proceso: "En proceso",
  cerrado: "Cerrado",
};

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  body: string;
  lang: string;
  status: Status;
  created_at: string;
}

function MessagesAdmin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("messages").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
    onError: (e: Error) => setError(e.message),
  });

  const q = search.trim().toLowerCase();
  const list = (data ?? []).filter(
    (m) =>
      (filter === "todos" || m.status === filter) &&
      (!q || `${m.name} ${m.email} ${m.phone ?? ""} ${m.body}`.toLowerCase().includes(q))
  );

  return (
    <Card
      title="Mensajes de contacto"
      action={
        <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, correo o texto" />
        <button
          onClick={() =>
            downloadCsv(
              "mensajes-jac-design.csv",
              ["fecha", "nombre", "correo", "telefono", "idioma", "estado", "mensaje"],
              list.map((m) => [m.created_at, m.name, m.email, m.phone ?? "", m.lang, m.status, m.body])
            )
          }
          disabled={list.length === 0}
          className={`${btnGhost} disabled:opacity-50`}
        >
          Exportar CSV
        </button>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Status | "todos")} className={`${inputCls} max-w-[15rem]`}>
          <option value="todos">Todos los estados</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {LABEL[s]}
            </option>
          ))}
        </select>
        </div>
      }
    >
      {error && <p className="mb-3 text-xs font-semibold text-rose-600">{error}</p>}
      {isLoading ? (
        <Empty>Cargando mensajes…</Empty>
      ) : list.length === 0 ? (
        <Empty>Sin mensajes todavía. Los del formulario de la tienda llegarán aquí.</Empty>
      ) : (
        <ul className="grid gap-2">
          {list.map((m) => (
            <li key={m.id} className="grid gap-2 rounded-2xl border border-border p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{m.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    <a href={`mailto:${m.email}`} className="underline">
                      {m.email}
                    </a>
                    {m.phone ? ` · ${m.phone}` : ""} · {dateShort(m.created_at)}
                  </p>
                </div>
                <Pill tone={m.status === "nuevo" ? "warn" : "muted"}>{m.lang.toUpperCase()}</Pill>
                <select
                  value={m.status}
                  onChange={(e) => setStatus.mutate({ id: m.id, status: e.target.value as Status })}
                  className="rounded-2xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {LABEL[s]}
                    </option>
                  ))}
                </select>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("¿Borrar este mensaje?")) remove.mutate(m.id);
                    }}
                    className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-muted"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
