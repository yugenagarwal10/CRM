"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Reminder_1 = require("../models/Reminder");
const Activity_1 = require("../models/Activity");
const router = (0, express_1.Router)();
// GET /api/reminders?filter=today|overdue|all&leadId=...
router.get('/', async (req, res) => {
    try {
        const { filter, leadId } = req.query;
        const query = {};
        if (leadId) {
            query.leadId = leadId;
        }
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        if (filter === 'today') {
            query.date = today;
        }
        else if (filter === 'overdue') {
            query.date = { $lt: today };
        }
        const reminders = await Reminder_1.Reminder.find(query)
            .populate('leadId', 'name company')
            .sort({ date: 1, time: 1 });
        res.json(reminders);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});
// POST /api/reminders
router.post('/', async (req, res) => {
    try {
        const reminder = new Reminder_1.Reminder(req.body);
        await reminder.save();
        const populated = await reminder.populate('leadId', 'name company');
        // Log activity
        const activity = new Activity_1.Activity({
            leadId: reminder.leadId,
            type: 'reminder_created',
            title: 'Reminder added',
            description: `Added reminder: "${reminder.title}" for ${reminder.date} at ${reminder.time}`,
        });
        await activity.save();
        res.status(201).json(populated);
    }
    catch {
        res.status(400).json({ error: 'Failed to create reminder' });
    }
});
// PUT /api/reminders/:id
router.put('/:id', async (req, res) => {
    try {
        const reminder = await Reminder_1.Reminder.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('leadId', 'name company');
        if (!reminder)
            return res.status(404).json({ error: 'Reminder not found' });
        res.json(reminder);
    }
    catch {
        res.status(400).json({ error: 'Failed to update reminder' });
    }
});
// DELETE /api/reminders/:id
router.delete('/:id', async (req, res) => {
    try {
        const reminder = await Reminder_1.Reminder.findByIdAndDelete(req.params.id);
        if (!reminder)
            return res.status(404).json({ error: 'Reminder not found' });
        // Log activity
        const activity = new Activity_1.Activity({
            leadId: reminder.leadId,
            type: 'other',
            title: 'Reminder deleted',
            description: `Deleted reminder: "${reminder.title}"`,
        });
        await activity.save();
        res.json({ message: 'Reminder deleted' });
    }
    catch {
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});
exports.default = router;
