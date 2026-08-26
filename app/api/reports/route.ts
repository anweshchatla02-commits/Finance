import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url || 'http://localhost:3000', 'http://localhost:3000');
  const startDateParam = url.searchParams.get('startDate');
  const endDateParam = url.searchParams.get('endDate');

  try {
    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Payments in range
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'asc' },
    });

    const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    // Active finances metrics
    const activeFinances = await prisma.finance.findMany({
      where: { status: 'ACTIVE' },
    });

    const totalCapitalDisbursed = activeFinances.reduce((acc, f) => acc + Number(f.amountGiven), 0);
    const totalExpectedReturn = activeFinances.reduce((acc, f) => acc + Number(f.totalAmountToCollect), 0);
    const totalProjectedProfit = totalExpectedReturn - totalCapitalDisbursed;

    // Group daily collections for charts
    const dailyMap = new Map<string, number>();
    payments.forEach((p) => {
      const dayStr = new Date(p.paymentDate).toISOString().split('T')[0];
      dailyMap.set(dayStr, (dailyMap.get(dayStr) || 0) + Number(p.amount));
    });

    const chartData = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({
      totalCollected,
      totalCapitalDisbursed,
      totalExpectedReturn,
      totalProjectedProfit,
      paymentsCount: payments.length,
      chartData,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 });
  }
}
