"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplierA_data_1 = require("../suppliers/supplierA.data");
const supplierB_data_1 = require("../suppliers/supplierB.data");
const router = (0, express_1.Router)();
/**
 * GET /supplierA/hotels
 * Query params: ?city=<cityName>
 */
router.get('/supplierA/hotels', (req, res) => {
    const { city } = req.query;
    if (typeof city === 'string' && city.trim() !== '') {
        const filtered = supplierA_data_1.supplierAHotels.filter((hotel) => hotel.city.toLowerCase() === city.trim().toLowerCase());
        return res.json(filtered);
    }
    return res.json(supplierA_data_1.supplierAHotels);
});
/**
 * GET /supplierB/hotels
 * Query params: ?city=<cityName>
 */
router.get('/supplierB/hotels', (req, res) => {
    const { city } = req.query;
    if (typeof city === 'string' && city.trim() !== '') {
        const filtered = supplierB_data_1.supplierBHotels.filter((hotel) => hotel.city.toLowerCase() === city.trim().toLowerCase());
        return res.json(filtered);
    }
    return res.json(supplierB_data_1.supplierBHotels);
});
exports.default = router;
