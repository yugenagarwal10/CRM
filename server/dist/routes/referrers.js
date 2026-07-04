"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Referrer_1 = require("../models/Referrer");
const router = (0, express_1.Router)();
// GET /api/referrers
router.get('/', async (req, res) => {
    try {
        const referrers = await Referrer_1.Referrer.find().sort({ name: 1 });
        res.json(referrers);
    }
    catch {
        res.status(550).json({ error: 'Failed to fetch referrers' });
    }
});
exports.default = router;
