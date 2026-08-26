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
  const dateStr = searchParams.get('date') || getTodayISTString();
  const selectedDate = toISTStartOfDay(dateStr);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(selectedDate.getDate() + 1);

  try {
    // 1. Fetch schedules for selected date
    const schedules = await prisma.collectionSchedule.findMany({
      where: {
        scheduledDate: {
          gte: selectedDate,
          lt: nextDate,
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

    // Automatically mark past un-collected schedules as MISSED if scheduledDate < today start
    const todayStart = toISTStartOfDay(getTodayISTString());

    const items = schedules.map((item) => {
      const isPastUnpaid = item.scheduledDate < todayStart && item.status === 'PENDING';
      const currentStatus = isPastUnpaid ? 'MISSED' : item.status;

      const totalCollectedOnLoan = item.finance.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const totalToCollect = Number(item.finance.totalAmountToCollect);
      const remainingOnLoan = Math.max(0, totalToCollect - totalCollectedOnLoan);

      return {
        id: item.id,
        financeId: item.financeId,
        customerId: item.finance.customerId,
        customerName: item.finance.customer.fullName,
        customerPhone: item.finance.customer.phone,
        customerAddress: item.finance.customer.address,
        scheduledDate: item.scheduledDate,
        expectedAmount: Number(item.expectedAmount),
        paidAmount: Number(item.paidAmount),
        remainingForDay: Math.max(0, Number(item.expectedAmount) - Number(item.paidAmount)),
        status: currentStatus,
        loanStatus: item.finance.status,
        remainingOnLoan,
        totalToCollect,
        dailyAmount: Number(item.finance.dailyCollectionAmount),
      };
    });

    const totalExpected = items.reduce((sum, i) => sum + i.expectedAmount, 0);
    const totalCollected = items.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalPending = Math.max(0, totalExpected - totalCollected);
    const missedCount = items.filter((i) => i.status === 'MISSED').length;
    const paidCount = items.filter((i) => i.status === 'PAID').length;

    return NextResponse.json({
      selectedDate: dateStr,
      summary: {
        totalExpected,
        totalCollected,
        totalPending,
        missedCount,
        paidCount,
        totalRecords: items.length,
      },
      collections: items,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch today's collections" }, { status: 500 });
  }
}
