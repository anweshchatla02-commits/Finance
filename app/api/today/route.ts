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
  const dateParam = url.searchParams.get('date');

  try {
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const schedules = await prisma.collectionSchedule.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        finance: {
          include: {
            customer: true,
            payments: { select: { amount: true } },
          },
        },
      },
      orderBy: { finance: { customer: { fullName: 'asc' } } },
    });

    const summary = {
      totalExpectedToday: schedules.reduce((acc, s) => acc + Number(s.expectedAmount), 0),
      totalCollectedToday: schedules.reduce((acc, s) => acc + Number(s.paidAmount), 0),
      paidCount: schedules.filter((s) => s.status === 'PAID').length,
      pendingCount: schedules.filter((s) => s.status === 'PENDING' || s.status === 'PARTIAL').length,
      missedCount: schedules.filter((s) => s.status === 'MISSED').length,
    };

    return NextResponse.json({ summary, schedules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch today collections' }, { status: 500 });
  }
}
