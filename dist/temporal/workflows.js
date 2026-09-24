"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrateHotelOffersWorkflow = void 0;
exports.dedupeHotelsWorkflow = dedupeHotelsWorkflow;
const workflow_1 = require("@temporalio/workflow");
const { fetchSupplierA, fetchSupplierB, aggregateOffers } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '10 seconds',
});
/**
 * Temporal workflow that coordinates querying multiple hotel suppliers concurrently
 * and aggregates/dedupes the results into a consolidated offer list.
 */
async function dedupeHotelsWorkflow(city) {
    // Fetch from suppliers in parallel via activities
    const [hotelsA, hotelsB] = await Promise.all([
        fetchSupplierA(city),
        fetchSupplierB(city),
    ]);
    // Consolidate and compute best prices via activity
    const result = await aggregateOffers(hotelsA, hotelsB);
    return result;
}
// Export alias for backward compatibility
exports.orchestrateHotelOffersWorkflow = dedupeHotelsWorkflow;
