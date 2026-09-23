"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../temporal/client");
const redisClient_1 = require("../redis/redisClient");
const router = (0, express_1.Router)();
/**
 * GET /api/hotels?city=<cityName>&minPrice=<min>&maxPrice=<max>
 *
 * Rules:
 * 1. ALWAYS executes runDedupeWorkflow(city) via Temporal first — never skipped or cached before the call.
 * 2. Saves the flattened workflow result into Redis:
 *    - Sorted Set: key "hotels:<city>", member = hotel name, score = price
 *    - Hash: key "hotels:<city>:data", field = hotel name, value = JSON.stringify(hotel)
 * 3. If minPrice or maxPrice is provided, uses Redis ZRANGEBYSCORE to query hotel names
 *    within bounds and looks up full JSON objects from the hash.
 * 4. If neither is provided, returns the full flattened array.
 */
const handleGetHotels = async (req, res) => {
    const city = req.query.city || 'delhi';
    try {
        // 1. ALWAYS execute Temporal workflow orchestration first (NEVER bypass or skip)
        const workflowResult = await (0, client_1.runDedupeWorkflow)(city);
        // 2. Map workflow result to plain flat JSON array after retrieval:
        // [{ "name": string, "price": number, "supplier": string, "commissionPct": number }]
        const flattenedResponse = workflowResult.map((hotel) => {
            const bestOffer = hotel.offers && hotel.offers.length > 0 ? hotel.offers[0] : undefined;
            return {
                name: hotel.name,
                price: hotel.bestPrice,
                supplier: hotel.bestSupplier,
                commissionPct: bestOffer ? bestOffer.commissionPct : 0,
            };
        });
        // Keys for Redis Sorted Set and Hash
        const sortedSetKey = `hotels:${city.toLowerCase()}`;
        const hashKey = `hotels:${city.toLowerCase()}:data`;
        // 3. Save flattened array into Redis
        const redisClient = await (0, redisClient_1.getRedisClient)();
        if (redisClient) {
            try {
                if (flattenedResponse.length > 0) {
                    // Store in Sorted Set: key "hotels:<city>", member = hotel.name, score = hotel.price
                    const sortedSetMembers = flattenedResponse.map((hotel) => ({
                        score: hotel.price,
                        value: hotel.name,
                    }));
                    await redisClient.zAdd(sortedSetKey, sortedSetMembers);
                    // Store full JSON per hotel in Redis Hash: key "hotels:<city>:data", field = hotel.name
                    for (const hotel of flattenedResponse) {
                        await redisClient.hSet(hashKey, hotel.name, JSON.stringify(hotel));
                    }
                }
            }
            catch (redisWriteError) {
                console.warn('[Redis] Failed to write sorted set or hash:', redisWriteError.message);
            }
        }
        // 4. Read query parameters for price filtering
        const minPriceQuery = req.query.minPrice;
        const maxPriceQuery = req.query.maxPrice;
        const hasMinPrice = minPriceQuery !== undefined && minPriceQuery !== '';
        const hasMaxPrice = maxPriceQuery !== undefined && maxPriceQuery !== '';
        // 5. If minPrice or maxPrice is provided, filter using Redis ZRANGEBYSCORE + Hash lookup
        if (hasMinPrice || hasMaxPrice) {
            if (redisClient) {
                try {
                    const min = hasMinPrice ? Number(minPriceQuery) : '-inf';
                    const max = hasMaxPrice ? Number(maxPriceQuery) : '+inf';
                    // Query sorted set with min/max bounds to get filtered hotel names
                    const filteredNames = await redisClient.zRangeByScore(sortedSetKey, min, max);
                    if (filteredNames.length === 0) {
                        return res.json([]);
                    }
                    // Look up each hotel's JSON from the hash
                    const hotelJsonStrings = await redisClient.hmGet(hashKey, filteredNames);
                    const filteredHotels = hotelJsonStrings
                        .filter((jsonStr) => jsonStr !== null)
                        .map((jsonStr) => JSON.parse(jsonStr));
                    return res.json(filteredHotels);
                }
                catch (redisFilterError) {
                    console.warn('[Redis] Error filtering by score from Redis:', redisFilterError.message);
                }
            }
            // Fallback in-memory filter if Redis client is unavailable
            const min = hasMinPrice ? Number(minPriceQuery) : -Infinity;
            const max = hasMaxPrice ? Number(maxPriceQuery) : Infinity;
            const memoryFiltered = flattenedResponse.filter((hotel) => hotel.price >= min && hotel.price <= max);
            return res.json(memoryFiltered);
        }
        // 6. If neither minPrice nor maxPrice is provided, return full flattened array
        return res.json(flattenedResponse);
    }
    catch (error) {
        console.error('[Temporal Error] Failed to execute dedupe workflow:', error.message);
        return res.status(503).json({
            error: 'Temporal service unavailable',
            message: error.message,
        });
    }
};
router.get('/', handleGetHotels);
router.get('/hotels', handleGetHotels);
exports.default = router;
