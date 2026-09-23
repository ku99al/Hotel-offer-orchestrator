"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const suppliers_routes_1 = __importDefault(require("./routes/suppliers.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const hotels_routes_1 = __importDefault(require("./routes/hotels.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Suppliers endpoints: GET /supplierA/hotels and GET /supplierB/hotels
app.use('/', suppliers_routes_1.default);
app.use('/suppliers', suppliers_routes_1.default);
// Health check endpoint: GET /health
app.use('/', health_routes_1.default);
// Orchestrated hotels endpoint: GET /api/hotels
app.use('/api/hotels', hotels_routes_1.default);
app.use('/api', hotels_routes_1.default);
// Root informational endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'hotel-offer-orchestrator',
        status: 'running',
        endpoints: {
            health: 'GET /health',
            supplierA: 'GET /supplierA/hotels?city=delhi',
            supplierB: 'GET /supplierB/hotels?city=delhi',
            orchestratedHotels: 'GET /api/hotels?city=delhi',
        },
    });
});
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[Server] Hotel Offer Orchestrator running on port ${PORT}`);
        console.log(`[Server] Supplier A: http://localhost:${PORT}/supplierA/hotels?city=delhi`);
        console.log(`[Server] Supplier B: http://localhost:${PORT}/supplierB/hotels?city=delhi`);
        console.log(`[Server] API Hotels: http://localhost:${PORT}/api/hotels?city=delhi`);
    });
}
exports.default = app;
