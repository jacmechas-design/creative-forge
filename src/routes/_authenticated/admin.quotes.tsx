import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, Empty, Pill, SearchInput, btnGhost, cadExact, dateShort, downloadCsv, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  component: QuotesAdmin,
});

const STATUS = ["nuevo", "en_proceso", "cerrado"] as const;
type Status = (typeof STATUS)[number];
const LABEL: Record<Status, string> = {
  nuevo: "Nuevo",
  en_proceso: "En proceso",
  cerrado: "Cerrado",
};

interface Quote {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  file_name: string | null;
  material: string | null;
  infill: string | null;
  quality: string | null;
  color: string | null;
  qty: number | null;
  volume_cm3: number | null;
  estimate_cad: number | null;
  notes: string | null;
  status: Status;
  created_at: string;
}

function QuotesAdmin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Quote[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
    onError: (e: Error) => setError(e.message),
  });

  const term = search.trim().toLowerCase();
  const list = (data ?? []).filter(
    (q) =>
      (filter === "todos" || q.status === filter) &&
      (!term ||
        `${q.customer_name ?? ""} ${q.customer_email ?? ""} ${q.file_name ?? ""} ${q.material ?? ""}`
          .toLowerCase()
          .includes(term))
  );

  return (
    <Card
      title="Cotizaciones de impresión 3D"
      action={
        <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente, archivo o material" />
        <button
          onClick={() =>
            downloadCsv(
              "cotizaciones-jac-design.csv",
              ["fecha", "cliente", "correo", "archivo", "material", "relleno", "cantidad", "volumen_cm3", "estimado_cad", "estado"],
              list.map((q) => [
                q.created_at,
                q.customer_name ?? "",
                q.customer_email ?? "",
                q.file_name ?? "",
                q.material ?? "",
                q.infill ?? "",
                q.qty ?? "",
                q.volume_cm3 ?? "",
                q.estimate_cad ?? "",
                q.status,
              ])
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
        <Empty>Cargando cotizaciones…</Empty>
      ) : list.length === 0 ? (
        <Empty>Sin cotizaciones todavía. Las del estudio 3D llegarán aquí.</Empty>
      ) : (
        <ul className="grid gap-2">
          {list.map((q) => (
            <li key={q.id} className="grid gap-2 rounded-2xl border border-border p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{q.file_name || "Archivo sin nombre"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {q.customer_name || "Sin nombre"}
                    {q.customer_email ? ` · ${q.customer_email}` : ""}
                    {" · "}
                    {dateShort(q.created_at)}
                  </p>
                </div>
                <span className="text-sm font-bold">{cadExact(Number(q.estimate_cad ?? 0))}</span>
                <select
                  value={q.status}
                  onChange={(e) => setStatus.mutate({ id: q.id, status: e.target.value as Status })}
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
                      if (confirm("¿Borrar esta cotización?")) remove.mutate(q.id);
                    }}
                    className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-muted"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {q.material && <Pill tone="info">{q.material}</Pill>}
                {q.infill && <Pill>Relleno {q.infill}</Pill>}
                {q.quality && <Pill>{q.quality}</Pill>}
                {q.color && <Pill>{q.color}</Pill>}
                {q.qty ? <Pill>{q.qty} u.</Pill> : null}
                {q.volume_cm3 ? <Pill>{Number(q.volume_cm3).toFixed(1)} cm³</Pill> : null}
              </div>
              {q.notes && <p className="text-xs text-muted-foreground">{q.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
