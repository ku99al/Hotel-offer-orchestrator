"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * Helper to ping a supplier endpoint with a short timeout.
 * Returns 'up' if response status is 2xx, otherwise 'down'.
 */
const checkSupplierEndpoint = async (url, timeoutMs = 2000) => {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(timeoutMs),
        });
        return response.ok ? 'up' : 'down';
    }
    catch {
        return 'down';
    }
};
/**
 * GET /health
 *
 * Checks both supplier endpoints (with a 2-second timeout) and reports their health.
 * The overall status remains "UP" as long as the service itself is responding.
 */
router.get('/health', async (req, res) => {
    const host = req.get('host') || `localhost:${process.env.PORT || 3000}`;
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const [supplierAStatus, supplierBStatus] = await Promise.all([
        checkSupplierEndpoint(`${baseUrl}/supplierA/hotels?city=delhi`, 2000),
        checkSupplierEndpoint(`${baseUrl}/supplierB/hotels?city=delhi`, 2000),
    ]);
    return res.status(200).json({
        status: 'UP',
        service: 'hotel-offer-orchestrator',
        timestamp: new Date().toISOString(),
        suppliers: {
            supplierA: supplierAStatus,
            supplierB: supplierBStatus,
        },
    });
});
exports.default = router;
