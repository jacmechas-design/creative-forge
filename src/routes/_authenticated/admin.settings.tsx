import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Settings = {
  id: string;
  show_hero: boolean;
  show_quoter: boolean;
  show_catalog: boolean;
  show_reviews: boolean;
  show_services: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  id: "default",
  show_hero: true,
  show_quoter: true,
  show_catalog: true,
  show_reviews: true,
  show_services: true,
};

function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("ui_settings")
        .select("*")
        .eq("id", "default")
        .single();
      
      if (error && error.code !== "PGRST116") throw error; // PGRST116 is 'not found'
      if (data) {
        setSettings(data as Settings);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("ui_settings").upsert({
        ...settings,
        id: "default",
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Configuración de interfaz guardada");
    } catch (e: any) {
      console.error(e);
      toast.error(
        "Error al guardar. Asegúrate de haber ejecutado el código SQL en Supabase."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <h2 className="text-3xl font-black mb-2">Configuración de Interfaz</h2>
      <p className="text-muted-foreground mb-8">
        Enciende o apaga las secciones principales de la página web. Los cambios se
        reflejarán inmediatamente para todos los visitantes.
      </p>

      <div className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <ToggleRow 
          label="Sección de Bienvenida (Hero)" 
          description="La imagen principal, el título grande y el botón de llamada a la acción."
          checked={settings.show_hero} 
          onChange={() => handleToggle("show_hero")} 
        />
        <hr className="border-border" />
        <ToggleRow 
          label="Cotizador 3D" 
          description="La herramienta para subir archivos STL y obtener cotizaciones en tiempo real."
          checked={settings.show_quoter} 
          onChange={() => handleToggle("show_quoter")} 
        />
        <hr className="border-border" />
        <ToggleRow 
          label="Catálogo de Productos" 
          description="La lista completa de tus productos disponibles con buscador y filtros."
          checked={settings.show_catalog} 
          onChange={() => handleToggle("show_catalog")} 
        />
        <hr className="border-border" />
        <ToggleRow 
          label="Servicios" 
          description="La lista de servicios adicionales (impresión 3D, letreros, eventos, etc)."
          checked={settings.show_services} 
          onChange={() => handleToggle("show_services")} 
        />
        <hr className="border-border" />
        <ToggleRow 
          label="Reseñas y Testimonios" 
          description="Los comentarios y valoraciones de los clientes."
          checked={settings.show_reviews} 
          onChange={() => handleToggle("show_reviews")} 
        />
      </div>

      <div className="mt-8 flex items-center justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-105 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex flex-col">
        <span className="font-bold">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}
