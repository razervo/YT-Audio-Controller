import type { Shipment } from '../types';

export function optimizeRoute(shipments: Shipment[]): Shipment[] {
  // Sort logic Phase 2:
  // 1. Priority shipments first
  // 2. Group by Area
  // 3. Nearest sequence inside each area (simulated by preserve order or alphabetical sub-area for now)

  return [...shipments].sort((a, b) => {
    // Priority first
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;

    // Group by Area
    if (a.area !== b.area) {
      return a.area.localeCompare(b.area);
    }

    // Preserve top-to-bottom extraction order
    return a.order - b.order;
  });
}

export function calculateStats(shipments: Shipment[]): any {
  const areas = new Set(shipments.map(s => s.area));
  const completed = shipments.filter(s => s.status === 'Delivered').length;

  return {
    total: shipments.length,
    priority: shipments.filter(s => s.priority).length,
    completed: completed,
    remaining: shipments.length - completed,
    areas: areas.size,
    estimatedTime: `${shipments.length * 5} min`, // Simple heuristic
    estimatedDistance: `${shipments.length * 0.8} km`
  };
}
