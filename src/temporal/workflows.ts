import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { AggregatedHotel } from '../types/hotel.types';

const { fetchSupplierA, fetchSupplierB, aggregateOffers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

/**
 * Temporal workflow that coordinates querying multiple hotel suppliers concurrently
 * and aggregates/dedupes the results into a consolidated offer list.
 */
export async function dedupeHotelsWorkflow(city: string): Promise<AggregatedHotel[]> {
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
export const orchestrateHotelOffersWorkflow = dedupeHotelsWorkflow;
