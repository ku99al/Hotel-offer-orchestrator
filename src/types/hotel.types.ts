export interface Hotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface SupplierOffer {
  supplier: 'supplierA' | 'supplierB';
  hotelId: string;
  price: number;
  commissionPct: number;
  netCost: number;
}

export interface AggregatedHotel {
  name: string;
  city: string;
  bestPrice: number;
  bestSupplier: 'supplierA' | 'supplierB';
  offers: SupplierOffer[];
}

export interface FlattenedHotelOffer {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

