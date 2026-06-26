import type { Shipment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function extractShipments(ocrText: string): Shipment[] {
  const shipments: Shipment[] = [];
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentShipment: Partial<Shipment> | null = null;
  let orderCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isWaybill = /WAYBILL[:\s]*(\d+)/i.test(line);
    const waybillMatch = line.match(/WAYBILL[:\s]*(\d+)/i);
    const isName = /^[A-Z\s]{3,25}$/.test(line) && !isWaybill && !isPriority(line) && !line.toUpperCase().includes('LANDMARK:');
    const isPhone = /(\d{10})/.test(line.replace(/\s/g, ''));
    const phoneMatch = line.replace(/\s/g, '').match(/(\d{10})/);
    const isLandmark = line.toUpperCase().includes('LANDMARK:');
    const isPrio = isPriority(line);
    const isCOD = /COD[:\s]*(\d+)/i.test(line) || /RS[:\s]*(\d+)/i.test(line);
    const codMatch = line.match(/(?:COD|RS)[:\s]*(\d+)/i);

    if (isWaybill || isName) {
      if (currentShipment && (
          (isWaybill && currentShipment.waybill && currentShipment.waybill !== waybillMatch?.[1]) ||
          (isName && currentShipment.customerName && currentShipment.customerName !== 'Pending...' && currentShipment.customerName !== line)
      )) {
        shipments.push(finalizeShipment(currentShipment, orderCounter++));
        currentShipment = null;
      }

      if (!currentShipment) {
        currentShipment = {
          id: uuidv4(),
          customerName: isName ? line : 'Pending...',
          waybill: waybillMatch?.[1] || '',
          address: '',
          landmark: '',
          priority: false,
          phone: '',
          cod: '',
          status: 'Pending',
          remark: '',
          timestamp: Date.now()
        };
      } else {
        if (isWaybill) currentShipment.waybill = waybillMatch?.[1];
        if (isName && currentShipment.customerName === 'Pending...') currentShipment.customerName = line;
      }
    } else if (currentShipment) {
      if (isLandmark) {
        currentShipment.landmark = line.replace(/LANDMARK:?/i, '').trim();
      } else if (isPrio) {
        currentShipment.priority = true;
      } else if (isPhone && !currentShipment.phone) {
        currentShipment.phone = phoneMatch?.[1] || '';
      } else if (isCOD && !currentShipment.cod) {
        currentShipment.cod = codMatch?.[1] || '';
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

  return deduplicateShipments(shipments);
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
    phone: partial.phone || '',
    address: partial.address || 'Unknown Address',
    landmark: partial.landmark || '',
    area: partial.area || 'Other',
    priority: !!partial.priority,
    cod: partial.cod || '',
    status: partial.status || 'Pending',
    remark: partial.remark || '',
    order: order,
    waybill: partial.waybill || '',
    timestamp: partial.timestamp || Date.now()
  };
}

export function deduplicateShipments(shipments: Shipment[]): Shipment[] {
  const seen = new Map<string, Shipment>();

  for (const s of shipments) {
    const key = s.waybill || `${s.customerName}-${s.address.substring(0, 20)}`;
    if (!seen.has(key)) {
      seen.set(key, s);
    } else {
      const existing = seen.get(key)!;
      existing.phone = existing.phone || s.phone;
      existing.landmark = existing.landmark || s.landmark;
      existing.cod = existing.cod || s.cod;
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.order - b.order);
}
