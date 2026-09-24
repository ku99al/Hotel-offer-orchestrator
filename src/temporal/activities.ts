import { Hotel, AggregatedHotel, SupplierOffer } from '../types/hotel.types';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://app:3000';

export async function fetchSupplierA(city: string): Promise<Hotel[]> {
  console.log(`[Temporal Activity: fetchSupplierA] Querying Supplier A for city: "${city}"`);
  try {
    const response = await fetch(`${APP_BASE_URL}/supplierA/hotels?city=${encodeURIComponent(city)}`);
    if (!response.ok) throw new Error(`Supplier A returned ${response.status}`);
    const data = await response.json() as Hotel[];
    console.log(`[Temporal Activity: fetchSupplierA] Retrieved ${data.length} hotels from Supplier A`);
    return data;
  } catch (error) {
    console.error(`[Temporal Activity: fetchSupplierA] Error:`, (error as Error).message);
    return [];
  }
}

export async function fetchSupplierB(city: string): Promise<Hotel[]> {
  console.log(`[Temporal Activity: fetchSupplierB] Querying Supplier B for city: "${city}"`);
  try {
    const response = await fetch(`${APP_BASE_URL}/supplierB/hotels?city=${encodeURIComponent(city)}`);
    if (!response.ok) throw new Error(`Supplier B returned ${response.status}`);
    const data = await response.json() as Hotel[];
    console.log(`[Temporal Activity: fetchSupplierB] Retrieved ${data.length} hotels from Supplier B`);
    return data;
  } catch (error) {
    console.error(`[Temporal Activity: fetchSupplierB] Error:`, (error as Error).message);
    return [];
  }
}

export async function aggregateOffers(
  hotelsA: Hotel[],
  hotelsB: Hotel[]
): Promise<AggregatedHotel[]> {
  console.log(
    `[Temporal Activity: aggregateOffers] Starting deduplication for ${hotelsA.length} Supplier A hotels and ${hotelsB.length} Supplier B hotels`
  );

  const mapByName = new Map<string, { city: string; offers: SupplierOffer[] }>();

  // Process Supplier A
  for (const h of hotelsA) {
    const netCost = h.price - (h.price * h.commissionPct) / 100;
    const offer: SupplierOffer = {
      supplier: 'supplierA',
      hotelId: h.hotelId,
      price: h.price,
      commissionPct: h.commissionPct,
      netCost,
    };
    if (!mapByName.has(h.name)) {
      mapByName.set(h.name, { city: h.city, offers: [offer] });
    } else {
      mapByName.get(h.name)!.offers.push(offer);
    }
  }

  // Process Supplier B
  for (const h of hotelsB) {
    const netCost = h.price - (h.price * h.commissionPct) / 100;
    const offer: SupplierOffer = {
      supplier: 'supplierB',
      hotelId: h.hotelId,
      price: h.price,
      commissionPct: h.commissionPct,
      netCost,
    };
    if (!mapByName.has(h.name)) {
      mapByName.set(h.name, { city: h.city, offers: [offer] });
    } else {
      mapByName.get(h.name)!.offers.push(offer);
    }
  }

  const aggregated: AggregatedHotel[] = [];

  for (const [name, data] of mapByName.entries()) {
    // Sort offers by price ascending (cheapest first)
    const sortedOffers = [...data.offers].sort((a, b) => a.price - b.price);
    const bestOffer = sortedOffers[0];

    aggregated.push({
      name,
      city: data.city,
      bestPrice: bestOffer.price,
      bestSupplier: bestOffer.supplier,
      offers: sortedOffers,
    });
  }

  console.log(`[Temporal Activity: aggregateOffers] Completed deduplication: ${aggregated.length} consolidated hotels computed`);
  return aggregated;
}
