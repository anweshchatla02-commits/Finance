import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = getAuthSession();
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

    // All active finances metrics
    const allFinances = await prisma.finance.findMany({
      include: {
        payments: true,
        collectionSchedules: true,
      },
    });

    const activeFinances = allFinances.filter((f) => f.status === 'ACTIVE');

    const totalMoneyGiven = allFinances.reduce((acc, f) => acc + Number(f.amountGiven), 0);
    const totalToCollectOverall = allFinances.reduce((acc, f) => acc + Number(f.totalAmountToCollect), 0);
    const totalCollectedOverall = allFinances.reduce((acc, f) => {
      const paid = f.payments.reduce((pAcc, p) => pAcc + Number(p.amount), 0);
      return acc + paid;
    }, 0);

    const totalOutstandingOverall = Math.max(0, totalToCollectOverall - totalCollectedOverall);
    const totalExtraProfitOverall = Math.max(0, totalToCollectOverall - totalMoneyGiven);

    // Today's stats calculation
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todaySchedules = await prisma.collectionSchedule.findMany({
      where: {
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    const todayExpected = activeFinances.reduce((acc, f) => acc + Number(f.dailyCollectionAmount), 0);
    const todayPayments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    const todayCollected = todayPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const todayPending = Math.max(0, todayExpected - todayCollected);
    const todayMissed = todaySchedules.filter((s) => s.status === 'MISSED').length;

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
      todayStats: {
        expected: todayExpected,
        collected: todayCollected,
        pending: todayPending,
        missed: todayMissed,
      },
      totalMoneyGiven,
      totalOutstandingOverall,
      totalCollectedOverall,
      totalExtraProfitOverall,
      totalCollected,
      paymentsCount: payments.length,
      chartData,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 });
  }
}
