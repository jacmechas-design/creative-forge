import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  CircleGauge,
  Crosshair,
  FileUp,
  Flame,
  Layers3,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import workshopImage from "@/assets/forgelab-workshop.jpg";
import partsImage from "@/assets/forgelab-parts.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JTP | 3D Printing & Laser Fabrication" },
      { name: "description", content: "Upload your design and get precision 3D printing, laser engraving, or laser cutting on demand." },
      { property: "og:title", content: "JTP | Ideas Made Physical" },
      { property: "og:description", content: "Fast, precise digital fabrication from one prototype to production runs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  { id: "print", icon: Box, code: "01", title: "3D Printing", copy: "High-detail FDM and resin parts, engineered for fit, finish, and real-world use.", specs: ["0.05 mm layers", "20+ materials", "from $12"] },
  { id: "engrave", icon: ScanLine, code: "02", title: "Laser Engraving", copy: "Permanent, high-resolution marks on wood, metal, acrylic, leather, and more.", specs: ["600 DPI", "batch ready", "from $8"] },
  { id: "cut", icon: Crosshair, code: "03", title: "Laser Cutting", copy: "Production-clean profiles and assemblies with repeatable, exact geometry.", specs: ["±0.1 mm", "up to 20 mm", "from $15"] },
];

const servicePricing = {
  print: { base: 12, unit: 8.4, label: "3D Printing", materials: ["PLA Pro", "PETG", "ABS", "Nylon CF", "Resin"] },
  engrave: { base: 8, unit: 5.2, label: "Laser Engraving", materials: ["Anodized Aluminum", "Birch", "Acrylic", "Leather"] },
  cut: { base: 15, unit: 7.1, label: "Laser Cutting", materials: ["Birch Ply", "Acrylic", "MDF", "Stainless Steel"] },
};

function BrandMark() {
  return (
    <span className="relative flex size-9 items-center justify-center border border-primary/60 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent shadow-[0_0_14px_rgba(59,130,246,0.35)] transition-transform hover:scale-105">
      <span className="font-display text-xs font-black tracking-widest uppercase bg-gradient-to-r from-blue-300 via-primary to-cyan-300 bg-clip-text text-transparent">
        JTP
      </span>
      <span className="absolute -top-0.5 -left-0.5 size-1 border-t border-l border-primary" />
      <span className="absolute -top-0.5 -right-0.5 size-1 border-t border-r border-primary" />
      <span className="absolute -bottom-0.5 -left-0.5 size-1 border-b border-l border-primary" />
      <span className="absolute -bottom-1 -right-1 size-1.5 bg-primary shadow-[0_0_8px_var(--primary)]" />
    </span>
  );
}

