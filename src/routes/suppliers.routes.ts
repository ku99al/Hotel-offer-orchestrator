import { Router, Request, Response } from 'express';
import { supplierAHotels } from '../suppliers/supplierA.data';
import { supplierBHotels } from '../suppliers/supplierB.data';

const router = Router();

/**
 * GET /supplierA/hotels
 * Query params: ?city=<cityName>
 */
router.get('/supplierA/hotels', (req: Request, res: Response) => {
  const { city } = req.query;

  if (typeof city === 'string' && city.trim() !== '') {
    const filtered = supplierAHotels.filter(
      (hotel) => hotel.city.toLowerCase() === city.trim().toLowerCase()
    );
    return res.json(filtered);
  }

  return res.json(supplierAHotels);
});

/**
 * GET /supplierB/hotels
 * Query params: ?city=<cityName>
 */
router.get('/supplierB/hotels', (req: Request, res: Response) => {
  const { city } = req.query;

  if (typeof city === 'string' && city.trim() !== '') {
    const filtered = supplierBHotels.filter(
      (hotel) => hotel.city.toLowerCase() === city.trim().toLowerCase()
    );
    return res.json(filtered);
  }

  return res.json(supplierBHotels);
});

export default router;
