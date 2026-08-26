import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateReadable } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url || 'http://localhost:3000', 'http://localhost:3000');
  const type = url.searchParams.get('type') || 'payments';

  try {
    let csvHeader = '';
    let csvRows: string[] = [];
    let filename = `export-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'payments') {
      csvHeader = 'Payment ID,Customer Name,Customer Phone,Amount (INR),Payment Date,Payment Method,Notes\n';
      const payments = await prisma.payment.findMany({
        include: { customer: true },
        orderBy: { paymentDate: 'desc' },
      });

      csvRows = payments.map((p) => {
        const row = [
          p.id,
          `"${p.customer.fullName.replace(/"/g, '""')}"`,
          p.customer.phone,
          Number(p.amount),
          formatDateReadable(p.paymentDate),
          p.paymentMethod,
          `"${(p.notes || '').replace(/"/g, '""')}"`,
        ];
        return row.join(',');
      });
    } else if (type === 'finances') {
      csvHeader = 'Finance ID,Customer Name,Phone,Amount Given (INR),Total To Collect (INR),Daily Amount (INR),Start Date,End Date,Status\n';
      const finances = await prisma.finance.findMany({
        include: { customer: true },
        orderBy: { startDate: 'desc' },
      });

      csvRows = finances.map((f) => {
        const row = [
          f.id,
          `"${f.customer.fullName.replace(/"/g, '""')}"`,
          f.customer.phone,
          Number(f.amountGiven),
          Number(f.totalAmountToCollect),
          Number(f.dailyCollectionAmount),
          formatDateReadable(f.startDate),
          formatDateReadable(f.endDate),
          f.status,
        ];
        return row.join(',');
      });
    } else if (type === 'customers') {
      csvHeader = 'Customer ID,Full Name,Phone,Address,Status,Created At\n';
      const customers = await prisma.customer.findMany({
        orderBy: { fullName: 'asc' },
      });

      csvRows = customers.map((c) => {
        const row = [
          c.id,
          `"${c.fullName.replace(/"/g, '""')}"`,
          c.phone,
          `"${c.address.replace(/"/g, '""')}"`,
          c.status,
          formatDateReadable(c.createdAt),
        ];
        return row.join(',');
      });
    }

    const csvContent = csvHeader + csvRows.join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CSV Export failed' }, { status: 500 });
  }
}
