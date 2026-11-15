import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/editor")({
  head: () => ({ meta: [
    { title: "Editor web | JTP" },
    { name: "description", content: "Editor web del espacio de gestión de JTP." },
    { property: "og:title", content: "Editor web | JTP" },
    { property: "og:description", content: "Editor web del espacio de gestión de JTP." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminEditor,
});

type GlobalSettings = {
  hero_title: string;
  hero_subtitle: string;
  primary_color: string;
  brand_name: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  instagram_url: string;
  facebook_url: string;
};

const DEFAULT_SETTINGS: GlobalSettings = {
  hero_title: "Transformamos tus Ideas en Realidad",
  hero_subtitle: "Diseño, impresión 3D, corte láser y soluciones creativas para cualquier proyecto.",
  primary_color: "#1e3a8a", // Default deep blue
  brand_name: "JTP",
  location: "Edmonton, AB",
  contact_email: "",
  contact_phone: "",
  instagram_url: "",
  facebook_url: "",
};

const CONTACT_FIELDS: { key: keyof GlobalSettings; label: string; placeholder: string; type?: string }[] = [
  { key: "brand_name", label: "Nombre de tu marca", placeholder: "JTP" },
  { key: "location", label: "Ciudad", placeholder: "Edmonton, AB" },
  { key: "contact_email", label: "Correo de contacto", placeholder: "tucorreo@gmail.com", type: "email" },
  { key: "contact_phone", label: "Teléfono / WhatsApp", placeholder: "+1 780 …", type: "tel" },
  { key: "instagram_url", label: "Enlace de Instagram", placeholder: "https://instagram.com/tu_cuenta", type: "url" },
  { key: "facebook_url", label: "Enlace de Facebook / Marketplace", placeholder: "https://facebook.com/…", type: "url" },
];

function AdminEditor() {
  const [data, setData] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: row, error } = await (supabase as any)
        .from("app_content")
        .select("data")
        .eq("id", "global_settings")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      if (row?.data) {
        setData({ ...DEFAULT_SETTINGS, ...row.data });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar configuración. Verifica la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("app_content").upsert({
        id: "global_settings",
        data: data,
        updated_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      toast.success("Sitio web actualizado correctamente");
    } catch (e: any) {
      console.error(e);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Cargando editor...</div>;

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h2 className="text-3xl font-black mb-2">Editor Web</h2>
      <p className="text-muted-foreground mb-8">
        Personaliza los textos, colores y diseño general de tu tienda. Los cambios se aplicarán en tiempo real.
      </p>

      <div className="space-y-6 bg-card border border-border rounded-3xl p-6 shadow-sm">
        
        {/* COLORES */}
        <div>
          <h3 className="text-lg font-bold mb-3 border-b pb-2">1. Colores y Estilo</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Color Principal (Tonos Azules)</label>
              <div className="flex gap-3 items-center">
                <input 
                  type="color" 
                  value={data.primary_color}
                  onChange={(e) => setData({ ...data, primary_color: e.target.value })}
                  className="h-10 w-14 rounded cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">{data.primary_color}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recomendamos azules como #1e3a8a (marino) o #2563eb (vibrante).
              </p>
            </div>
          </div>
        </div>

        {/* TEXTOS HERO */}
        <div className="pt-4">
          <h3 className="text-lg font-bold mb-3 border-b pb-2">2. Bienvenida (Página Principal)</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Título Grande</label>
              <input
                type="text"
                value={data.hero_title}
                onChange={(e) => setData({ ...data, hero_title: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Subtítulo o Descripción</label>
              <textarea
                rows={3}
                value={data.hero_subtitle}
                onChange={(e) => setData({ ...data, hero_subtitle: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

      </div>

      <div className="mt-6 space-y-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold border-b pb-2">3. Marca y contacto</h3>
        <p className="text-xs text-muted-foreground">
          Aparecen junto al formulario de cotización. Deja vacío lo que no quieras mostrar.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`gs-${f.key}`} className="block text-sm font-semibold mb-1">
                {f.label}
              </label>
              <input
                id={`gs-${f.key}`}
                type={f.type ?? "text"}
                value={data[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-warm px-8 py-3 font-bold text-rose-foreground shadow-soft transition-transform hover:scale-105 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Publicar Cambios"}
        </button>
      </div>
    </div>
  );
}