function Index() {
  const quoteRef = useRef<HTMLElement>(null);
  const [service, setService] = useState<keyof typeof servicePricing>("print");
  const [quantity, setQuantity] = useState(1);
  const [material, setMaterial] = useState(servicePricing.print.materials[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myQuotes, setMyQuotes] = useState<Tables<"quotes">[]>([]);
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      setMyQuotes([]);
      return;
    }
    supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!error && data) setMyQuotes(data);
      });
  }, [user]);

  const submitQuote = async () => {
    if (!user) {
      toast.info("Sign in to submit your design for review.");
      navigate({ to: "/auth" });
      return;
    }
    if (!file) return;
    setSubmitting(true);
    const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("design-files")
      .upload(filePath, file);
    if (uploadError) {
      setSubmitting(false);
      toast.error("File upload failed. Please try again.");
      return;
    }
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        service,
        material,
        quantity,
        estimated_price: Number(price),
        file_name: file.name,
        file_path: filePath,
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Could not save your quote. Please try again.");
      return;
    }
    toast.success("Quote submitted. Our specialists will review your design.");
    setMyQuotes((prev) => [data, ...prev].slice(0, 5));
    setFile(null);
    setFileName("");
  };
  const price = useMemo(() => {
    const data = servicePricing[service];
    const discount = quantity >= 20 ? 0.76 : quantity >= 10 ? 0.84 : quantity >= 5 ? 0.92 : 1;
    return (data.base + data.unit * quantity * discount).toFixed(2);
  }, [service, quantity]);
  const scrollToQuote = () => quoteRef.current?.scrollIntoView({ behavior: "smooth" });
  const selectService = (id: keyof typeof servicePricing) => {
    setService(id);
    setMaterial(servicePricing[id].materials[0]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="JTP home">
            <BrandMark />
            <span className="font-display text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-blue-300 via-primary to-cyan-300 bg-clip-text text-transparent">
              JTP
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Primary navigation">
            <a href="#services" className="transition-colors hover:text-foreground">Services</a><a href="#materials" className="transition-colors hover:text-foreground">Materials</a><a href="#process" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">{!authLoading && (user ? <><span className="max-w-40 truncate font-mono text-xs text-muted-foreground">{user.email}</span><Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => signOut()}><LogOut /></Button></> : <Button variant="industrial" asChild><Link to="/auth"><LogIn /> Sign in</Link></Button>)}<Button variant="forge" onClick={scrollToQuote}>Get a quote <ArrowRight /></Button></div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu /></Button>
        </div>
        {menuOpen && <nav className="border-t border-border bg-background px-5 py-4 md:hidden"><div className="flex flex-col gap-4 text-sm"><a href="#services" onClick={() => setMenuOpen(false)}>Services</a><a href="#materials" onClick={() => setMenuOpen(false)}>Materials</a><a href="#process" onClick={() => setMenuOpen(false)}>How it works</a><Button variant="forge" onClick={scrollToQuote}>Get a quote</Button></div></nav>}
      </header>

      <section id="top" className="relative min-h-[760px] overflow-hidden border-b border-border pt-16 lg:min-h-[820px]">
        <img src={workshopImage} alt="ForgeLab 3D printer producing a precision component" width={1920} height={1088} className="absolute inset-0 size-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_96%,transparent)_32%,color-mix(in_oklab,var(--background)_58%,transparent)_62%,color-mix(in_oklab,var(--background)_18%,transparent)_100%)]" />
        <div className="grid-surface absolute inset-0 opacity-30" />
        <div className="relative mx-auto flex min-h-[696px] max-w-7xl items-center px-5 py-20 lg:min-h-[756px] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-3 font-mono text-xs uppercase text-primary"><span className="h-px w-10 bg-primary" />Digital fabrication / on demand</div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.96] sm:text-7xl lg:text-[5.8rem]">Ideas, forged<br />into <span className="text-primary">reality.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Precision 3D printing, laser engraving, and laser cutting. From a single prototype to a full production run.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button variant="forge" size="xl" onClick={scrollToQuote}><Upload /> Upload your design</Button><Button variant="industrial" size="xl" asChild><a href="#services">Explore capabilities <ArrowRight /></a></Button></div>
            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
              {[['±0.1 mm','Tolerance'],['24–72 hr','Turnaround'],['20+','Materials'],['4.9 / 5','Avg. rating']].map(([v,l]) => <div key={l} className="bg-background/85 p-4 backdrop-blur"><div className="font-mono text-sm font-semibold text-foreground">{v}</div><div className="mt-1 text-[11px] uppercase text-muted-foreground">{l}</div></div>)}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 hidden border-l border-t border-border bg-background/85 px-6 py-4 font-mono text-[10px] uppercase text-muted-foreground backdrop-blur lg:block">System status <span className="ml-3 inline-flex items-center gap-2 text-success"><span className="size-1.5 rounded-full bg-success" /> all machines online</span></div>
      </section>

      <section id="services" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="font-mono text-xs uppercase text-primary">Capabilities / 001</p><h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Built for exactness.</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Three processes. One streamlined workflow. Every job is reviewed by a fabrication specialist before production.</p></div>
          <div className="grid border border-border md:grid-cols-3">
            {services.map((item, index) => { const Icon = item.icon; return <article key={item.id} className={`group relative p-7 transition-colors hover:bg-card ${index ? "border-t border-border md:border-l md:border-t-0" : ""}`}><div className="mb-12 flex items-start justify-between"><span className="grid size-12 place-items-center border border-primary/40 bg-primary/10 text-primary"><Icon /></span><span className="font-mono text-xs text-muted-foreground">{item.code}</span></div><h3 className="text-2xl font-semibold">{item.title}</h3><p className="mt-4 min-h-20 text-sm leading-6 text-muted-foreground">{item.copy}</p><div className="mt-8 flex flex-wrap gap-2">{item.specs.map(spec => <span key={spec} className="border border-border px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground">{spec}</span>)}</div><button onClick={() => { selectService(item.id as keyof typeof servicePricing); scrollToQuote(); }} className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary">Configure service <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button></article>; })}
          </div>
        </div>
      </section>

      <section ref={quoteRef} className="grid-surface border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10"><p className="font-mono text-xs uppercase text-primary">Instant estimate / 002</p><h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Configure your build.</h2></div>
          <div className="grid border border-border bg-background lg:grid-cols-[1.35fr_.65fr]">
            <div className="p-6 sm:p-9">
              <div className="mb-8 flex gap-2 overflow-x-auto pb-2">{Object.entries(servicePricing).map(([key, data]) => <button key={key} onClick={() => selectService(key as keyof typeof servicePricing)} className={`min-w-max border px-4 py-3 text-sm font-semibold transition-colors ${service === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{data.label}</button>)}</div>
              <div className="grid gap-8 sm:grid-cols-2">
                <label className="block text-sm font-medium">Material<select value={material} onChange={e => setMaterial(e.target.value)} className="mt-2 h-12 w-full rounded-none border border-input bg-secondary px-3 text-sm outline-none focus:border-primary">{servicePricing[service].materials.map(m => <option key={m}>{m}</option>)}</select></label>
                <div><span className="text-sm font-medium">Quantity</span><div className="mt-2 flex h-12 border border-input bg-secondary"><Button variant="ghost" size="icon" className="h-full rounded-none" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus /></Button><Input className="h-full rounded-none border-0 text-center font-mono shadow-none" type="number" min={1} max={100} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))} /><Button variant="ghost" size="icon" className="h-full rounded-none" onClick={() => setQuantity(Math.min(100, quantity + 1))} aria-label="Increase quantity"><Plus /></Button></div></div>
              </div>
              <label className="mt-8 flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-secondary/50 p-6 text-center transition-colors hover:border-primary"><FileUp className="mb-3 size-7 text-primary" /><span className="text-sm font-semibold">{fileName || "Drop a design file or browse"}</span><span className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">STL, STEP, SVG, DXF · max 100 MB</span><input type="file" className="sr-only" accept=".stl,.step,.stp,.svg,.dxf" onChange={e => { const f = e.target.files?.[0] ?? null; setFile(f); setFileName(f?.name ?? ""); }} /></label>
            </div>
            <aside className="technical-panel border-t border-border p-6 sm:p-9 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between border-b border-border pb-5"><span className="font-mono text-xs uppercase text-muted-foreground">Estimate</span><span className="flex items-center gap-2 font-mono text-[10px] uppercase text-success"><span className="size-1.5 rounded-full bg-success" /> Live</span></div>
              <dl className="space-y-4 py-6 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Process</dt><dd>{servicePricing[service].label}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Material</dt><dd>{material}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Quantity</dt><dd className="font-mono">{quantity}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Lead time</dt><dd>2–4 business days</dd></div></dl>
              <div className="border-y border-border py-6"><span className="font-mono text-[10px] uppercase text-muted-foreground">Estimated total</span><div className="mt-2 flex items-end gap-2"><span className="font-display text-5xl font-semibold">${price}</span><span className="pb-1 text-xs text-muted-foreground">USD</span></div><p className="mt-2 text-xs text-muted-foreground">Final price confirmed after design review.</p></div>
              <Button variant="forge" size="xl" className="mt-6 w-full" disabled={!fileName || submitting} onClick={submitQuote}>{submitting ? <><LoaderCircle className="animate-spin" /> Uploading…</> : fileName ? <>Submit for review<ArrowRight /></> : "Upload file to continue"}</Button>
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" /> Files are encrypted and confidential</div>
            </aside>
          </div>
        </div>
      </section>

      <section id="materials" className="border-b border-border py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="relative overflow-hidden border border-border"><img src={partsImage} alt="Precision parts manufactured in multiple ForgeLab materials" width={1408} height={1008} loading="lazy" className="aspect-[4/3] size-full object-cover" /><div className="absolute bottom-0 left-0 border-r border-t border-border bg-background/90 px-4 py-3 font-mono text-[10px] uppercase text-muted-foreground backdrop-blur">Material sample array / FL-06</div></div>
          <div><p className="font-mono text-xs uppercase text-primary">Material library / 003</p><h2 className="mt-3 text-4xl font-semibold sm:text-5xl">The right material for the real world.</h2><p className="mt-6 max-w-xl leading-7 text-muted-foreground">From resilient engineering polymers to presentation-grade hardwoods and metals, every material is selected for a measurable purpose.</p><div className="mt-8 grid grid-cols-2 gap-px bg-border">{[[Layers3,"Polymers","PLA · PETG · ABS · Nylon"],[Sparkles,"Resins","Standard · Tough · Clear"],[Zap,"Sheet goods","Acrylic · Wood · Leather"],[CircleGauge,"Metals","Steel · Aluminum · Brass"]].map(([Icon,title,copy]) => { const MaterialIcon = Icon as typeof Layers3; return <div key={title as string} className="bg-background p-5"><MaterialIcon className="size-5 text-primary"/><h3 className="mt-4 text-sm font-semibold">{title as string}</h3><p className="mt-1 font-mono text-[10px] text-muted-foreground">{copy as string}</p></div>})}</div></div>
        </div>
      </section>

      <section id="process" className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><p className="font-mono text-xs uppercase text-primary">From file to finished / 004</p><h2 className="mt-3 text-4xl font-semibold sm:text-5xl">No mystery in the process.</h2></div><div className="relative mt-14 grid gap-px bg-border md:grid-cols-4">{[[Upload,"01","Upload","Send your production-ready file."],[CircleGauge,"02","Review","We verify geometry and tolerances."],[Flame,"03","Fabricate","Your job enters the optimal machine queue."],[PackageCheck,"04","Deliver","Inspected, packed, and shipped fast."]].map(([Icon,num,title,copy]) => { const StepIcon = Icon as typeof Upload; return <div key={title as string} className="bg-background p-6"><div className="flex items-center justify-between"><StepIcon className="size-5 text-primary"/><span className="font-mono text-xs text-muted-foreground">{num as string}</span></div><h3 className="mt-10 text-xl font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy as string}</p></div>})}</div></div>
      </section>

      <section className="border-y border-primary/40 bg-primary py-14 text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 md:flex-row md:items-center lg:px-8"><div><p className="font-mono text-xs font-semibold uppercase">Ready to make something real?</p><h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Your next build starts with a file.</h2></div><Button className="h-12 rounded-none border border-primary-foreground bg-primary-foreground px-6 text-sm font-semibold text-background hover:bg-primary-foreground/90" onClick={scrollToQuote}>Start instant quote <ArrowRight /></Button></div></section>

      <footer className="bg-background py-12"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex flex-col justify-between gap-8 border-b border-border pb-10 md:flex-row"><div><div className="flex items-center gap-3"><BrandMark /><span className="font-display text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-blue-300 via-primary to-cyan-300 bg-clip-text text-transparent">JTP</span></div><p className="mt-4 max-w-xs text-sm text-muted-foreground">Precision fabrication, on demand. Built for designers, engineers, and makers.</p></div><div className="grid grid-cols-2 gap-12 text-sm"><div><p className="font-mono text-[10px] uppercase text-muted-foreground">Services</p><div className="mt-4 space-y-2"><a className="block hover:text-primary" href="#services">3D Printing</a><a className="block hover:text-primary" href="#services">Laser Engraving</a><a className="block hover:text-primary" href="#services">Laser Cutting</a></div></div><div><p className="font-mono text-[10px] uppercase text-muted-foreground">Contact</p><div className="mt-4 space-y-2"><a className="block hover:text-primary" href="mailto:hello@forgelab.co">hello@forgelab.co</a><span className="block text-muted-foreground">Mon–Fri / 8–6</span></div></div></div></div><div className="flex flex-col justify-between gap-3 pt-6 font-mono text-[10px] uppercase text-muted-foreground sm:flex-row"><span>© 2026 JTP Manufacturing</span><span>Made with precision</span></div></div></footer>
    </main>
  );
}