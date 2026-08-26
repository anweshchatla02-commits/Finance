import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTodayISTString, toISTStartOfDay } from '@/lib/date';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  try {
    const todayStr = getTodayISTString();
    const todayStart = toISTStartOfDay(todayStr);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    // 1. Overall stats
    const activeCustomersCount = await prisma.customer.count({ where: { status: 'ACTIVE' } });
    const activeFinances = await prisma.finance.findMany({
      where: { status: 'ACTIVE' },
      select: {
        amountGiven: true,
        totalAmountToCollect: true,
        payments: { select: { amount: true } },
      },
    });

    const allFinances = await prisma.finance.findMany({
      select: {
        amountGiven: true,
        totalAmountToCollect: true,
        status: true,
        payments: { select: { amount: true } },
      },
    });

    let totalMoneyGiven = 0;
    let totalAgreedCollect = 0;
    let totalCollectedOverall = 0;
    let totalExtraProfitOverall = 0;

    allFinances.forEach((f) => {
      const given = Number(f.amountGiven);
      const total = Number(f.totalAmountToCollect);
      const collected = f.payments.reduce((acc, p) => acc + Number(p.amount), 0);

      totalMoneyGiven += given;
      totalAgreedCollect += total;
      totalCollectedOverall += collected;
      totalExtraProfitOverall += Math.max(0, total - given);
    });

    const totalOutstandingOverall = Math.max(0, totalAgreedCollect - totalCollectedOverall);

    // 2. Today's stats
    const todaySchedules = await prisma.collectionSchedule.findMany({
      where: {
        scheduledDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    });

    const todayExpected = todaySchedules.reduce((acc, s) => acc + Number(s.expectedAmount), 0);
    const todayCollected = todaySchedules.reduce((acc, s) => acc + Number(s.paidAmount), 0);
    const todayPending = Math.max(0, todayExpected - todayCollected);
    const todayMissed = todaySchedules.filter((s) => s.status === 'MISSED').length;

    // 3. Overdue/missed collections count overall
    const totalMissedSchedules = await prisma.collectionSchedule.count({
      where: { status: 'MISSED' },
    });

    // 4. Monthly/Weekly trend data (for Recharts)
    const recentPayments = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 30,
      select: {
        paymentDate: true,
        amount: true,
      },
    });

    const collectionTrendsMap: Record<string, number> = {};
    recentPayments.forEach((p) => {
      const dateKey = p.paymentDate.toISOString().split('T')[0];
      collectionTrendsMap[dateKey] = (collectionTrendsMap[dateKey] || 0) + Number(p.amount);
    });

    const collectionTrends = Object.entries(collectionTrendsMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      activeCustomersCount,
      activeFinancesCount: activeFinances.length,
      completedFinancesCount: allFinances.filter((f) => f.status === 'COMPLETED').length,
      totalMoneyGiven,
      totalAgreedCollect,
      totalCollectedOverall,
      totalOutstandingOverall,
      totalExtraProfitOverall,
      todayStats: {
        expected: todayExpected,
        collected: todayCollected,
        pending: todayPending,
        missed: todayMissed,
      },
      totalMissedSchedules,
      collectionTrends,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate report summary' }, { status: 500 });
  }
}
