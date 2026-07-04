import { Router, Request, Response } from 'express';
import { Source } from '../models/Source';

const router = Router();

// GET /api/sources
router.get('/', async (req: Request, res: Response) => {
  try {
    const sources = await Source.find().sort({ createdAt: -1 });
    res.json(sources);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// POST /api/sources
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Source name is required' });
    }
    const exists = await Source.findOne({ name: { $regex: new RegExp("^" + name.trim() + "$", "i") } });
    if (exists) {
      return res.status(400).json({ error: 'Source name already exists' });
    }
    const source = new Source({ name: name.trim() });
    await source.save();
    res.status(201).json(source);
  } catch {
    res.status(400).json({ error: 'Failed to create source' });
  }
});

// PUT /api/sources/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Source name is required' });
    }
    const exists = await Source.findOne({ 
      name: { $regex: new RegExp("^" + name.trim() + "$", "i") },
      _id: { $ne: req.params.id }
    });
    if (exists) {
      return res.status(400).json({ error: 'Source name already exists' });
    }
    const source = await Source.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );
    if (!source) return res.status(404).json({ error: 'Source not found' });
    res.json(source);
  } catch {
    res.status(400).json({ error: 'Failed to update source' });
  }
});

// DELETE /api/sources/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const source = await Source.findByIdAndDelete(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });
    res.json({ message: 'Source deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

export default router;
