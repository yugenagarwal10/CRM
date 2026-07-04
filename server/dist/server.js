"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const leads_1 = __importDefault(require("./routes/leads"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const activities_1 = __importDefault(require("./routes/activities"));
const referrers_1 = __importDefault(require("./routes/referrers"));
const sources_1 = __importDefault(require("./routes/sources"));
const auth_1 = __importDefault(require("./routes/auth"));
const statuses_1 = __importDefault(require("./routes/statuses"));
const auth_2 = require("./middleware/auth");
const Status_1 = require("./models/Status");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lead-crm';
app.use((0, cors_1.default)({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/statuses', auth_2.authMiddleware, statuses_1.default);
app.use('/api/leads', auth_2.authMiddleware, leads_1.default);
app.use('/api/reminders', auth_2.authMiddleware, reminders_1.default);
app.use('/api/activities', auth_2.authMiddleware, activities_1.default);
app.use('/api/referrers', auth_2.authMiddleware, referrers_1.default);
app.use('/api/sources', auth_2.authMiddleware, sources_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Connect to MongoDB
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('✅ Connected to MongoDB');
    // Seed default statuses if collection is empty
    Status_1.Status.countDocuments().then((count) => {
        if (count === 0) {
            const defaults = [
                { name: 'New', color: 'indigo', order: 10, type: 'standard', isSystem: true },
                { name: 'Contacted', color: 'blue', order: 20, type: 'standard', isSystem: true },
                { name: 'Qualified', color: 'purple', order: 30, type: 'standard', isSystem: true },
                { name: 'Proposal Sent', color: 'amber', order: 40, type: 'standard', isSystem: true },
                { name: 'Won', color: 'emerald', order: 50, type: 'won', isSystem: true },
                { name: 'Lost', color: 'rose', order: 60, type: 'lost', isSystem: true },
            ];
            Status_1.Status.insertMany(defaults)
                .then(() => console.log('🌱 Seeded default statuses successfully'))
                .catch((err) => console.error('❌ Failed to seed default statuses:', err));
        }
    });
})
    .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
});
// Start listening only if NOT running on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
exports.default = app;
