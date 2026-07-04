"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Status_1 = require("../models/Status");
const Lead_1 = require("../models/Lead");
const router = (0, express_1.Router)();
// GET all statuses sorted by order
router.get('/', async (req, res) => {
    try {
        const statuses = await Status_1.Status.find().sort({ order: 1 });
        res.json(statuses);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST create new status
router.post('/', async (req, res) => {
    const { name, color, order, type } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Status name is required' });
    }
    try {
        // Check if name is unique
        const existing = await Status_1.Status.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ error: 'Status name already exists' });
        }
        // Auto-calculate order if not provided
        let statusOrder = order;
        if (statusOrder === undefined) {
            const lastStatus = await Status_1.Status.findOne().sort({ order: -1 });
            statusOrder = lastStatus ? lastStatus.order + 10 : 10;
        }
        const newStatus = new Status_1.Status({
            name: name.trim(),
            color: color || 'indigo',
            order: statusOrder,
            type: type || 'standard',
            isSystem: false,
        });
        await newStatus.save();
        res.status(201).json(newStatus);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PUT update status
router.put('/:id', async (req, res) => {
    const { name, color, order, type } = req.body;
    const { id } = req.params;
    try {
        const status = await Status_1.Status.findById(id);
        if (!status) {
            return res.status(404).json({ error: 'Status not found' });
        }
        if (name && name.trim() !== status.name) {
            const existing = await Status_1.Status.findOne({ name: name.trim() });
            if (existing) {
                return res.status(400).json({ error: 'Status name already exists' });
            }
            status.name = name.trim();
        }
        if (color !== undefined)
            status.color = color;
        if (order !== undefined)
            status.order = order;
        // Don't allow changing type of system statuses to prevent breaking app behavior
        if (type !== undefined && !status.isSystem) {
            status.type = type;
        }
        await status.save();
        res.json(status);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// DELETE status
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const status = await Status_1.Status.findById(id);
        if (!status) {
            return res.status(404).json({ error: 'Status not found' });
        }
        // Check if any leads are currently using this status stage
        const leadCount = await Lead_1.Lead.countDocuments({ status: status.name });
        if (leadCount > 0) {
            return res.status(400).json({
                error: `Cannot delete status stage "${status.name}" because it is currently assigned to ${leadCount} active lead(s).`
            });
        }
        await Status_1.Status.deleteOne({ _id: id });
        res.json({ message: 'Status deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
