import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  Empty,
  Field,
  Pill,
  Stat,
  btnGhost,
  btnPrimary,
  cadExact,
  downloadCsv,
  inputCls,
} from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/costs")({
  component: CostsAdmin,
});

/* ───────────────────────── Modelo de datos ───────────────────────── */

const MATERIAL_KINDS = {
  filamento: "Filamento",
  tinta: "Tinta UV",
  madera: "Madera / coasters",
  otro: "Otro",
} as const;
type MaterialKind = keyof typeof MATERIAL_KINDS;

const UNITS = ["g", "ml", "pieza", "hoja", "unidad"] as const;
type Unit = (typeof UNITS)[number];

const MACHINE_KINDS = { "3d": "Impresión 3D", uv: "Impresión UV", laser: "Corte láser" } as const;
type MachineKind = keyof typeof MACHINE_KINDS;

interface Material {
  id: string;
  name: string;
  kind: MaterialKind;
  unit: Unit;
  /** Cantidad total que trae la compra (ej. 4000 g en un bundle de 4 rollos). */
  packQty: number;
  /** Precio pagado por esa compra, CAD. */
  packPrice: number;
  notes: string;
}

interface Machine {
  id: string;
  name: string;
  kind: MachineKind;
  watts: number;
}

interface ProjectMaterial {
  materialId: string;
  qty: number;
}
interface ProjectTime {
  machineId: string;
  minutes: number;
}
interface ExtraCost {
  label: string;
  amount: number;
}
interface Project {
  id: string;
  name: string;
  client: string;
  date: string; // YYYY-MM-DD
  salePrice: number;
  notes: string;
  materials: ProjectMaterial[];
  times: ProjectTime[];
  extras: ExtraCost[];
}

interface CostData {
  kwhRate: number;
  materials: Material[];
  machines: Machine[];
  projects: Project[];
}

const STORAGE_ID = "cost_tracker";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT_DATA: CostData = {
  kwhRate: 0.2,
  materials: [
    {
      id: "pla-bundle",
      name: "PLA bundle 4 colores (4 × 1 kg)",
      kind: "filamento",
      unit: "g",
      packQty: 4000,
      packPrice: 71,
      notes: "",
    },
    {
      id: "pla-suelto",
      name: "PLA rollo suelto 1 kg",
      kind: "filamento",
      unit: "g",
      packQty: 1000,
      packPrice: 23,
      notes: "Normalmente $21–25",
    },
    {
      id: "uv-bundle",
      name: "Cartuchos UV xTool Omni (bundle)",
      kind: "tinta",
      unit: "ml",
      packQty: 0,
      packPrice: 140,
      notes: "Completar ml totales del bundle",
    },
  ],
  machines: [
    { id: "p1s", name: "Bambu Lab P1S", kind: "3d", watts: 120 },
    { id: "omni", name: "xTool Omni Printer (UV)", kind: "uv", watts: 200 },
    { id: "falcon2", name: "Creality Falcon 2", kind: "laser", watts: 150 },
  ],
  projects: [],
};

/* ───────────────────────── Cálculos ───────────────────────── */

const unitCost = (m: Material | undefined) => (m && m.packQty > 0 ? m.packPrice / m.packQty : 0);

