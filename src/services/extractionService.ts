import type { Shipment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function extractShipments(ocrText: string): Shipment[] {
  const shipments: Shipment[] = [];
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentShipment: Partial<Shipment> | null = null;
  let orderCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isWaybill = line.toUpperCase().includes('WAYBILL:');
    const isName = /^[A-Z\s]{3,}$/.test(line) && !isWaybill && !isPriority(line) && !line.toUpperCase().includes('LANDMARK:');
    const isLandmark = line.toUpperCase().includes('LANDMARK:');
    const isPrio = isPriority(line);

    if (isWaybill || isName) {
      if (isWaybill) {
        if (currentShipment && currentShipment.address && currentShipment.address.includes('WAYBILL')) {
          shipments.push(finalizeShipment(currentShipment, orderCounter++));
          currentShipment = null;
        }
        if (!currentShipment) {
          currentShipment = { id: uuidv4(), customerName: 'Pending...', address: line, landmark: '', priority: false };
        } else {
          currentShipment.address = currentShipment.address ? `${currentShipment.address}, ${line}` : line;
        }
      } else if (isName) {
        if (currentShipment && currentShipment.customerName && currentShipment.customerName !== 'Pending...') {
          shipments.push(finalizeShipment(currentShipment, orderCounter++));
          currentShipment = null;
        }
        if (!currentShipment) {
          currentShipment = { id: uuidv4(), customerName: line, address: '', landmark: '', priority: false };
        } else {
          currentShipment.customerName = line;
        }
      }
    } else if (currentShipment) {
      if (isLandmark) {
        currentShipment.landmark = line.replace(/LANDMARK:?/i, '').trim();
      } else if (isPrio) {
        currentShipment.priority = true;
      } else {
        currentShipment.address = currentShipment.address
          ? `${currentShipment.address}, ${line}`
          : line;
      }
    }
  }

  if (currentShipment) {
    shipments.push(finalizeShipment(currentShipment, orderCounter++));
  }

  return shipments;
}

function isPriority(line: string): boolean {
  const text = line.toUpperCase();
  return text.includes('EXPRESS') || text.includes('PRIORITY') || text.includes('URGENT') || text.includes('⚡');
}

function finalizeShipment(partial: Partial<Shipment>, order: number): Shipment {
  let name = partial.customerName || 'Unknown';
  if (name === 'Pending...') name = 'Unknown';

  return {
    id: partial.id || uuidv4(),
    customerName: name,
    address: partial.address || 'Unknown Address',
    landmark: partial.landmark || '',
    priority: !!partial.priority,
    order: order,
  };
}
