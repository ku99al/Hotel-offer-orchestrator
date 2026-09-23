import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import suppliersRouter from './routes/suppliers.routes';
import healthRouter from './routes/health.routes';
import hotelsRouter from './routes/hotels.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Suppliers endpoints: GET /supplierA/hotels and GET /supplierB/hotels
app.use('/', suppliersRouter);
app.use('/suppliers', suppliersRouter);

// Health check endpoint: GET /health
app.use('/', healthRouter);

// Orchestrated hotels endpoint: GET /api/hotels
app.use('/api/hotels', hotelsRouter);
app.use('/api', hotelsRouter);

// Root informational endpoint
app.get('/', (_req: Request, res: Response) => {
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

export default app;
