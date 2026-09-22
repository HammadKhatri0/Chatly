import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import { seedAdmin } from './adminSeed.js';

/** Demo accounts so the app can be tried out immediately. Password for all: password123 */
const DEMO_USERS = [
  { name: 'Jasmin Lowery', email: 'jasmin@example.com', work: 'Product Designer', studies: 'NID' },
  { name: 'Alex Hunt', email: 'alex@example.com', work: 'Frontend Engineer', studies: 'MIT' },
  { name: 'Jacob Mcleod', email: 'jacob@example.com', work: 'QA Engineer', studies: 'Oxford' },
  { name: 'Osman Campos', email: 'osman@example.com', work: 'Project Manager', studies: 'LSE' },
  { name: 'Jessie Rollins', email: 'jessie@example.com', work: 'Copywriter', studies: 'NYU' },
];

const run = async () => {
  await connectDB();
  await seedAdmin();

  for (const demo of DEMO_USERS) {
    const exists = await User.findOne({ email: demo.email });
    if (exists) {
      console.log(`Skipped existing user: ${demo.email}`);
      continue;
    }
    await User.create({ ...demo, password: 'password123', mobile: '+1 555 0100' });
    console.log(`Created demo user: ${demo.email} / password123`);
  }

  await disconnectDB();
  console.log('Seeding complete');
};

run().catch(async (error) => {
  console.error('Seeding failed:', error.message);
  await disconnectDB();
  process.exit(1);
});
