import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { getAuthSession } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({ include: { finances: true, payments: true } });
    const finances = await prisma.finance.findMany({ include: { collectionSchedules: true, payments: true } });
    const payments = await prisma.payment.findMany();
    const schedules = await prisma.collectionSchedule.findMany();
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: session.email,
      data: {
        users,
        customers,
        finances,
        payments,
        schedules,
      },
    };

    await createAuditLog({
      userId: session.id,
      action: 'DATABASE_BACKUP_EXPORT',
      entityType: 'System',
      metadata: { recordCounts: { customers: customers.length, finances: finances.length, payments: payments.length } },
    });

    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database backup export failed' }, { status: 500 });
  }
}
