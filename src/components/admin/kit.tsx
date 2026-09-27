import type { ReactNode } from "react";

export const cad = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

export const cadExact = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CA", { day: "2-digit", month: "short", year: "numeric" });

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-border bg-card p-5 shadow-soft ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "info" }) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    warn: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    info: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const btnPrimary =
  "rounded-2xl bg-gradient-warm px-4 py-2.5 text-sm font-bold text-rose-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60";
export const btnGhost =
  "rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted";

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Escapes a value for CSV (Excel/Sheets safe). */
const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Builds a CSV file from rows and triggers a browser download. */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${inputCls} sm:max-w-xs`}
    />
  );
}
