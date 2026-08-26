import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { financeSchema } from '@/lib/schemas';
import { calculateFinanceSchedule } from '@/lib/finance-calculations';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'ALL';
  const customerId = searchParams.get('customerId') || undefined;

  try {
    const finances = await prisma.finance.findMany({
      where: {
        status: status === 'ALL' ? undefined : status,
        customerId: customerId,
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, address: true },
        },
        payments: {
          select: { amount: true },
        },
        collectionSchedules: {
          select: { id: true, status: true, expectedAmount: true, paidAmount: true, scheduledDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format finances with progress summary
    const formatted = finances.map((f) => {
      const totalCollected = f.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const totalToCollect = Number(f.totalAmountToCollect);
      const remainingAmount = Math.max(0, totalToCollect - totalCollected);
      const progressPercentage = totalToCollect > 0 ? Math.min(100, (totalCollected / totalToCollect) * 100) : 0;
      const missedCount = f.collectionSchedules.filter((s) => s.status === 'MISSED').length;

      return {
        ...f,
        amountGiven: Number(f.amountGiven),
        totalAmountToCollect: totalToCollect,
        dailyCollectionAmount: Number(f.dailyCollectionAmount),
        totalCollected,
        remainingAmount,
        progressPercentage: Number(progressPercentage.toFixed(1)),
        missedCount,
        extraProfitAmount: totalToCollect - Number(f.amountGiven),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch finance records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = financeSchema.parse(body);

    const calculation = calculateFinanceSchedule({
      amountGiven: validatedData.amountGiven,
      totalAmountToCollect: validatedData.totalAmountToCollect,
      dailyCollectionAmount: validatedData.dailyCollectionAmount,
      startDate: new Date(validatedData.startDate),
      numberOfCollectionDays: validatedData.numberOfCollectionDays,
    });

    const newFinance = await prisma.$transaction(async (tx) => {
      const finance = await tx.finance.create({
        data: {
          customerId: validatedData.customerId,
          amountGiven: calculation.amountGiven,
          totalAmountToCollect: calculation.totalAmountToCollect,
          dailyCollectionAmount: calculation.dailyCollectionAmount,
          startDate: calculation.startDate,
          numberOfCollectionDays: calculation.totalDays,
          endDate: calculation.endDate,
          status: 'ACTIVE',
          notes: validatedData.notes ? validatedData.notes.trim() : null,
        },
      });

      const schedulesToInsert = calculation.schedule.map((item) => ({
        financeId: finance.id,
        scheduledDate: item.scheduledDate,
        expectedAmount: item.expectedAmount,
        paidAmount: 0,
        status: 'PENDING',
      }));

      await tx.collectionSchedule.createMany({
        data: schedulesToInsert,
      });

      return finance;
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'FINANCE_CREATE',
      entityType: 'Finance',
      entityId: newFinance.id,
      metadata: {
        customerId: newFinance.customerId,
        amountGiven: calculation.amountGiven,
        totalToCollect: calculation.totalAmountToCollect,
        dailyAmount: calculation.dailyCollectionAmount,
        days: calculation.totalDays,
      },
    });

    return NextResponse.json(
      {
        ...newFinance,
        mismatchWarning: calculation.mismatchWarning,
        extraProfitAmount: calculation.extraProfitAmount,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create finance record' }, { status: 500 });
  }
}
