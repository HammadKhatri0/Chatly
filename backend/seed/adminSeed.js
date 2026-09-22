import User from '../models/User.js';
import { env } from '../config/env.js';
import { ROLES } from '../config/constants.js';

/**
 * Guarantees the admin account exists. Runs on every boot and is idempotent:
 * an existing account is promoted to admin but its password is left untouched.
 */
export const seedAdmin = async () => {
  const existing = await User.findOne({ email: env.admin.email });

  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      existing.role = ROLES.ADMIN;
      await existing.save();
      console.log(`Promoted ${existing.email} to admin`);
    }
    return existing;
  }

  const admin = await User.create({
    name: env.admin.name,
    email: env.admin.email,
    password: env.admin.password,
    role: ROLES.ADMIN,
    about: 'System administrator',
  });
  console.log(`Seeded admin account: ${admin.email} / ${env.admin.password}`);
  return admin;
};
