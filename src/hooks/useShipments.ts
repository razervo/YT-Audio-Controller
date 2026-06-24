import { useState, useEffect } from 'react';
import type { Shipment } from '../types';

export function useShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('route_pilot_shipments');
    if (stored) {
      setShipments(JSON.parse(stored));
    }
  }, []);

  const saveShipments = (newShipments: Shipment[]) => {
    setShipments(newShipments);
    localStorage.setItem('route_pilot_shipments', JSON.stringify(newShipments));
  };

  const addShipments = (newShipments: Shipment[]) => {
    const updated = [...shipments, ...newShipments];
    saveShipments(updated);
  };

  const clearShipments = () => {
    saveShipments([]);
  };

  const removeShipment = (id: string) => {
    saveShipments(shipments.filter(s => s.id !== id));
  };

  const updateShipment = (updated: Shipment) => {
    saveShipments(shipments.map(s => s.id === updated.id ? updated : s));
  };

  return {
    shipments,
    addShipments,
    saveShipments,
    clearShipments,
    removeShipment,
    updateShipment,
  };
}
