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
  const dateParam = url.searchParams.get('date');

  try {
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Fetch active finances
    const activeFinances = await prisma.finance.findMany({
      where: { status: 'ACTIVE' },
      include: {
        customer: true,
        collectionSchedules: {
          orderBy: { scheduledDate: 'asc' },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const collections = activeFinances.map((fin) => {
      // Find today's schedule or next pending schedule
      const todaySchedule = fin.collectionSchedules.find((s) => {
        const sDate = new Date(s.scheduledDate);
        return sDate >= startOfDay && sDate <= endOfDay;
      }) || fin.collectionSchedules.find((s) => s.status === 'PENDING' || s.status === 'PARTIAL') || fin.collectionSchedules[0];

      const expectedAmount = todaySchedule ? Number(todaySchedule.expectedAmount) : Number(fin.dailyCollectionAmount);
      const paidAmount = todaySchedule ? Number(todaySchedule.paidAmount) : 0;
      const status = todaySchedule ? todaySchedule.status : 'PENDING';

      return {
        id: todaySchedule ? todaySchedule.id : fin.id,
        financeId: fin.id,
        customerId: fin.customerId,
        customerName: fin.customer.fullName,
        customerPhone: fin.customer.phone,
        dailyAmount: Number(fin.dailyCollectionAmount),
        expectedAmount,
        paidAmount,
        status,
        scheduledDate: todaySchedule ? todaySchedule.scheduledDate : fin.startDate,
      };
    });

    const summary = {
      totalRecords: collections.length,
      totalExpectedToday: collections.reduce((acc, c) => acc + c.expectedAmount, 0),
      totalCollectedToday: collections.reduce((acc, c) => acc + c.paidAmount, 0),
      paidCount: collections.filter((c) => c.status === 'PAID').length,
      pendingCount: collections.filter((c) => c.status === 'PENDING' || c.status === 'PARTIAL').length,
      missedCount: collections.filter((c) => c.status === 'MISSED').length,
    };

    return NextResponse.json({ summary, collections, schedules: collections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch today collections' }, { status: 500 });
  }
}
