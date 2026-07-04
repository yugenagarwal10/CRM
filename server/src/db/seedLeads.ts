import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Lead } from '../models/Lead';
import { Activity } from '../models/Activity';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lead-crm';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Create dates
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

    // 1. Create Inactive Lead 1
    const lead1 = new Lead({
      name: 'Rajesh Kumar (Idle)',
      company: 'Rajesh Enterprise',
      email: 'rajesh@example.com',
      phone: '9876543210',
      notes: 'This lead has been idle for testing the inactive leads feature.',
      status: 'New',
      inactiveLimitDays: 2,
      lastActivityAt: threeDaysAgo,
    });
    // Override timestamps
    lead1.createdAt = fourDaysAgo;
    await lead1.save();

    // Create activity for Rajesh Kumar (Idle)
    const act1 = new Activity({
      leadId: lead1._id as mongoose.Types.ObjectId,
      type: 'lead_created',
      title: 'Lead created',
      description: 'Lead registered with status: New',
    });
    act1.createdAt = fourDaysAgo;
    await act1.save();

    // 2. Create Inactive Lead 2
    const lead2 = new Lead({
      name: 'Priya Sharma (Idle)',
      company: 'Priya Tech',
      email: 'priya@example.com',
      phone: '8765432109',
      notes: 'Priya has not been contacted for 4 days.',
      status: 'Contacted',
      inactiveLimitDays: 3,
      lastActivityAt: fourDaysAgo,
    });
    lead2.createdAt = fourDaysAgo;
    await lead2.save();

    const act2 = new Activity({
      leadId: lead2._id as mongoose.Types.ObjectId,
      type: 'status_changed',
      title: 'Status changed',
      description: 'Changed status from "New" to "Contacted"',
    });
    act2.createdAt = fourDaysAgo;
    await act2.save();

    // 3. Create active lead (for contrast)
    const lead3 = new Lead({
      name: 'Amit Patel (Active)',
      company: 'Amit Corp',
      email: 'amit@example.com',
      phone: '7654321098',
      notes: 'Recently contacted, should not show in inactive leads.',
      status: 'Qualified',
      inactiveLimitDays: 2,
      lastActivityAt: new Date(),
    });
    await lead3.save();

    const act3 = new Activity({
      leadId: lead3._id as mongoose.Types.ObjectId,
      type: 'lead_created',
      title: 'Lead created',
      description: 'Lead registered with status: Qualified',
    });
    await act3.save();

    console.log('🌱 Successfully seeded idle/active test leads and activities!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed:', err);
    process.exit(1);
  }
}

seed();
