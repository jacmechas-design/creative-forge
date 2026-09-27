// src/components/admin/PageEditor/PreviewPane.tsx
import React from 'react';
/**
 * Simple live preview that renders each section according to its type.
 * For demo purposes we support a few generic types: hero, textBlock, image, catalog.
 * The component uses the same styling system as the public site so the admin sees
 * exactly how it will look to customers.
 */
export function PreviewPane({ sections, selectedId }: { sections: any[]; selectedId: string | null }) {
  return (
    <div className="p-4 space-y-6">
      {sections.map((sec) => (
        <section
          key={sec.id}
          className={`p-4 rounded-lg transition-shadow ${selectedId === sec.id ? 'shadow-xl ring-2 ring-indigo-500' : 'shadow'} ${sec.visible === false ? 'opacity-50' : ''}`}
          style={{ backgroundColor: sec.bgColor || 'transparent' }}
        >
          {/* Render based on a simple type field – you can extend this as needed */}
          {sec.type === 'hero' && (
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2" style={{ color: sec.titleColor || '#000' }}>{sec.title || 'Título Hero'}</h1>
              <p className="text-lg" style={{ color: sec.textColor || '#333' }}>{sec.content || 'Subtítulo del hero'}</p>
            </div>
          )}
          {sec.type === 'textBlock' && (
            <div>
              <h2 className="text-2xl font-semibold mb-1">{sec.title}</h2>
              <p>{sec.content}</p>
            </div>
          )}
          {sec.type === 'image' && sec.imageUrl && (
            <img src={sec.imageUrl} alt={sec.title || 'Imagen'} className="w-full rounded" />
          )}
          {/* Fallback generic render */}
          {!sec.type && (
            <div>
              <h3 className="font-medium">{sec.title || sec.id}</h3>
              <p>{sec.content}</p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
