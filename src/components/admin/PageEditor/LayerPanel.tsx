// src/components/admin/PageEditor/LayerPanel.tsx
import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';

/**
 * Draggable list item for a layer.
 */
function SortableItem({ id, title, selected, onSelect }: { id: string; title: string; selected: boolean; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(id)}
      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selected ? 'bg-gradient-to-r from-indigo-200 to-purple-200' : 'hover:bg-gray-100'}`}
    >
      <GripHorizontal className="mr-2 w-4 h-4 text-gray-500" />
      <span className="flex-1 truncate">{title}</span>
    </li>
  );
}

/**
 * LayerPanel – left sidebar showing the page sections (layers) and allowing reordering.
 */
export function LayerPanel({
  sections,
  selectedId,
  onSelect,
  onReorder,
}: {
  sections: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (newOrder: any[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over?.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <div className="rounded-lg bg-white p-3 shadow-lg h-full overflow-auto">
      <h3 className="text-lg font-medium mb-2">Capas</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {sections.map((sec) => (
              <SortableItem
                key={sec.id}
                id={sec.id}
                title={sec.title || sec.id}
                selected={selectedId === sec.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
