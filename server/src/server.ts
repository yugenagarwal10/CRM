import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import leadsRouter from './routes/leads';
import remindersRouter from './routes/reminders';
import activitiesRouter from './routes/activities';
import referrersRouter from './routes/referrers';
import sourcesRouter from './routes/sources';

import authRouter from './routes/auth';
import statusesRouter from './routes/statuses';
import { authMiddleware } from './middleware/auth';
import { Status } from './models/Status';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lead-crm';

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/statuses', authMiddleware, statusesRouter);
app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/reminders', authMiddleware, remindersRouter);
app.use('/api/activities', authMiddleware, activitiesRouter);
app.use('/api/referrers', authMiddleware, referrersRouter);
app.use('/api/sources', authMiddleware, sourcesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Connect to MongoDB then start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Seed default statuses if collection is empty
    Status.countDocuments().then((count) => {
      if (count === 0) {
        const defaults = [
          { name: 'New', color: 'indigo', order: 10, type: 'standard', isSystem: true },
          { name: 'Contacted', color: 'blue', order: 20, type: 'standard', isSystem: true },
          { name: 'Qualified', color: 'purple', order: 30, type: 'standard', isSystem: true },
          { name: 'Proposal Sent', color: 'amber', order: 40, type: 'standard', isSystem: true },
          { name: 'Won', color: 'emerald', order: 50, type: 'won', isSystem: true },
          { name: 'Lost', color: 'rose', order: 60, type: 'lost', isSystem: true },
        ];
        Status.insertMany(defaults)
          .then(() => console.log('🌱 Seeded default statuses successfully'))
          .catch((err) => console.error('❌ Failed to seed default statuses:', err));
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

export default app;
