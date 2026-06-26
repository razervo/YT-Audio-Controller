import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Shipment } from '../types';
import { ShipmentCard } from './ShipmentCard';
import { GripVertical } from 'lucide-react';

interface Props {
  shipment: Shipment;
  onUpdate: (shipment: Shipment) => void;
  onDelete: (id: string) => void;
}

export const SortableShipmentItem: React.FC<Props> = ({ shipment, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: shipment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        {...attributes}
        {...listeners}
        className="p-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <ShipmentCard
          shipment={shipment}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
