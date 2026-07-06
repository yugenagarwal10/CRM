import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import { Referrer } from '../models/Referrer';
import { Reminder } from '../models/Reminder';
import { Activity } from '../models/Activity';
import { Status } from '../models/Status';
import { Source } from '../models/Source';

const handleReferrerAssociation = async (referrerData: any): Promise<mongoose.Types.ObjectId | null> => {
  if (!referrerData || !referrerData.name || !referrerData.name.trim()) {
    return null;
  }
  const nameTrimmed = referrerData.name.trim();
  let referrer = await Referrer.findOne({
    name: { $regex: new RegExp("^" + nameTrimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
  });
  if (referrer) {
    if (referrerData.email !== undefined) referrer.email = referrerData.email.trim();
    if (referrerData.phone !== undefined) referrer.phone = referrerData.phone.trim();
    await referrer.save();
  } else {
    referrer = new Referrer({
      name: nameTrimmed,
      email: (referrerData.email || '').trim(),
      phone: (referrerData.phone || '').trim(),
    });
    await referrer.save();
  }
  return referrer._id as mongoose.Types.ObjectId;
};

const router = Router();

// GET /api/leads  — optional ?search= and ?status=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = new RegExp(search as string, 'i');
      filter.$or = [{ name: regex }, { company: regex }, { email: regex }];
    }

    if (status) {
      filter.status = status;
    }

    const leads = await Lead.find(filter).populate('referrerId').sort({ createdAt: -1 });
    res.json(leads);
  } catch {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('referrerId');
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// POST /api/leads/batch
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const leadsData = req.body.leads;
    if (!Array.isArray(leadsData)) {
      return res.status(400).json({ error: 'Leads must be an array' });
    }

    let processedCount = 0;
    for (const leadData of leadsData) {
      if (!leadData.name || !leadData.name.trim()) {
        continue;
      }

      // 1. Dynamic Status Check & Create
      if (leadData.status && leadData.status.trim()) {
        const statusName = leadData.status.trim();
        const regex = new RegExp("^" + statusName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");
        let statusObj = await Status.findOne({ name: { $regex: regex } });
        if (!statusObj) {
          const lastStatus = await Status.findOne().sort({ order: -1 });
          const order = lastStatus ? lastStatus.order + 10 : 10;
          statusObj = new Status({
            name: statusName,
            color: 'indigo',
            order,
            type: 'standard',
            isSystem: false
          });
          await statusObj.save();
        }
        leadData.status = statusObj.name;
      }

      // 1.5 Dynamic Source Check & Create
      if (leadData.source && leadData.source.trim()) {
        const sourceName = leadData.source.trim();
        const regex = new RegExp("^" + sourceName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");
        let sourceObj = await Source.findOne({ name: { $regex: regex } });
        if (!sourceObj) {
          sourceObj = new Source({
            name: sourceName
          });
          await sourceObj.save();
        }
        leadData.source = sourceObj.name;
      }

      // 2. Lead Duplication Check & Merge/Create
      let existingLead = null;
      const nameRegex = new RegExp("^" + leadData.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");
      
      const conditions: any[] = [];
      if (leadData.phone && String(leadData.phone).trim()) {
        conditions.push({ phone: String(leadData.phone).trim() });
      }
      if (leadData.email && String(leadData.email).trim()) {
        conditions.push({ email: String(leadData.email).trim() });
      }

      if (conditions.length > 0) {
        existingLead = await Lead.findOne({
          name: { $regex: nameRegex },
          $or: conditions
        });
      } else {
        existingLead = await Lead.findOne({
          name: { $regex: nameRegex }
        });
      }

      if (existingLead) {
        // Merge attributes to existing lead
        if (leadData.company && leadData.company.trim()) {
          existingLead.company = leadData.company.trim();
        }
        if (leadData.email && leadData.email.trim()) {
          existingLead.email = leadData.email.trim();
        }
        if (leadData.phone && leadData.phone.trim()) {
          existingLead.phone = leadData.phone.trim();
        }
        if (leadData.notes && leadData.notes.trim()) {
          existingLead.notes = existingLead.notes 
            ? `${existingLead.notes}\n[Import Update]: ${leadData.notes.trim()}`
            : leadData.notes.trim();
        }
        if (leadData.status) {
          existingLead.status = leadData.status;
        }
        if (leadData.source) {
          existingLead.source = leadData.source;
        }
        existingLead.lastActivityAt = new Date();
        await existingLead.save();

        const activity = new Activity({
          leadId: existingLead._id,
          type: 'other',
          title: 'Lead updated via import',
          description: `Lead details merged and updated via batch import`,
          createdBy: (req as any).userId,
        });
        await activity.save();
      } else {
        // Create new lead
        const referrerId = await handleReferrerAssociation(leadData.referrer);
        const lead = new Lead({
          ...leadData,
          referrerId,
        });
        await lead.save();

        const activity = new Activity({
          leadId: lead._id,
          type: 'lead_created',
          title: 'Lead created via import',
          description: `Lead registered via batch import with status: ${lead.status}`,
          createdBy: (req as any).userId,
        });
        await activity.save();
      }
      processedCount++;
    }

    res.status(201).json({ count: processedCount });
  } catch (err) {
    console.error('Batch import error:', err);
    res.status(400).json({ error: 'Failed to import leads' });
  }
});

// POST /api/leads
router.post('/', async (req: Request, res: Response) => {
  try {
    const referrerId = await handleReferrerAssociation(req.body.referrer);
    const lead = new Lead({
      ...req.body,
      referrerId,
    });
    await lead.save();

    // Log activity
    const activity = new Activity({
      leadId: lead._id,
      type: 'lead_created',
      title: 'Lead created',
      description: `Lead registered with status: ${lead.status}`,
      createdBy: (req as any).userId,
    });
    await activity.save();

    const populated = await lead.populate('referrerId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create lead' });
  }
});

