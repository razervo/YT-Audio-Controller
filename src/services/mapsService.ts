import type { Shipment } from '../types';

export function getIndividualNavigationUrl(shipment: Shipment): string {
  const query = encodeURIComponent(`${shipment.address} ${shipment.landmark}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getMultiStopRouteUrl(shipments: Shipment[]): string {
  if (shipments.length === 0) return '';

  // Google Maps URL for directions: https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=LAST_STOP&waypoints=STOP1|STOP2...
  // Limit to ~10-20 stops as Google Maps has limits

  const lastStop = shipments[shipments.length - 1];
  const destination = encodeURIComponent(`${lastStop.address} ${lastStop.landmark}`);

  const waypoints = shipments.slice(0, -1)
    .map(s => encodeURIComponent(`${s.address} ${s.landmark}`))
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${destination}${waypoints ? '&waypoints=' + waypoints : ''}`;
}
