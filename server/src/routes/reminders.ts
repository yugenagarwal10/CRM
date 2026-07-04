import { Router, Request, Response } from 'express';
import { Reminder } from '../models/Reminder';
import { Activity } from '../models/Activity';

const router = Router();

// GET /api/reminders?filter=today|overdue|all&leadId=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const { filter, leadId } = req.query;
    const query: Record<string, unknown> = {};

    if (leadId) {
      query.leadId = leadId;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (filter === 'today') {
      query.date = today;
    } else if (filter === 'overdue') {
      query.date = { $lt: today };
    }

    const reminders = await Reminder.find(query)
      .populate('leadId', 'name company')
      .sort({ date: 1, time: 1 });

    res.json(reminders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// POST /api/reminders
router.post('/', async (req: Request, res: Response) => {
  try {
    const reminder = new Reminder(req.body);
    await reminder.save();
    const populated = await reminder.populate('leadId', 'name company');

    // Log activity
    const activity = new Activity({
      leadId: reminder.leadId,
      type: 'reminder_created',
      title: 'Reminder added',
      description: `Added reminder: "${reminder.title}" for ${reminder.date} at ${reminder.time}`,
    });
    await activity.save();

    res.status(201).json(populated);
  } catch {
    res.status(400).json({ error: 'Failed to create reminder' });
  }
});

// PUT /api/reminders/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('leadId', 'name company');
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json(reminder);
  } catch {
    res.status(400).json({ error: 'Failed to update reminder' });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    // Log activity
    const activity = new Activity({
      leadId: reminder.leadId,
      type: 'other',
      title: 'Reminder deleted',
      description: `Deleted reminder: "${reminder.title}"`,
    });
    await activity.save();

    res.json({ message: 'Reminder deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;