function projectBreakdown(p: Project, data: CostData) {
  const matById = new Map(data.materials.map((m) => [m.id, m]));
  const macById = new Map(data.machines.map((m) => [m.id, m]));
  const materialCost = p.materials.reduce(
    (s, pm) => s + pm.qty * unitCost(matById.get(pm.materialId)),
    0,
  );
  const kwh = p.times.reduce(
    (s, t) => s + ((macById.get(t.machineId)?.watts ?? 0) / 1000) * (t.minutes / 60),
    0,
  );
  const electricityCost = kwh * data.kwhRate;
  const extraCost = p.extras.reduce((s, e) => s + e.amount, 0);
  const totalMinutes = p.times.reduce((s, t) => s + t.minutes, 0);
  const total = materialCost + electricityCost + extraCost;
  const profit = p.salePrice - total;
  const margin = p.salePrice > 0 ? profit / p.salePrice : 0;
  return { materialCost, electricityCost, extraCost, kwh, totalMinutes, total, profit, margin };
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const money4 = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
const hm = (min: number) => `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`;

/* ───────────────────────── Inputs (top-level para no perder foco) ───────────────────────── */

function NumInput({
  value,
  onChange,
  step = "any",
  className = "",
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: string;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(String(value ?? 0));
  useEffect(() => {
    if (parseFloat(text) !== value && !(text === "" && value === 0)) setText(String(value ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className={`${inputCls} ${className}`}
    />
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
        active ? "bg-foreground text-background" : "border border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Página ───────────────────────── */

type Tab = "projects" | "materials" | "machines";

function CostsAdmin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState<CostData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("projects");

  useEffect(() => {
    (async () => {
      try {
        const { data: row, error } = await (supabase as any)
          .from("app_content")
          .select("data")
          .eq("id", STORAGE_ID)
          .single();
        if (error && error.code !== "PGRST116") throw error;
        if (row?.data) setData({ ...DEFAULT_DATA, ...row.data });
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron cargar los costos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (fn: (d: CostData) => CostData) => {
    setData((d) => fn(d));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("app_content")
        .upsert({ id: STORAGE_ID, data, updated_at: new Date().toISOString() });
      if (error) throw error;
      setDirty(false);
      toast.success("Costos guardados");
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Empty>Cargando…</Empty>;
  if (!isAdmin) return <Empty>Solo los administradores pueden ver los costos.</Empty>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Costos y proyectos</h1>
          <p className="text-sm text-muted-foreground">
            Materiales, tiempo de máquina, electricidad y ganancia por proyecto (CAD).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <Pill tone="warn">Cambios sin guardar</Pill>}
          <button type="button" onClick={save} disabled={saving || !dirty} className={btnPrimary}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "projects"} onClick={() => setTab("projects")}>
          Proyectos
        </TabButton>
        <TabButton active={tab === "materials"} onClick={() => setTab("materials")}>
          Materiales
        </TabButton>
        <TabButton active={tab === "machines"} onClick={() => setTab("machines")}>
          Máquinas y luz
        </TabButton>
      </div>

      {tab === "materials" && <MaterialsTab data={data} update={update} />}
      {tab === "machines" && <MachinesTab data={data} update={update} />}
      {tab === "projects" && <ProjectsTab data={data} update={update} />}
    </div>
  );
}

type Updater = (fn: (d: CostData) => CostData) => void;

/* ───────────────────────── Materiales ───────────────────────── */

function MaterialsTab({ data, update }: { data: CostData; update: Updater }) {
  const setMat = (id: string, patch: Partial<Material>) =>
    update((d) => ({
      ...d,
      materials: d.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));

  const add = () =>
    update((d) => ({
      ...d,
      materials: [
        ...d.materials,
        {
          id: uid(),
          name: "Nuevo material",
          kind: "otro",
          unit: "unidad",
          packQty: 1,
          packPrice: 0,
          notes: "",
        },
      ],
    }));

  const remove = (id: string) => {
    const used = data.projects.some((p) => p.materials.some((pm) => pm.materialId === id));
    if (used && !window.confirm("Este material se usa en proyectos. ¿Eliminarlo de todos modos?"))
      return;
    update((d) => ({
      ...d,
      materials: d.materials.filter((m) => m.id !== id),
      projects: d.projects.map((p) => ({
        ...p,
        materials: p.materials.filter((pm) => pm.materialId !== id),
      })),
    }));
  };

  return (
    <Card
      title="Lista de materiales"
      action={
        <button
          type="button"
          onClick={add}
          className={`${btnGhost} inline-flex items-center gap-2`}
        >
          <Plus className="h-4 w-4" /> Agregar material
        </button>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Escribe lo que pagaste y cuánto trae la compra. El costo por unidad se calcula solo.
        Ejemplo: bundle de 4 rollos de 1 kg → cantidad 4000 g, precio $71.
      </p>
      {data.materials.length === 0 ? (
        <Empty>No hay materiales todavía.</Empty>
      ) : (
        <div className="grid gap-3">
          {data.materials.map((m) => {
            const uc = unitCost(m);
            return (
              <div
                key={m.id}
                className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-12 md:items-end"
              >
                <div className="md:col-span-4">
                  <Field label="Nombre">
                    <input
                      value={m.name}
                      onChange={(e) => setMat(m.id, { name: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Tipo">
                    <select
                      value={m.kind}
                      onChange={(e) => setMat(m.id, { kind: e.target.value as MaterialKind })}
                      className={inputCls}
                    >
                      {Object.entries(MATERIAL_KINDS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Cantidad en la compra">
                    <div className="flex gap-2">
                      <NumInput value={m.packQty} onChange={(n) => setMat(m.id, { packQty: n })} />
                      <select
                        value={m.unit}
                        onChange={(e) => setMat(m.id, { unit: e.target.value as Unit })}
                        className={`${inputCls} w-24`}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Precio pagado (CAD)">
                    <NumInput
                      value={m.packPrice}
                      onChange={(n) => setMat(m.id, { packPrice: n })}
                      step="0.01"
                    />
                  </Field>
                </div>
                <div className="flex items-end justify-between gap-2 md:col-span-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Costo / {m.unit}
                    </p>
                    {m.packQty > 0 ? (
                      <p className="text-lg font-black">{money4(uc)}</p>
                    ) : (
                      <Pill tone="warn">Falta cantidad</Pill>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
                    aria-label="Eliminar material"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="md:col-span-12">
                  <input
                    value={m.notes}
                    onChange={(e) => setMat(m.id, { notes: e.target.value })}
                    placeholder="Notas (proveedor, color, etc.)"
                    className={inputCls}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ───────────────────────── Máquinas y luz ───────────────────────── */

function MachinesTab({ data, update }: { data: CostData; update: Updater }) {
  const setMac = (id: string, patch: Partial<Machine>) =>
    update((d) => ({
      ...d,
      machines: d.machines.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  const add = () =>
    update((d) => ({
      ...d,
      machines: [...d.machines, { id: uid(), name: "Nueva máquina", kind: "3d", watts: 100 }],
    }));
  const remove = (id: string) => {
    const used = data.projects.some((p) => p.times.some((t) => t.machineId === id));
    if (used && !window.confirm("Esta máquina se usa en proyectos. ¿Eliminarla de todos modos?"))
      return;
    update((d) => ({
      ...d,
      machines: d.machines.filter((m) => m.id !== id),
      projects: d.projects.map((p) => ({ ...p, times: p.times.filter((t) => t.machineId !== id) })),
    }));
  };

  return (
    <div className="grid gap-6">
      <Card title="Tarifa de electricidad">
        <div className="grid gap-3 sm:max-w-sm">
          <Field label="Precio por kWh (CAD)">
            <NumInput
              value={data.kwhRate}
              onChange={(n) => update((d) => ({ ...d, kwhRate: n }))}
              step="0.01"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Búscalo en tu factura de luz (energy charge + delivery ÷ kWh). En Alberta suele rondar
            $0.15–0.25.
          </p>
        </div>
      </Card>

      <Card
        title="Máquinas"
        action={
          <button
            type="button"
            onClick={add}
            className={`${btnGhost} inline-flex items-center gap-2`}
          >
            <Plus className="h-4 w-4" /> Agregar máquina
          </button>
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Usa el consumo <strong>promedio</strong> mientras trabaja (no el máximo de la etiqueta).
          Los valores iniciales son estimaciones; ajústalos si mides con un medidor de enchufe.
        </p>
        <div className="grid gap-3">
          {data.machines.map((m) => (
            <div
              key={m.id}
              className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-12 md:items-end"
            >
              <div className="md:col-span-5">
                <Field label="Nombre">
                  <input
                    value={m.name}
                    onChange={(e) => setMac(m.id, { name: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="md:col-span-3">
                <Field label="Tipo">
                  <select
                    value={m.kind}
                    onChange={(e) => setMac(m.id, { kind: e.target.value as MachineKind })}
                    className={inputCls}
                  >
                    {Object.entries(MACHINE_KINDS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Watts promedio">
                  <NumInput value={m.watts} onChange={(n) => setMac(m.id, { watts: n })} step="1" />
                </Field>
              </div>
              <div className="flex items-end justify-between gap-2 md:col-span-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Luz / hora
                  </p>
                  <p className="text-lg font-black">{money4((m.watts / 1000) * data.kwhRate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
                  aria-label="Eliminar máquina"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────── Proyectos ───────────────────────── */

function ProjectsTab({ data, update }: { data: CostData; update: Updater }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      [...data.projects]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((p) => ({ p, b: projectBreakdown(p, data) })),
    [data],
  );

  const totals = rows.reduce(
    (s, { p, b }) => ({
      sales: s.sales + p.salePrice,
      cost: s.cost + b.total,
      profit: s.profit + b.profit,
      elec: s.elec + b.electricityCost,
    }),
    { sales: 0, cost: 0, profit: 0, elec: 0 },
  );

  const monthly = useMemo(() => {
    const map = new Map<string, { sales: number; cost: number; profit: number; count: number }>();
    for (const { p, b } of rows) {
      const k = p.date.slice(0, 7);
      const cur = map.get(k) ?? { sales: 0, cost: 0, profit: 0, count: 0 };
      map.set(k, {
        sales: cur.sales + p.salePrice,
        cost: cur.cost + b.total,
        profit: cur.profit + b.profit,
        count: cur.count + 1,
      });
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  const add = () => {
    const id = uid();
    update((d) => ({
      ...d,
      projects: [
        {
          id,
          name: "Nuevo proyecto",
          client: "",
          date: today(),
          salePrice: 0,
          notes: "",
          materials: [],
          times: [],
          extras: [],
        },
        ...d.projects,
      ],
    }));
    setOpenId(id);
  };

  const exportCsv = () =>
    downloadCsv(
      `proyectos-${today()}.csv`,
      [
        "Fecha",
        "Proyecto",
        "Cliente",
        "Venta",
        "Materiales",
        "Electricidad",
        "Extras",
        "Costo total",
        "Ganancia",
        "Margen",
        "Tiempo máquina",
      ],
      rows.map(({ p, b }) => [
        p.date,
        p.name,
        p.client,
        p.salePrice.toFixed(2),
        b.materialCost.toFixed(2),
        b.electricityCost.toFixed(2),
        b.extraCost.toFixed(2),
        b.total.toFixed(2),
        b.profit.toFixed(2),
        pct(b.margin),
        hm(b.totalMinutes),
      ]),
    );

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ventas" value={cadExact(totals.sales)} hint={`${rows.length} proyectos`} />
        <Stat label="Costos" value={cadExact(totals.cost)} hint={`Luz: ${cadExact(totals.elec)}`} />
        <Stat label="Ganancia" value={cadExact(totals.profit)} />
        <Stat label="Margen" value={totals.sales > 0 ? pct(totals.profit / totals.sales) : "—"} />
      </div>

      <Card
        title="Proyectos vendidos"
        action={
          <div className="flex gap-2">
            {rows.length > 0 && (
              <button type="button" onClick={exportCsv} className={btnGhost}>
                Exportar CSV
              </button>
            )}
            <button
              type="button"
              onClick={add}
              className={`${btnGhost} inline-flex items-center gap-2`}
            >
              <Plus className="h-4 w-4" /> Nuevo proyecto
            </button>
          </div>
        }
      >
        {rows.length === 0 ? (
          <Empty>Aún no hay proyectos. Crea el primero (ej. "Coasters madera UV").</Empty>
        ) : (
          <div className="grid gap-3">
            {rows.map(({ p, b }) => (
              <div key={p.id} className="rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="font-bold">{p.name || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.date}
                      {p.client ? ` · ${p.client}` : ""} · {hm(b.totalMinutes)} de máquina
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span>
                      Venta <strong>{cadExact(p.salePrice)}</strong>
                    </span>
                    <span>
                      Costo <strong>{cadExact(b.total)}</strong>
                    </span>
                    <Pill tone={b.profit >= 0 ? "ok" : "warn"}>
                      {cadExact(b.profit)} · {pct(b.margin)}
                    </Pill>
                  </div>
                </button>
                {openId === p.id && (
                  <ProjectEditor
                    project={p}
                    data={data}
                    update={update}
                    onClose={() => setOpenId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {monthly.length > 0 && (
        <Card title="Resumen por mes">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Mes</th>
                  <th className="py-2 text-right">Proyectos</th>
                  <th className="py-2 text-right">Ventas</th>
                  <th className="py-2 text-right">Costos</th>
                  <th className="py-2 text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map(([month, m]) => (
                  <tr key={month} className="border-t border-border">
                    <td className="py-2 font-semibold">{month}</td>
                    <td className="py-2 text-right">{m.count}</td>
                    <td className="py-2 text-right">{cadExact(m.sales)}</td>
                    <td className="py-2 text-right">{cadExact(m.cost)}</td>
                    <td className="py-2 text-right font-bold">{cadExact(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ProjectEditor({
  project: p,
  data,
  update,
  onClose,
}: {
  project: Project;
  data: CostData;
  update: Updater;
  onClose: () => void;
}) {
  const set = (patch: Partial<Project>) =>
    update((d) => ({
      ...d,
      projects: d.projects.map((x) => (x.id === p.id ? { ...x, ...patch } : x)),
    }));
  const b = projectBreakdown(p, data);
  const matById = new Map(data.materials.map((m) => [m.id, m]));
  const macById = new Map(data.machines.map((m) => [m.id, m]));

  const remove = () => {
    if (!window.confirm(`¿Eliminar el proyecto "${p.name}"?`)) return;
    update((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }));
    onClose();
  };

  return (
    <div className="grid gap-5 border-t border-border p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Proyecto">
          <input
            value={p.name}
            onChange={(e) => set({ name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Cliente">
          <input
            value={p.client}
            onChange={(e) => set({ client: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Fecha">
          <input
            type="date"
            value={p.date}
            onChange={(e) => set({ date: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Precio de venta (CAD)">
          <NumInput value={p.salePrice} onChange={(n) => set({ salePrice: n })} step="0.01" />
        </Field>
      </div>

      {/* Materiales */}
      <div className="grid gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Materiales usados
        </p>
        {p.materials.map((pm, i) => {
          const m = matById.get(pm.materialId);
          return (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <select
                value={pm.materialId}
                onChange={(e) =>
                  set({
                    materials: p.materials.map((x, j) =>
                      j === i ? { ...x, materialId: e.target.value } : x,
                    ),
                  })
                }
                className={`${inputCls} col-span-6`}
              >
                {data.materials.map((mm) => (
                  <option key={mm.id} value={mm.id}>
                    {mm.name}
                  </option>
                ))}
              </select>
              <div className="col-span-3 flex items-center gap-1">
                <NumInput
                  value={pm.qty}
                  onChange={(n) =>
                    set({ materials: p.materials.map((x, j) => (j === i ? { ...x, qty: n } : x)) })
                  }
                />
                <span className="text-xs text-muted-foreground">{m?.unit}</span>
              </div>
              <span className="col-span-2 text-right text-sm font-semibold">
                {cadExact(pm.qty * unitCost(m))}
              </span>
              <button
                type="button"
                onClick={() => set({ materials: p.materials.filter((_, j) => j !== i) })}
                className="col-span-1 justify-self-end rounded-xl p-2 text-muted-foreground hover:bg-muted"
                aria-label="Quitar material"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {data.materials.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              set({ materials: [...p.materials, { materialId: data.materials[0]!.id, qty: 0 }] })
            }
            className={`${btnGhost} w-fit text-xs`}
          >
            + Material
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Primero agrega materiales en la pestaña Materiales.
          </p>
        )}
      </div>

      {/* Tiempo de máquina */}
      <div className="grid gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Tiempo de máquina
        </p>
        {p.times.map((t, i) => {
          const mac = macById.get(t.machineId);
          const setT = (patch: Partial<ProjectTime>) =>
            set({ times: p.times.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
          const h = Math.floor(t.minutes / 60);
          const min = Math.round(t.minutes % 60);
          return (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <select
                value={t.machineId}
                onChange={(e) => setT({ machineId: e.target.value })}
                className={`${inputCls} col-span-5`}
              >
                {data.machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({MACHINE_KINDS[m.kind]})
                  </option>
                ))}
              </select>
              <div className="col-span-4 flex items-center gap-1">
                <NumInput
                  value={h}
                  onChange={(n) => setT({ minutes: Math.max(0, Math.floor(n)) * 60 + min })}
                  step="1"
                />
                <span className="text-xs text-muted-foreground">h</span>
                <NumInput
                  value={min}
                  onChange={(n) => setT({ minutes: h * 60 + Math.max(0, Math.floor(n)) })}
                  step="1"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <span className="col-span-2 text-right text-sm font-semibold">
                {money4(((mac?.watts ?? 0) / 1000) * (t.minutes / 60) * data.kwhRate)}
              </span>
              <button
                type="button"
                onClick={() => set({ times: p.times.filter((_, j) => j !== i) })}
                className="col-span-1 justify-self-end rounded-xl p-2 text-muted-foreground hover:bg-muted"
                aria-label="Quitar tiempo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {data.machines.length > 0 && (
          <button
            type="button"
            onClick={() =>
              set({ times: [...p.times, { machineId: data.machines[0]!.id, minutes: 0 }] })
            }
            className={`${btnGhost} w-fit text-xs`}
          >
            + Tiempo de máquina
          </button>
        )}
      </div>

      {/* Otros costos */}
      <div className="grid gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Otros costos (empaque, envío, comisiones…)
        </p>
        {p.extras.map((x, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <input
              value={x.label}
              onChange={(e) =>
                set({
                  extras: p.extras.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)),
                })
              }
              placeholder="Concepto"
              className={`${inputCls} col-span-8`}
            />
            <div className="col-span-3">
              <NumInput
                value={x.amount}
                onChange={(n) =>
                  set({ extras: p.extras.map((y, j) => (j === i ? { ...y, amount: n } : y)) })
                }
                step="0.01"
              />
            </div>
            <button
              type="button"
              onClick={() => set({ extras: p.extras.filter((_, j) => j !== i) })}
              className="col-span-1 justify-self-end rounded-xl p-2 text-muted-foreground hover:bg-muted"
              aria-label="Quitar costo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set({ extras: [...p.extras, { label: "", amount: 0 }] })}
          className={`${btnGhost} w-fit text-xs`}
        >
          + Otro costo
        </button>
      </div>

      <textarea
        value={p.notes}
        onChange={(e) => set({ notes: e.target.value })}
        placeholder="Notas"
        rows={2}
        className={inputCls}
      />

      {/* Resumen */}
      <div className="grid gap-2 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <p className="text-xs text-muted-foreground">Materiales</p>
          <p className="font-bold">{cadExact(b.materialCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Electricidad ({b.kwh.toFixed(2)} kWh)</p>
          <p className="font-bold">{money4(b.electricityCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Otros</p>
          <p className="font-bold">{cadExact(b.extraCost)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Costo total</p>
          <p className="font-bold">{cadExact(b.total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ganancia</p>
          <p className={`font-black ${b.profit < 0 ? "text-red-600" : ""}`}>{cadExact(b.profit)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Margen</p>
          <p className="font-black">{pct(b.margin)}</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={remove}
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          Eliminar proyecto
        </button>
        <button type="button" onClick={onClose} className={btnGhost}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
