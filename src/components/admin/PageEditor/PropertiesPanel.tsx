// src/components/admin/PageEditor/PropertiesPanel.tsx
import React, { useState, useEffect } from 'react';

/**
 * Simple inspector for a selected section. Allows editing common fields:
 * - title / heading
 * - text / description
 * - background colour
 * - visibility toggle
 * The component mirrors the premium UI of the rest of the admin (glass card,
 * subtle gradients, smooth transitions).
 */
export function PropertiesPanel({
  section,
  onChange,
}: {
  section: any | undefined;
  onChange: (updated: any) => void;
}) {
  const [local, setLocal] = useState<any>(section || {});

  // Keep local copy in sync when a different section is selected
  useEffect(() => {
    setLocal(section || {});
  }, [section]);

  if (!section) return null;

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg space-y-4">
      <h3 className="text-lg font-medium">Propiedades</h3>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          value={local.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {/* Text / content */}
      <div>
        <label className="block text-sm font-medium mb-1">Texto</label>
        <textarea
          rows={3}
          value={local.content || ''}
          onChange={(e) => handleFieldChange('content', e.target.value)}
          className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {/* Background colour */}
      <div>
        <label className="block text-sm font-medium mb-1">Color de fondo</label>
        <input
          type="color"
          value={local.bgColor || '#ffffff'}
          onChange={(e) => handleFieldChange('bgColor', e.target.value)}
          className="w-full h-10 p-0 border rounded"
        />
      </div>
      {/* Visibility */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={local.visible ?? true}
          onChange={(e) => handleFieldChange('visible', e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span className="text-sm">Visible en página</span>
      </div>
    </div>
  );
}
