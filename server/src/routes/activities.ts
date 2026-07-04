import { Router, Request, Response } from 'express';
import { Activity } from '../models/Activity';
import { Lead } from '../models/Lead';

const router = Router();

// GET /api/activities?leadId=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.query;
    if (!leadId) {
      return res.status(400).json({ error: 'leadId parameter is required' });
    }
    const activities = await Activity.find({ leadId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST /api/activities
router.post('/', async (req: Request, res: Response) => {
  try {
    const { leadId, type, title, description } = req.body;
    if (!leadId || !type || !title) {
      return res.status(400).json({ error: 'leadId, type, and title are required' });
    }
    const createdBy = (req as any).userId;
    const activity = new Activity({
      leadId,
      type,
      title,
      description,
      createdBy,
    });
    await activity.save();

    // Update the corresponding Lead's lastActivityAt timestamp
    await Lead.findByIdAndUpdate(leadId, { lastActivityAt: new Date() });

    res.status(201).json(activity);
  } catch {
    res.status(400).json({ error: 'Failed to create activity' });
  }
});

export default router;
