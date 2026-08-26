const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial admin and demo data to SQLite...');

  // Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@finance.local',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user ready: ${admin.email}`);

  // Check if customers already seeded
  const existingCustomersCount = await prisma.customer.count();
  if (existingCustomersCount > 0) {
    console.log('Database already populated with customers. Skipping sample records creation.');
    return;
  }

  // Create Demo Customers
  const ravi = await prisma.customer.create({
    data: {
      fullName: 'Ravi Kumar',
      phone: '9876543210',
      address: 'Plot 42, Main Road, Hyderabad',
      notes: 'Regular business customer, punctual borrower',
      status: 'ACTIVE',
    },
  });

  const suresh = await prisma.customer.create({
    data: {
      fullName: 'Suresh Kumar',
      phone: '9812345678',
      address: 'Shop 12, Market Complex, Secunderabad',
      notes: 'Daily shopkeeper collection',
      status: 'ACTIVE',
    },
  });

  const mahesh = await prisma.customer.create({
    data: {
      fullName: 'Mahesh',
      phone: '9988776655',
      address: 'House No 3-4, Colony 2, Hyderabad',
      notes: 'Final payment auto-adjusted sample record',
      status: 'ACTIVE',
    },
  });

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 10);

  // 1. Finance Record for Ravi Kumar (₹20,000 / ₹24,000 / ₹300 / 80 days)
  const raviFinance = await prisma.finance.create({
    data: {
      customerId: ravi.id,
      amountGiven: 20000,
      totalAmountToCollect: 24000,
      dailyCollectionAmount: 300,
      startDate: startDate,
      numberOfCollectionDays: 80,
      endDate: new Date(startDate.getTime() + 79 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      notes: 'Standard 80-day agreement',
    },
  });

  const raviSchedules = [];
  for (let i = 0; i < 80; i++) {
    const sDate = new Date(startDate);
    sDate.setDate(startDate.getDate() + i);
    const isPast = i < 10;
    raviSchedules.push({
      financeId: raviFinance.id,
      scheduledDate: sDate,
      expectedAmount: 300,
      paidAmount: isPast ? 300 : 0,
      status: isPast ? 'PAID' : 'PENDING',
      paidAt: isPast ? sDate : null,
    });
  }
  await prisma.collectionSchedule.createMany({ data: raviSchedules });

  for (let i = 0; i < 10; i++) {
    const pDate = new Date(startDate);
    pDate.setDate(startDate.getDate() + i);
    await prisma.payment.create({
      data: {
        financeId: raviFinance.id,
        customerId: ravi.id,
        amount: 300,
        paymentDate: pDate,
        paymentMethod: 'CASH',
        notes: `Day ${i + 1} daily collection`,
        createdBy: admin.id,
      },
    });
  }

  // 2. Finance Record for Suresh Kumar (₹30,000 / ₹35,000 / ₹500 / 70 days)
  const sureshFinance = await prisma.finance.create({
    data: {
      customerId: suresh.id,
      amountGiven: 30000,
      totalAmountToCollect: 35000,
      dailyCollectionAmount: 500,
      startDate: startDate,
      numberOfCollectionDays: 70,
      endDate: new Date(startDate.getTime() + 69 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      notes: '70 days collection agreement',
    },
  });

  const sureshSchedules = [];
  for (let i = 0; i < 70; i++) {
    const sDate = new Date(startDate);
    sDate.setDate(startDate.getDate() + i);
    const isPastPaid = i < 8;
    const isMissed = i === 8 || i === 9;
    sureshSchedules.push({
      financeId: sureshFinance.id,
      scheduledDate: sDate,
      expectedAmount: 500,
      paidAmount: isPastPaid ? 500 : 0,
      status: isPastPaid ? 'PAID' : isMissed ? 'MISSED' : 'PENDING',
      paidAt: isPastPaid ? sDate : null,
    });
  }
  await prisma.collectionSchedule.createMany({ data: sureshSchedules });

  for (let i = 0; i < 8; i++) {
    const pDate = new Date(startDate);
    pDate.setDate(startDate.getDate() + i);
    await prisma.payment.create({
      data: {
        financeId: sureshFinance.id,
        customerId: suresh.id,
        amount: 500,
        paymentDate: pDate,
        paymentMethod: 'UPI',
        notes: `Day ${i + 1} collection via UPI`,
        createdBy: admin.id,
      },
    });
  }

  // 3. Finance Record for Mahesh (₹10,000 / ₹12,000 / ₹300 -> 40 days)
  const maheshFinance = await prisma.finance.create({
    data: {
      customerId: mahesh.id,
      amountGiven: 10000,
      totalAmountToCollect: 12000,
      dailyCollectionAmount: 300,
      startDate: startDate,
      numberOfCollectionDays: 40,
      endDate: new Date(startDate.getTime() + 39 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      notes: 'Exact division sample',
    },
  });

  const maheshSchedules = [];
  for (let i = 0; i < 40; i++) {
    const sDate = new Date(startDate);
    sDate.setDate(startDate.getDate() + i);
    const isPast = i < 10;
    maheshSchedules.push({
      financeId: maheshFinance.id,
      scheduledDate: sDate,
      expectedAmount: 300,
      paidAmount: isPast ? 300 : 0,
      status: isPast ? 'PAID' : 'PENDING',
      paidAt: isPast ? sDate : null,
    });
  }
  await prisma.collectionSchedule.createMany({ data: maheshSchedules });

  console.log('SQLite Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
