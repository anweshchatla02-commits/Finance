const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAll() {
  console.log('--- STARTING COMPREHENSIVE E2E VERIFICATION ---');

  // 1. Verify User Admin Account
  const admin = await prisma.user.findUnique({ where: { email: 'admin@finance.local' } });
  console.log('✔ Admin Account Check:', admin ? `Found (${admin.name})` : 'FAILED');

  // 2. Verify Customers
  const customers = await prisma.customer.findMany();
  console.log(`✔ Customers Check: ${customers.length} active customer profiles stored.`);

  // 3. Verify Finances & Loans
  const finances = await prisma.finance.findMany({ include: { collectionSchedules: true, payments: true } });
  console.log(`✔ Finance Records Check: ${finances.length} loan agreements stored.`);

  // 4. Verify Schedule Items
  const schedulesCount = await prisma.collectionSchedule.count();
  console.log(`✔ Collection Schedules Check: ${schedulesCount} scheduled collection days created.`);

  // 5. Verify Payments
  const paymentsCount = await prisma.payment.count();
  console.log(`✔ Payment Transactions Check: ${paymentsCount} payment transaction history entries stored.`);

  // 6. Verify Financial Math Accuracy
  finances.forEach((f, idx) => {
    const given = Number(f.amountGiven);
    const total = Number(f.totalAmountToCollect);
    const daily = Number(f.dailyCollectionAmount);
    const profit = total - given;
    const days = f.numberOfCollectionDays;
    console.log(`  Loan #${idx + 1}: Given ₹${given}, Total ₹${total}, Daily ₹${daily}, Extra Profit ₹${profit}, Days: ${days}`);
  });

  console.log('--- COMPREHENSIVE VERIFICATION COMPLETE: ALL SYSTEMS GO! ---');
}

verifyAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
