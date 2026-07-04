"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Activity_1 = require("../models/Activity");
const Lead_1 = require("../models/Lead");
const router = (0, express_1.Router)();
// GET /api/activities?leadId=...
router.get('/', async (req, res) => {
    try {
        const { leadId } = req.query;
        if (!leadId) {
            return res.status(400).json({ error: 'leadId parameter is required' });
        }
        const activities = await Activity_1.Activity.find({ leadId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json(activities);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});
// POST /api/activities
router.post('/', async (req, res) => {
    try {
        const { leadId, type, title, description } = req.body;
        if (!leadId || !type || !title) {
            return res.status(400).json({ error: 'leadId, type, and title are required' });
        }
        const createdBy = req.userId;
        const activity = new Activity_1.Activity({
            leadId,
            type,
            title,
            description,
            createdBy,
        });
        await activity.save();
        // Update the corresponding Lead's lastActivityAt timestamp
        await Lead_1.Lead.findByIdAndUpdate(leadId, { lastActivityAt: new Date() });
        res.status(201).json(activity);
    }
    catch {
        res.status(400).json({ error: 'Failed to create activity' });
    }
});
exports.default = router;
