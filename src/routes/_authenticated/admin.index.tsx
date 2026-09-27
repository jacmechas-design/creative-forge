import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useAdminCatalog } from "@/hooks/useCatalog";
import { Card, Empty, Pill, Stat, btnGhost, cad, dateShort, downloadCsv, inputCls } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

interface OrderRow {
  id: string;
  code: string;
  customer_name: string;
  total_cad: number;
  status: string;
  created_at: string;
}

function Dashboard() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState<30 | 90 | 365 | 0>(90);
  const catalog = useAdminCatalog();

  const orders = useQuery({
    queryKey: ["report", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, code, customer_name, total_cad, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const items = useQuery({
    queryKey: ["report", "items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("name, qty, unit_price_cad");
      if (error) throw error;
      return (data ?? []) as unknown as { name: string; qty: number; unit_price_cad: number }[];
    },
  });

  const counts = useQuery({
    queryKey: ["report", "counts"],
    queryFn: async () => {
      const [prod, quotes, msgs] = await Promise.all([
        supabase.from("products").select("id, published"),
        supabase.from("quotes").select("id, status, estimate_cad"),
        supabase.from("messages").select("id, status"),
      ]);
      const failed = prod.error ?? quotes.error ?? msgs.error;
      if (failed) throw failed;
      return {
        products: prod.data?.length ?? 0,
        published: (prod.data ?? []).filter((p) => p.published).length,
        quotes: quotes.data?.length ?? 0,
        quotesNew: (quotes.data ?? []).filter((q) => q.status === "nuevo").length,
        quotesValue: (quotes.data ?? []).reduce((s, q) => s + Number(q.estimate_cad ?? 0), 0),
        messagesNew: (msgs.data ?? []).filter((m) => m.status === "nuevo").length,
      };
    },
  });

  if (!isAdmin) {
    return (
      <Card title="Panel">
        <p className="text-sm text-muted-foreground">
          Los reportes son solo para administradores. Puedes trabajar en{" "}
          <Link to="/admin/orders" className="font-semibold underline">
            Pedidos
          </Link>
          .
        </p>
      </Card>
    );
  }

  const all = orders.data ?? [];
  const since = days === 0 ? 0 : Date.now() - days * 86_400_000;
  const list = all.filter((o) => new Date(o.created_at).getTime() >= since);
  const lowStock = (catalog.data ?? []).filter((p) => p.stock !== null && p.stock <= 3);
  const revenue = list
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + Number(o.total_cad), 0);
  const avg = list.length ? revenue / list.length : 0;
  const openOrders = list.filter((o) => ["nuevo", "confirmado", "produccion"].includes(o.status)).length;

  // last 8 weeks of sales
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const total = list
      .filter((o) => {
        const d = new Date(o.created_at);
        return d > start && d <= end && o.status !== "cancelado";
      })
      .reduce((s, o) => s + Number(o.total_cad), 0);
    return { label: `${start.getDate()}/${start.getMonth() + 1}`, total };
  }).reverse();
  const peak = Math.max(1, ...weeks.map((w) => w.total));

  const top = Object.values(
    (items.data ?? []).reduce<Record<string, { name: string; qty: number; total: number }>>((acc, it) => {
      const k = it.name;
      acc[k] = acc[k] ?? { name: k, qty: 0, total: 0 };
      acc[k].qty += it.qty;
      acc[k].total += Number(it.unit_price_cad) * it.qty;
      return acc;
    }, {})
  )
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value) as 30 | 90 | 365 | 0)}
          aria-label="Periodo del reporte"
          className={`${inputCls} sm:max-w-[15rem]`}
        >
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
          <option value={0}>Todo el histórico</option>
        </select>
        <button
          onClick={() =>
            downloadCsv(
              "reporte-ventas-jac-design.csv",
              ["codigo", "fecha", "cliente", "estado", "total_cad"],
              list.map((o) => [o.code, o.created_at, o.customer_name, o.status, Number(o.total_cad).toFixed(2)])
            )
          }
          disabled={list.length === 0}
          className={`${btnGhost} disabled:opacity-50`}
        >
          Exportar reporte CSV
        </button>
        {(orders.error || items.error || counts.error) && (
          <span className="text-xs font-semibold text-rose-600">
            No se pudieron cargar algunos datos. Recarga la página.
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ventas acumuladas" value={cad(revenue)} hint={`${list.length} pedidos`} />
        <Stat label="Ticket promedio" value={cad(avg)} />
        <Stat label="Pedidos abiertos" value={String(openOrders)} hint="nuevos, confirmados, en producción" />
        <Stat
          label="Catálogo"
          value={`${counts.data?.published ?? 0}/${counts.data?.products ?? 0}`}
          hint="publicados / totales"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Cotizaciones 3D" value={String(counts.data?.quotes ?? 0)} hint={`${counts.data?.quotesNew ?? 0} sin revisar`} />
        <Stat label="Valor cotizado" value={cad(counts.data?.quotesValue ?? 0)} />
        <Stat label="Mensajes nuevos" value={String(counts.data?.messagesNew ?? 0)} />
      </div>

      {lowStock.length > 0 && (
        <Card title="Inventario bajo">
          <ul className="grid gap-2">
            {lowStock.map((p) => (
              <li key={p.rowId ?? p.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name.es || p.name.en}</span>
                <Pill tone="warn">{p.stock === 0 ? "Sin stock" : `${p.stock} u.`}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Ventas por semana (últimas 8)">
        {list.length === 0 ? (
          <Empty>Todavía no hay pedidos registrados.</Empty>
        ) : (
          <div className="flex h-44 items-end gap-2">
            {weeks.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground">{w.total ? cad(w.total) : ""}</span>
                <div
                  className="w-full rounded-t-xl bg-gradient-warm"
                  style={{ height: `${Math.max(4, (w.total / peak) * 100)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{w.label}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Productos más vendidos">
          {top.length === 0 ? (
            <Empty>Aún sin ventas por producto.</Empty>
          ) : (
            <ul className="grid gap-2">
              {top.map((p) => (
                <li key={p.name} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <Pill tone="info">{p.qty} u.</Pill>
                  <span className="text-sm font-bold">{cad(p.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Últimos pedidos" action={<Link to="/admin/orders" className="text-xs font-bold underline">Ver todos</Link>}>
          {list.length === 0 ? (
            <Empty>Sin pedidos todavía.</Empty>
          ) : (
            <ul className="grid gap-2">
              {list.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
                  <span className="text-xs font-mono font-bold">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{o.customer_name}</span>
                  <span className="text-[11px] text-muted-foreground">{dateShort(o.created_at)}</span>
                  <span className="text-sm font-bold">{cad(Number(o.total_cad))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
