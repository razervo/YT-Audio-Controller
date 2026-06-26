export type ShipmentStatus = 'Pending' | 'Delivered' | 'House Locked' | 'Call Later' | 'Wrong Address' | 'Shifted' | 'Refused' | 'Out of Station' | 'Custom';

export interface Shipment {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  landmark: string;
  area: string;
  priority: boolean;
  cod: string;
  remark: string;
  status: ShipmentStatus;
  order: number;
  waybill?: string;
  timestamp: number;
}

export interface AppStats {
  total: number;
  priority: number;
  completed: number;
  remaining: number;
  areas: number;
  estimatedTime: string;
  estimatedDistance: string;
}
