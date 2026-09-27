import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories" as any)({
  component: AdminCategories,
});

export type Category = {
  id: string;
  label: string;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "fiestas", label: "Fiestas y eventos" },
  { id: "madera", label: "Madera y láser" },
  { id: "3d", label: "Impresión 3D" },
  { id: "postres", label: "Postres saludables" },
  { id: "juguetes", label: "Juguetes 3D y fidgets" },
];

function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: row, error } = await (supabase as any)
        .from("app_content")
        .select("data")
        .eq("id", "categories")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      if (row?.data && Array.isArray(row.data)) {
        setCategories(row.data);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar categorías.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("app_content").upsert({
        id: "categories",
        data: categories,
        updated_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      toast.success("Catálogos guardados correctamente");
    } catch (e: any) {
      console.error(e);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newId = `cat_${Math.random().toString(36).substr(2, 6)}`;
    setCategories([...categories, { id: newId, label: "Nueva Categoría" }]);
  };

  const removeCategory = (index: number) => {
    if (confirm("¿Seguro que quieres borrar este catálogo? Los productos asociados quedarán sin categoría visible.")) {
      const copy = [...categories];
      copy.splice(index, 1);
      setCategories(copy);
    }
  };

  const updateCategory = (index: number, label: string) => {
    const copy = [...categories];
    const item = copy[index];
    if (!item) return;
    item.label = label;
    setCategories(copy);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...categories];
    const a = copy[index - 1]!;
    const b = copy[index]!;
    copy[index - 1] = b;
    copy[index] = a;
    setCategories(copy);
  };

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const copy = [...categories];
    const a = copy[index + 1]!;
    const b = copy[index]!;
    copy[index + 1] = b;
    copy[index] = a;
    setCategories(copy);
  };

  if (loading) return <div className="p-8 text-muted-foreground">Cargando catálogos...</div>;

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black mb-2">Gestor de Catálogos</h2>
          <p className="text-muted-foreground">
            Crea, renombra y ordena las categorías de tu tienda.
          </p>
        </div>
        <button
          onClick={addCategory}
          className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 font-bold text-foreground transition-colors hover:bg-muted/80"
        >
          <Plus className="h-4 w-4" /> Agregar Catálogo
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm transition-all hover:border-amber-500/50">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => moveUp(i)} 
                disabled={i === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ▲
              </button>
              <button 
                onClick={() => moveDown(i)} 
                disabled={i === categories.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                value={cat.label}
                onChange={(e) => updateCategory(i, e.target.value)}
                className="w-full bg-transparent font-bold outline-none text-lg"
                placeholder="Nombre de la categoría"
              />
              <span className="text-xs text-muted-foreground font-mono">ID: {cat.id}</span>
            </div>
            
            <button
              onClick={() => removeCategory(i)}
              className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
              title="Borrar categoría"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
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
