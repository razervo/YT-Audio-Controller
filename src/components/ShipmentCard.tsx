import React, { useState } from 'react';
import { Phone, MapPin, Edit2, Trash2, CheckCircle } from 'lucide-react';
import type { Shipment, ShipmentStatus } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  shipment: Shipment;
  onUpdate: (shipment: Shipment) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS: ShipmentStatus[] = [
  'Pending', 'Delivered', 'House Locked', 'Call Later', 'Wrong Address', 'Shifted', 'Refused', 'Out of Station'
];

export const ShipmentCard: React.FC<Props> = ({ shipment, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(shipment);

  const handleSave = () => {
    onUpdate(edited);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-500 space-y-3 animate-in fade-in zoom-in duration-200">
        <input
          value={edited.customerName}
          onChange={e => setEdited({...edited, customerName: e.target.value})}
          className="w-full font-bold border-b p-1 focus:outline-none"
          placeholder="Name"
        />
        <input
          value={edited.phone}
          onChange={e => setEdited({...edited, phone: e.target.value})}
          className="w-full text-sm border-b p-1 focus:outline-none"
          placeholder="Phone"
        />
        <textarea
          value={edited.address}
          onChange={e => setEdited({...edited, address: e.target.value})}
          className="w-full text-sm border-b p-1 focus:outline-none"
          placeholder="Address"
          rows={2}
        />
        <input
          value={edited.landmark}
          onChange={e => setEdited({...edited, landmark: e.target.value})}
          className="w-full text-sm border-b p-1 focus:outline-none text-blue-600"
          placeholder="Landmark"
        />
        <div className="flex gap-2">
          <select
            value={edited.status}
            onChange={e => setEdited({...edited, status: e.target.value as ShipmentStatus})}
            className="flex-1 text-sm border rounded p-1"
          >
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-bold">Save</button>
          <button onClick={() => setIsEditing(false)} className="bg-gray-200 px-4 py-1 rounded-lg text-sm">Cancel</button>
        </div>
      </div>
    );
  }

  const statusColors = {
    'Pending': 'bg-gray-100 text-gray-600',
    'Delivered': 'bg-green-100 text-green-700',
    'House Locked': 'bg-orange-100 text-orange-700',
    'Refused': 'bg-red-100 text-red-700',
    'default': 'bg-blue-100 text-blue-700'
  };

  return (
    <div className={cn(
      "bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group transition-all hover:shadow-md",
      shipment.status === 'Delivered' && "opacity-60",
      shipment.priority && "border-l-4 border-l-red-500"
    )}>
      {shipment.priority && (
        <div className="absolute top-0 right-12 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-b-md">
          PRIORITY
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 truncate">{shipment.customerName}</h3>
            {shipment.cod && (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-black">
                COD: ₹{shipment.cod}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">{shipment.area}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => onDelete(shipment.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {shipment.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3" /> {shipment.phone}
          </div>
        )}
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3 mt-0.5 flex-none" />
          <span className="line-clamp-2">{shipment.address}</span>
        </div>
        {shipment.landmark && (
          <p className="text-[10px] text-blue-600 font-bold italic ml-5">📍 {shipment.landmark}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full",
          statusColors[shipment.status as keyof typeof statusColors] || statusColors.default
        )}>
          {shipment.status}
        </div>
        <div className="flex gap-2">
           {shipment.phone && (
             <a
                href={`tel:${shipment.phone}`}
                className="p-2 bg-gray-50 rounded-lg text-gray-600"
              >
                <Phone className="w-4 h-4" />
              </a>
           )}
            <button
              onClick={() => onUpdate({...shipment, status: shipment.status === 'Delivered' ? 'Pending' : 'Delivered'})}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                shipment.status === 'Delivered' ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              <CheckCircle className="w-4 h-4" />
              {shipment.status === 'Delivered' ? 'Delivered' : 'Mark Delivered'}
            </button>
        </div>
      </div>
    </div>
  );
};
