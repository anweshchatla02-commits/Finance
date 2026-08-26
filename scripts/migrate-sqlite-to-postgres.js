/**
 * Safe Data Migration Script: SQLite (dev.db) -> Cloud PostgreSQL (Neon / Production)
 */

const { PrismaClient } = require('@prisma/client');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const pgPrisma = new PrismaClient();
const sqliteDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

async function migrateData() {
  console.log('--- STARTING FAST BATCH DATA MIGRATION (SQLite -> Neon PostgreSQL) ---');
  console.log(`Reading source SQLite database at: ${sqliteDbPath}`);

  let db;
  try {
    db = new DatabaseSync(sqliteDbPath);
  } catch (err) {
    console.error('Failed to open SQLite database:', err);
    process.exit(1);
  }

  try {
    // A. Read source SQLite data
    const users = db.prepare('SELECT * FROM User').all();
    const customers = db.prepare('SELECT * FROM Customer').all();
    const finances = db.prepare('SELECT * FROM Finance').all();
    const payments = db.prepare('SELECT * FROM Payment').all();
    const schedules = db.prepare('SELECT * FROM CollectionSchedule').all();
    const auditLogs = db.prepare('SELECT * FROM AuditLog').all();

    console.log(`Found SQLite records:
    - ${users.length} Users
    - ${customers.length} Customers
    - ${finances.length} Finance Loans
    - ${payments.length} Payments
    - ${schedules.length} Collection Schedules
    - ${auditLogs.length} Audit Logs`);

    // B. Migrate Users
    for (const u of users) {
      await pgPrisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role || 'ADMIN',
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        },
      });
    }
    console.log('✔ Users migrated.');

    // C. Migrate Customers
    for (const c of customers) {
      await pgPrisma.customer.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          address: c.address,
          notes: c.notes,
          status: c.status || 'ACTIVE',
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        },
      });
    }
    console.log('✔ Customers migrated.');

    // D. Migrate Finances
    for (const f of finances) {
      await pgPrisma.finance.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          customerId: f.customerId,
          amountGiven: String(f.amountGiven),
          totalAmountToCollect: String(f.totalAmountToCollect),
          dailyCollectionAmount: String(f.dailyCollectionAmount),
          startDate: new Date(f.startDate),
          numberOfCollectionDays: Number(f.numberOfCollectionDays),
          endDate: new Date(f.endDate),
          status: f.status || 'ACTIVE',
          notes: f.notes,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
        },
      });
    }
    console.log('✔ Finance records migrated.');

    // E. Batch Migrate Collection Schedules
    if (schedules.length > 0) {
      const formattedSchedules = schedules.map((s) => ({
        id: s.id,
        financeId: s.financeId,
        scheduledDate: new Date(s.scheduledDate),
        expectedAmount: String(s.expectedAmount),
        paidAmount: String(s.paidAmount),
        status: s.status || 'PENDING',
        paidAt: s.paidAt ? new Date(s.paidAt) : null,
        notes: s.notes,
      }));

      await pgPrisma.collectionSchedule.createMany({
        data: formattedSchedules,
        skipDuplicates: true,
      });
    }
    console.log('✔ Collection schedules batch migrated.');

    // F. Batch Migrate Payments
    if (payments.length > 0) {
      const formattedPayments = payments.map((p) => ({
        id: p.id,
        financeId: p.financeId,
        customerId: p.customerId,
        amount: String(p.amount),
        paymentDate: new Date(p.paymentDate),
        paymentMethod: p.paymentMethod || 'CASH',
        notes: p.notes,
        createdBy: p.createdBy,
        createdAt: new Date(p.createdAt),
      }));

      await pgPrisma.payment.createMany({
        data: formattedPayments,
        skipDuplicates: true,
      });
    }
    console.log('✔ Payments batch migrated.');

    // G. Batch Migrate Audit Logs
    if (auditLogs.length > 0) {
      const existingUserIds = new Set((await pgPrisma.user.findMany({ select: { id: true } })).map((u) => u.id));
      const formattedLogs = auditLogs.map((log) => ({
        id: log.id,
        userId: existingUserIds.has(log.userId) ? log.userId : null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: new Date(log.createdAt),
      }));

      await pgPrisma.auditLog.createMany({
        data: formattedLogs,
        skipDuplicates: true,
      });
    }
    console.log('✔ Audit logs batch migrated.');

    console.log('--- FAST BATCH DATA MIGRATION COMPLETED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (db) db.close();
    await pgPrisma.$disconnect();
  }
}

migrateData();
