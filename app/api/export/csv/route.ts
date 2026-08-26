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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'finances';

  try {
    let csvContent = '';
    let filename = `export-${type}-${Date.now()}.csv`;

    if (type === 'customers') {
      const customers = await prisma.customer.findMany({
        orderBy: { fullName: 'asc' },
      });
      const headers = ['ID', 'Full Name', 'Phone', 'Address', 'Status', 'Notes', 'Created At'];
      const rows = customers.map((c) => [
        c.id,
        `"${c.fullName.replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        c.status,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        c.createdAt.toISOString(),
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        include: { customer: true, finance: true },
        orderBy: { paymentDate: 'desc' },
      });
      const headers = ['Payment ID', 'Customer Name', 'Phone', 'Finance ID', 'Amount (INR)', 'Payment Date', 'Method', 'Notes'];
      const rows = payments.map((p) => [
        p.id,
        `"${p.customer.fullName.replace(/"/g, '""')}"`,
        `"${p.customer.phone}"`,
        p.financeId,
        Number(p.amount),
        p.paymentDate.toISOString().split('T')[0],
        p.paymentMethod,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      // Default: finances export
      const finances = await prisma.finance.findMany({
        include: { customer: true, payments: { select: { amount: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const headers = [
        'Finance ID',
        'Customer Name',
        'Phone',
        'Amount Given',
        'Total To Collect',
        'Daily Amount',
        'Start Date',
        'Days',
        'Status',
        'Total Collected',
        'Remaining Balance',
        'Extra Profit',
      ];
      const rows = finances.map((f) => {
        const given = Number(f.amountGiven);
        const total = Number(f.totalAmountToCollect);
        const daily = Number(f.dailyCollectionAmount);
        const collected = f.payments.reduce((acc, p) => acc + Number(p.amount), 0);
        const remaining = Math.max(0, total - collected);
        const profit = Math.max(0, total - given);

        return [
          f.id,
          `"${f.customer.fullName.replace(/"/g, '""')}"`,
          `"${f.customer.phone}"`,
          given,
          total,
          daily,
          f.startDate.toISOString().split('T')[0],
          f.numberOfCollectionDays,
          f.status,
          collected,
          remaining,
          profit,
        ];
      });
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'CSV_EXPORT',
      entityType: type.toUpperCase(),
      metadata: { exportType: type },
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CSV Export failed' }, { status: 500 });
  }
}