// PUT /api/leads/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) return res.status(404).json({ error: 'Lead not found' });
    const statusChanged = req.body.status && req.body.status !== oldLead.status;

    let updateData = { ...req.body, lastActivityAt: new Date() };

    if (req.body.referrer !== undefined) {
      const referrerId = await handleReferrerAssociation(req.body.referrer);
      updateData.referrerId = referrerId;
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    if (statusChanged) {
      const activity = new Activity({
        leadId: lead._id,
        type: 'status_changed',
        title: 'Status changed',
        description: `Changed status from "${oldLead.status}" to "${lead.status}"`,
        createdBy: (req as any).userId,
      });
      await activity.save();
    } else {
      const changes: string[] = [];
      const fields = ['name', 'company', 'email', 'phone', 'notes', 'source'];
      for (const field of fields) {
        if (req.body[field] !== undefined && String(req.body[field]) !== String((oldLead as any)[field])) {
          changes.push(field);
        }
      }
      if (changes.length > 0) {
        const activity = new Activity({
          leadId: lead._id,
          type: 'other',
          title: 'Lead updated',
          description: `Updated profile details: ${changes.join(', ')}`,
          createdBy: (req as any).userId,
        });
        await activity.save();
      }
    }

    const populated = await lead.populate('referrerId');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update lead' });
  }
});

// DELETE /api/leads/:id  — also removes associated reminders
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// GET /api/leads/:id/ai-followup
router.get('/:id/ai-followup', async (req: Request, res: Response) => {
  let lead: any = null;
  try {
    lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const apiKey = process.env.GEMINI_API_KEY || 'PLACEHOLDER_KEY';

    const prompt = `Write a highly professional, polite, and engaging sales follow-up message for WhatsApp.
Lead Details:
- Name: ${lead.name}
- Company: ${lead.company || 'Private'}
- Current Stage: ${lead.status}
- Notes Summary: ${lead.notes || 'None'}

Requirements:
- Keep it concise (maximum 3-4 short sentences).
- Use formatting (like *bold* for emphasis where appropriate, e.g., stage or company).
- Do not include subject lines or formal letter headers.
- Sound natural, helpful, and action-oriented.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
     
    const responseData: any = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error details:', response.status, JSON.stringify(responseData));
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      throw new Error('No content returned from Gemini');
    }

    res.json({ message: text.trim() });
  } catch (err) {
    console.error('AI generation error:', err)
    const fallback = lead 
      ? `Hello ${lead.name},\n\nFollowing up on your request${
          lead.company ? ` from *${lead.company}*` : ''
        }.\n\nCurrently, your status is updated to *${lead.status}*.\n\nPlease let us know if you have any queries.\n\nBest regards!`
      : 'Hello,\n\nFollowing up on your request. Please let us know if you have any queries.\n\nBest regards!';
    res.json({ message: fallback });
  }
});

export default router;
