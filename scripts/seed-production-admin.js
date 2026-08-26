/**
 * Production Admin Account Creator Script
 *
 * Usage:
 * ADMIN_EMAIL="father@finance.local" ADMIN_PASSWORD="SecurePassword123!" node scripts/seed-production-admin.js
 *
 * This script creates the initial Production Admin user account cleanly
 * without seeding any demo/test borrowers or sample data.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createProductionAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@finance.local').trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD || 'fatherAdmin2026!';
  const name = process.env.ADMIN_NAME || 'Father Admin';

  if (!rawPassword || rawPassword.length < 6) {
    console.error('Error: ADMIN_PASSWORD must be at least 6 characters');
    process.exit(1);
  }

  console.log(`Creating production admin account for: ${email}`);

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      name,
    },
    create: {
      name,
      email,
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('--- PRODUCTION ADMIN ACCOUNT READY ---');
  console.log(`User ID: ${admin.id}`);
  console.log(`Email / Username: ${admin.email}`);
  console.log('Role: ADMIN');
  console.log('Status: Password hashed securely with bcrypt');
}

createProductionAdmin()
  .catch((e) => {
    console.error('Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
