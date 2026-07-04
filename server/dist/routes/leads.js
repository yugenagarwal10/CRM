"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Lead_1 = require("../models/Lead");
const Referrer_1 = require("../models/Referrer");
const Activity_1 = require("../models/Activity");
const handleReferrerAssociation = async (referrerData) => {
    if (!referrerData || !referrerData.name || !referrerData.name.trim()) {
        return null;
    }
    const nameTrimmed = referrerData.name.trim();
    let referrer = await Referrer_1.Referrer.findOne({
        name: { $regex: new RegExp("^" + nameTrimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
    });
    if (referrer) {
        if (referrerData.email !== undefined)
            referrer.email = referrerData.email.trim();
        if (referrerData.phone !== undefined)
            referrer.phone = referrerData.phone.trim();
        await referrer.save();
    }
    else {
        referrer = new Referrer_1.Referrer({
            name: nameTrimmed,
            email: (referrerData.email || '').trim(),
            phone: (referrerData.phone || '').trim(),
        });
        await referrer.save();
    }
    return referrer._id;
};
const router = (0, express_1.Router)();
// GET /api/leads  — optional ?search= and ?status=
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;
        const filter = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [{ name: regex }, { company: regex }, { email: regex }];
        }
        if (status) {
            filter.status = status;
        }
        const leads = await Lead_1.Lead.find(filter).populate('referrerId').sort({ createdAt: -1 });
        res.json(leads);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});
// GET /api/leads/:id
router.get('/:id', async (req, res) => {
    try {
        const lead = await Lead_1.Lead.findById(req.params.id).populate('referrerId');
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});
// POST /api/leads
router.post('/', async (req, res) => {
    try {
        const referrerId = await handleReferrerAssociation(req.body.referrer);
        const lead = new Lead_1.Lead({
            ...req.body,
            referrerId,
        });
        await lead.save();
        // Log activity
        const activity = new Activity_1.Activity({
            leadId: lead._id,
            type: 'lead_created',
            title: 'Lead created',
            description: `Lead registered with status: ${lead.status}`,
            createdBy: req.userId,
        });
        await activity.save();
        const populated = await lead.populate('referrerId');
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to create lead' });
    }
});
// PUT /api/leads/:id
router.put('/:id', async (req, res) => {
    try {
        const oldLead = await Lead_1.Lead.findById(req.params.id);
        if (!oldLead)
            return res.status(404).json({ error: 'Lead not found' });
        const statusChanged = req.body.status && req.body.status !== oldLead.status;
        let updateData = { ...req.body, lastActivityAt: new Date() };
        if (req.body.referrer !== undefined) {
            const referrerId = await handleReferrerAssociation(req.body.referrer);
            updateData.referrerId = referrerId;
        }
        const lead = await Lead_1.Lead.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        if (statusChanged) {
            const activity = new Activity_1.Activity({
                leadId: lead._id,
                type: 'status_changed',
                title: 'Status changed',
                description: `Changed status from "${oldLead.status}" to "${lead.status}"`,
                createdBy: req.userId,
            });
            await activity.save();
        }
        else {
            const changes = [];
            const fields = ['name', 'company', 'email', 'phone', 'notes', 'source'];
            for (const field of fields) {
                if (req.body[field] !== undefined && String(req.body[field]) !== String(oldLead[field])) {
                    changes.push(field);
                }
            }
            if (changes.length > 0) {
                const activity = new Activity_1.Activity({
                    leadId: lead._id,
                    type: 'other',
                    title: 'Lead updated',
                    description: `Updated profile details: ${changes.join(', ')}`,
                    createdBy: req.userId,
                });
                await activity.save();
            }
        }
        const populated = await lead.populate('referrerId');
        res.json(populated);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to update lead' });
    }
});
// DELETE /api/leads/:id  — also removes associated reminders
router.delete('/:id', async (req, res) => {
    try {
        const lead = await Lead_1.Lead.findByIdAndDelete(req.params.id);
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
        res.json({ message: 'Lead deleted' });
    }
    catch {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});
// GET /api/leads/:id/ai-followup
router.get('/:id/ai-followup', async (req, res) => {
    let lead = null;
    try {
        lead = await Lead_1.Lead.findById(req.params.id);
        if (!lead)
            return res.status(404).json({ error: 'Lead not found' });
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });
        const responseData = await response.json();
        if (!response.ok) {
            console.error('Gemini API Error details:', response.status, JSON.stringify(responseData));
            throw new Error(`Gemini API returned status ${response.status}`);
        }
        const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
            throw new Error('No content returned from Gemini');
        }
        res.json({ message: text.trim() });
    }
    catch (err) {
        console.error('AI generation error:', err);
        const fallback = lead
            ? `Hello ${lead.name},\n\nFollowing up on your request${lead.company ? ` from *${lead.company}*` : ''}.\n\nCurrently, your status is updated to *${lead.status}*.\n\nPlease let us know if you have any queries.\n\nBest regards!`
            : 'Hello,\n\nFollowing up on your request. Please let us know if you have any queries.\n\nBest regards!';
        res.json({ message: fallback });
    }
});
exports.default = router;
