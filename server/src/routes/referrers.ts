import { Router, Request, Response } from 'express';
import { Referrer } from '../models/Referrer';

const router = Router();

// GET /api/referrers
router.get('/', async (req: Request, res: Response) => {
  try {
    const referrers = await Referrer.find().sort({ name: 1 });
    res.json(referrers);
  } catch {
    res.status(550).json({ error: 'Failed to fetch referrers' });
  }
});

export default router;
