import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Box, Printer, ScanLine, Zap, Clock3, Calculator, Download, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCosts, DEFAULT_COST_INPUTS, type CostInputs, type Process, type FilamentUnit } from "@/lib/manufacturing-cost";
import { downloadCsv } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/calculator")({
  head: () => ({ meta: [
    { title: "Calculadora de precios en CAD | JTP" },
    { name: "description", content: "Calcula materiales, electricidad, mano de obra y precios de impresión 3D, UV y corte láser en dólares canadienses." },
    { property: "og:title", content: "Calculadora de fabricación | JTP" },
    { property: "og:description", content: "Costos de producción y precios por unidad en CAD para impresión 3D, UV y láser." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: PriceCalculator,
});

const money = (value: number) => new Intl.NumberFormat("es-CA", { style: "currency", currency: "CAD" }).format(value);
const processes = [ { id: "3d", label: "Impresión 3D", icon: Box }, { id: "uv", label: "Impresión UV", icon: Printer }, { id: "laser", label: "Corte láser", icon: ScanLine } ] as const;

function Group({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="border-t border-border py-6"><h2 className="mb-4 flex items-center gap-2 text-base font-bold">{icon}{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

function PriceCalculator() {
  const [process, setProcess] = useState<Process>("3d");
  const [unit, setUnit] = useState<FilamentUnit>("grams");
  const [values, setValues] = useState<CostInputs>({ ...DEFAULT_COST_INPUTS });
  const [name, setName] = useState("");
  const calculation = calculateCosts(process, values, unit);
  const r = calculation.result;
  const field = (key: keyof CostInputs, label: string, step = "any") => (
    <label key={key} className="grid content-start gap-1.5 text-sm"><span className="text-muted-foreground">{label}</span>
      <Input type="number" min={key === "quantity" ? 1 : 0} step={step} value={Number.isNaN(values[key]) ? "" : values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value === "" ? NaN : Number(e.target.value) }))} className="h-10 min-w-0 rounded-md bg-card tabular-nums" />
    </label>
  );
  const breakdown = r ? [ ["Materiales y consumibles", r.material], ["Electricidad", r.electricity], ["Mano de obra", r.labor], ["Desgaste y mantenimiento", r.machine], ["Embalaje", r.packaging], ["Otros gastos", r.overhead] ] as const : [];
  const exportSummary = () => {
    if (!r) return;
    downloadCsv("precio-fabricacion-cad.csv", ["Concepto", "Valor", "Unidad"], [
      ["Producto", name || "Sin nombre", ""], ["Proceso", processes.find(p => p.id === process)?.label, ""],
      ...Object.entries(values).map(([key, value]) => [key, value, "entrada"]), ["Unidad de filamento", unit, ""],
      ...breakdown.map(([label, amount]) => [label, amount.toFixed(4), "CAD/lote"]),
      ["Consumo eléctrico", r.kwh.toFixed(4), "kWh/lote"], ["Costo del lote", r.cost.toFixed(2), "CAD"],
      ["Precio por unidad sin impuestos", r.unitSale.toFixed(2), "CAD"], ["Precio del lote sin impuestos", r.roundedSale.toFixed(2), "CAD"],
      ["Impuestos del lote", r.roundedTax.toFixed(2), "CAD"], ["Total del lote", r.total.toFixed(2), "CAD"],
    ]);
  };
  return <div className="mx-auto max-w-6xl">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-primary"><Calculator className="size-4" /> Costos de fabricación · CAD</p><h1 className="text-2xl font-bold sm:text-3xl">Calculadora de precios</h1><p className="mt-2 text-sm text-muted-foreground">Impresión 3D, impresión UV y corte láser</p></div>
      <Button variant="outline" onClick={() => { setValues({ ...DEFAULT_COST_INPUTS }); setUnit("grams"); setName(""); }}><RotateCcw />Restablecer</Button>
    </header>
    <div className="mb-6 flex items-start gap-2 border-l-2 border-primary bg-muted/60 p-3 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />Valores iniciales de ejemplo; no son tus tarifas reales. Electricidad estimada según potencia promedio, no medida por un sensor. Todos los importes se introducen en CAD.</div>
    <div className="mb-6 grid grid-cols-3 gap-2" role="group" aria-label="Proceso de fabricación">{processes.map(p => <Button key={p.id} variant={process === p.id ? "default" : "outline"} aria-pressed={process === p.id} onClick={() => setProcess(p.id)} className="h-auto min-h-14 flex-col whitespace-normal px-2 py-3 sm:flex-row"><p.icon />{p.label}</Button>)}</div>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <section className="pb-6"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm"><span className="text-muted-foreground">Nombre del producto</span><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="h-10 rounded-md" /></label>{field("quantity", "Unidades producidas en el lote", "1")}</div><p className="mt-3 text-xs text-muted-foreground">Materiales, tiempo y trabajo: totales del lote. Objeto base y embalaje: por unidad.</p></section>
        <Group title="Materiales" icon={<Box className="size-4 text-primary" />}>
          {process === "3d" && <>
            <div className="sm:col-span-2 flex flex-wrap gap-2" role="group" aria-label="Consumo de filamento"><Button variant={unit === "grams" ? "default" : "outline"} onClick={() => setUnit("grams")} aria-pressed={unit === "grams"}>Gramos</Button><Button variant={unit === "meters" ? "default" : "outline"} onClick={() => setUnit("meters")} aria-pressed={unit === "meters"}>Metros de filamento</Button></div>
            {field("spoolPrice", "Precio de la bobina (CAD)")}{field("spoolGrams", "Peso neto de la bobina (g)")}
            {unit === "grams" ? field("filamentGrams", "Filamento consumido, incluidos soportes (g)") : <>{field("filamentMeters", "Longitud consumida (m)")}{field("diameter", "Diámetro del filamento (mm)")}{field("density", "Densidad del material (g/cm³)")}<p className="self-end text-sm text-muted-foreground">Peso calculado: {r ? r.grams.toFixed(2) : "—"} g</p></>}
          </>}
          {process === "uv" && <>{field("inkPrice", "Precio de la botella de tinta (CAD)")}{field("inkBottleMl", "Volumen de la botella (ml)")}{field("inkMl", "Tinta total consumida (ml)")}{field("blankPrice", "Objeto base por unidad (CAD)")}<p className="text-xs text-muted-foreground sm:col-span-2">Incluye en el consumo las tintas de color, blanca y barniz; usa su costo promedio por ml. Añade limpiezas y otros insumos en consumibles.</p></>}
          {process === "laser" && <>{field("sheetPrice", "Precio de la lámina (CAD)")}{field("sheetWidth", "Ancho de la lámina (cm)")}{field("sheetHeight", "Alto de la lámina (cm)")}{field("usedWidth", "Ancho del área utilizada por el lote (cm)")}{field("usedHeight", "Alto del área utilizada por el lote (cm)")}<p className="text-xs text-muted-foreground self-end">Área rectangular de material utilizada, incluido el espacio entre piezas.</p></>}
          {field("wastePercent", "Merma adicional de materiales (%)")}{field("consumables", "Consumibles adicionales del lote (CAD)")}
        </Group>
        <Group title="Tiempo y electricidad" icon={<Zap className="size-4 text-primary" />}>
          {field("hours", "Tiempo de máquina (horas)")}{field("minutes", "Minutos adicionales")}{field("watts", "Potencia promedio de la máquina (W)")}{field("auxiliaryWatts", "Extractor, enfriador y otros equipos (W)")}{field("electricityRate", "Tarifa total de electricidad (CAD/kWh)")}<p className="self-end text-xs text-muted-foreground">Consumo = potencia total ÷ 1.000 × horas. Utiliza la tarifa de tu factura y la potencia promedio real, no la potencia óptica del láser.</p>
        </Group>
        <Group title="Mano de obra y equipo" icon={<Clock3 className="size-4 text-primary" />}>
          {field("laborMinutes", "Trabajo activo total (min)")}{field("laborRate", "Tarifa de mano de obra (CAD/h)")}{field("machinePrice", "Costo de la máquina (CAD)")}{field("machineLifeHours", "Vida útil productiva (horas)")}{field("maintenanceRate", "Mantenimiento por hora (CAD/h)")}<p className="self-end text-xs text-muted-foreground">Incluye preparación, supervisión activa y acabado. Desgaste = costo de máquina ÷ vida útil × tiempo de uso.</p>
        </Group>
        <Group title="Precio de venta" icon={<Calculator className="size-4 text-primary" />}>
          {field("packaging", "Embalaje por unidad (CAD)")}{field("overhead", "Otros gastos del lote (CAD)")}{field("margin", "Margen de ganancia sobre venta (%)")}{field("feePercent", "Comisiones sobre venta sin impuestos (%)")}{field("taxPercent", "Impuestos aplicables (%)")}<p className="self-end text-xs text-muted-foreground">Precio = costo ÷ (1 − margen − comisiones). No es un recargo sobre el costo. Los impuestos son configurables y no se consideran ganancia.</p>
        </Group>
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">Referencias: <a className="text-primary underline" href="https://blog.prusa3d.com/3d-printing-price-calculator_38905/" target="_blank" rel="noreferrer">Prusa</a> · <a className="text-primary underline" href="https://zoramaker.com/calculator" target="_blank" rel="noreferrer">ZoraMaker</a>. Estimación de costos, no cotización automática al cliente.</p>
      </div>
      <aside className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-soft lg:sticky lg:top-40" aria-label="Resumen de costos" aria-live="polite">
        <p className="text-xs font-bold uppercase text-muted-foreground">Precio sugerido por unidad</p><p className="mt-3 break-words text-3xl font-bold text-primary" data-testid="unit-price">{r ? money(r.unitSale) : "—"}</p><p className="mt-1 text-xs text-muted-foreground">CAD · sin impuestos · redondeado al centavo superior</p>
        {!r ? <ul role="alert" className="mt-5 space-y-2 text-sm text-destructive">{calculation.errors.map(error => <li key={error}>{error}</li>)}</ul> : <>
          <div className="mt-6 border-y border-border py-4"><p className="mb-3 text-sm font-bold">Desglose del lote · {values.quantity} unidades</p><dl className="space-y-3 text-sm">{breakdown.map(([label, amount]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="shrink-0 font-mono">{money(amount)}</dd></div>)}</dl></div>
          <dl className="mt-4 space-y-3 text-sm">{[["Costo del lote", r.cost], ["Costo por unidad", r.unitCost], ["Venta del lote sin impuestos", r.roundedSale], ["Comisiones estimadas", r.roundedSale * values.feePercent / 100], ["Ganancia del lote", r.roundedSale * (1 - values.feePercent / 100) - r.cost], ["Impuestos del lote", r.roundedTax]].map(([label, amount]) => <div key={String(label)} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="shrink-0 font-semibold">{money(Number(amount))}</dd></div>)}</dl>
          <div className="mt-5 flex justify-between gap-3 border-t border-border pt-4 font-bold"><span>Total con impuestos</span><span className="break-words">{money(r.total)}</span></div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Zap className="size-4" /> {r.kwh.toFixed(3)} kWh estimados por lote</p>
        </>}
        <Button className="mt-6 w-full" disabled={!r} onClick={exportSummary}><Download />Exportar desglose CSV</Button>
      </aside>
    </div>
  </div>;
}