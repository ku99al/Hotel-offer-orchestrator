"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSupplierA = fetchSupplierA;
exports.fetchSupplierB = fetchSupplierB;
exports.aggregateOffers = aggregateOffers;
const supplierA_data_1 = require("../suppliers/supplierA.data");
const supplierB_data_1 = require("../suppliers/supplierB.data");
async function fetchSupplierA(city) {
    console.log(`[Temporal Activity: fetchSupplierA] Querying Supplier A for city: "${city}"`);
    const filtered = supplierA_data_1.supplierAHotels.filter((h) => h.city.toLowerCase() === city.trim().toLowerCase());
    console.log(`[Temporal Activity: fetchSupplierA] Retrieved ${filtered.length} hotels from Supplier A`);
    return filtered;
}
async function fetchSupplierB(city) {
    console.log(`[Temporal Activity: fetchSupplierB] Querying Supplier B for city: "${city}"`);
    const filtered = supplierB_data_1.supplierBHotels.filter((h) => h.city.toLowerCase() === city.trim().toLowerCase());
    console.log(`[Temporal Activity: fetchSupplierB] Retrieved ${filtered.length} hotels from Supplier B`);
    return filtered;
}
async function aggregateOffers(hotelsA, hotelsB) {
    console.log(`[Temporal Activity: aggregateOffers] Starting deduplication for ${hotelsA.length} Supplier A hotels and ${hotelsB.length} Supplier B hotels`);
    const mapByName = new Map();
    // Process Supplier A
    for (const h of hotelsA) {
        const netCost = h.price - (h.price * h.commissionPct) / 100;
        const offer = {
            supplier: 'supplierA',
            hotelId: h.hotelId,
            price: h.price,
            commissionPct: h.commissionPct,
            netCost,
        };
        if (!mapByName.has(h.name)) {
            mapByName.set(h.name, { city: h.city, offers: [offer] });
        }
        else {
            mapByName.get(h.name).offers.push(offer);
        }
    }
    // Process Supplier B
    for (const h of hotelsB) {
        const netCost = h.price - (h.price * h.commissionPct) / 100;
        const offer = {
            supplier: 'supplierB',
            hotelId: h.hotelId,
            price: h.price,
            commissionPct: h.commissionPct,
            netCost,
        };
        if (!mapByName.has(h.name)) {
            mapByName.set(h.name, { city: h.city, offers: [offer] });
        }
        else {
            mapByName.get(h.name).offers.push(offer);
        }
    }
    const aggregated = [];
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
