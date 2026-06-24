export interface Shipment {
  id: string;
  customerName: string;
  address: string;
  landmark: string;
  priority: boolean;
  area?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  order: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}
