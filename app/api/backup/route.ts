import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany();
    const finances = await prisma.finance.findMany();
    const payments = await prisma.payment.findMany();
    const collectionSchedules = await prisma.collectionSchedule.findMany();
    const auditLogs = await prisma.auditLog.findMany();

    const backupPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      exportedBy: (session.user as any).email,
      data: {
        customers,
        finances,
        payments,
        collectionSchedules,
        auditLogs,
      },
    };

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'DATABASE_BACKUP_EXPORT',
      entityType: 'System',
      metadata: { recordCount: customers.length + finances.length + payments.length },
    });

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const filename = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new Response(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database backup export failed' }, { status: 500 });
  }
}
