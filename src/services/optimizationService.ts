import type { Shipment } from '../types';

export function optimizeRoute(shipments: Shipment[]): Shipment[] {
  // Sort logic:
  // 1. Priority shipments first
  // 2. Group by Area
  // 3. Preserve original order within groups (as it reflects top-to-bottom extraction)

  return [...shipments].sort((a, b) => {
    // Priority first
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;

    // Group by Area
    const areaA = a.area || '';
    const areaB = b.area || '';
    if (areaA < areaB) return -1;
    if (areaA > areaB) return 1;

    // Preserve original order
    return a.order - b.order;
  });
}

export function groupShipmentsByArea(shipments: Shipment[]): Record<string, Shipment[]> {
  return shipments.reduce((groups, shipment) => {
    const area = shipment.area || 'Unknown';
    if (!groups[area]) {
      groups[area] = [];
    }
    groups[area].push(shipment);
    return groups;
  }, {} as Record<string, Shipment[]>);
}
