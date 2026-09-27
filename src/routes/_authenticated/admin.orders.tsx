import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, Empty, Pill, SearchInput, Stat, btnGhost, cadExact, dateShort, downloadCsv, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

const STATUS = ["nuevo", "confirmado", "produccion", "listo", "entregado", "cancelado"] as const;
type Status = (typeof STATUS)[number];

const STATUS_LABEL: Record<Status, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  produccion: "En producción",
  listo: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

interface Item {
  id: string;
  name: string;
  qty: number;
  unit_price_cad: number;
  product_slug: string | null;
}
interface Order {
  id: string;
  code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  lang: string;
  total_cad: number;
  status: Status;
  created_at: string;
  order_items: Item[];
}

function OrdersAdmin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    onError: (e: Error) => setError(e.message),
  });

  const term = search.trim().toLowerCase();
  const list = (data ?? []).filter(
    (o) =>
      (filter === "todos" || o.status === filter) &&
      (!term ||
        `${o.code} ${o.customer_name} ${o.customer_email} ${o.customer_phone ?? ""}`.toLowerCase().includes(term))
  );
  const shown = list.filter((o) => o.status !== "cancelado");
  const shownTotal = shown.reduce((sum, o) => sum + Number(o.total_cad), 0);

  return (
    <Card
      title="Pedidos y clientes"
      action={
        <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por código, cliente o correo" />
        <button
          onClick={() =>
            downloadCsv(
              "pedidos-jac-design.csv",
              ["codigo", "fecha", "cliente", "correo", "telefono", "estado", "total_cad", "articulos"],
              list.map((o) => [
                o.code,
                o.created_at,
                o.customer_name,
                o.customer_email,
                o.customer_phone ?? "",
                o.status,
                Number(o.total_cad).toFixed(2),
                o.order_items.map((it) => `${it.qty}x ${it.name}`).join(" | "),
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
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        </div>
      }
    >
      {error && <p className="mb-3 text-xs font-semibold text-rose-600">{error}</p>}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Pedidos en la vista" value={String(list.length)} />
        <Stat label="Valor (sin cancelados)" value={cadExact(shownTotal)} />
        <Stat
          label="Ticket promedio"
          value={cadExact(shown.length ? shownTotal / shown.length : 0)}
        />
      </div>
      {isLoading ? (
        <Empty>Cargando pedidos…</Empty>
      ) : list.length === 0 ? (
        <Empty>Aún no hay pedidos. Los pagos de la tienda aparecerán aquí automáticamente.</Empty>
      ) : (
        <ul className="grid gap-2">
          {list.map((o) => (
            <li key={o.id} className="rounded-2xl border border-border p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold">{o.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{o.customer_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {o.customer_email}
                    {o.customer_phone ? ` · ${o.customer_phone}` : ""} · {dateShort(o.created_at)} · {o.lang.toUpperCase()}
                  </p>
                </div>
                <span className="text-sm font-bold">{cadExact(Number(o.total_cad))}</span>
                <select
                  value={o.status}
                  onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value as Status })}
                  className="rounded-2xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button onClick={() => setOpen(open === o.id ? null : o.id)} className={btnGhost}>
                  {open === o.id ? "Ocultar" : "Detalle"}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Borrar el pedido ${o.code}?`)) remove.mutate(o.id);
                    }}
                    className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-muted"
                  >
                    Borrar
                  </button>
                )}
              </div>

              {open === o.id && (
                <div className="mt-3 grid gap-2 border-t border-border pt-3">
                  {o.order_items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 text-sm">
                      <Pill>{it.qty}×</Pill>
                      <span className="min-w-0 flex-1 truncate">{it.name}</span>
                      <span className="font-semibold">{cadExact(Number(it.unit_price_cad) * it.qty)}</span>
                    </div>
                  ))}
                  {o.notes && <p className="text-xs text-muted-foreground">Notas: {o.notes}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
