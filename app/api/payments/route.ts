import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { paymentSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const financeId = searchParams.get('financeId') || undefined;
  const customerId = searchParams.get('customerId') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

  try {
    const payments = await prisma.payment.findMany({
      where: { financeId, customerId },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        finance: { select: { id: true, totalAmountToCollect: true, dailyCollectionAmount: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });

    const formatted = payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payment history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    const finance = await prisma.finance.findUnique({
      where: { id: validatedData.financeId },
      include: {
        payments: { select: { amount: true } },
        collectionSchedules: { orderBy: { scheduledDate: 'asc' } },
      },
    });

    if (!finance) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    const currentTotalCollected = finance.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalToCollect = Number(finance.totalAmountToCollect);
    const remainingToCollect = totalToCollect - currentTotalCollected;

    const paymentAmount = validatedData.amount;

    // Overpayment safeguard check
    if (paymentAmount > remainingToCollect && !validatedData.allowOverpayment) {
      return NextResponse.json(
        {
          error: `Payment amount (₹${paymentAmount}) exceeds remaining balance (₹${remainingToCollect}). Please confirm overpayment if intended.`,
          requiresConfirmation: true,
          remainingAmount: remainingToCollect,
        },
        { status: 400 }
      );
    }

    const paymentDate = new Date(validatedData.paymentDate);

    // Execute atomic transaction for payment + schedule update + finance completion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment entry
      const newPayment = await tx.payment.create({
        data: {
          financeId: validatedData.financeId,
          customerId: validatedData.customerId,
          amount: paymentAmount,
          paymentDate,
          paymentMethod: validatedData.paymentMethod,
          notes: validatedData.notes ? validatedData.notes.trim() : null,
          createdBy: (session.user as any).id,
        },
      });

      // 2. Distribute payment across schedules
      let unallocatedAmount = paymentAmount;
      const pendingSchedules = finance.collectionSchedules.filter((s) => s.status !== 'PAID');

      for (const scheduleItem of pendingSchedules) {
        if (unallocatedAmount <= 0) break;

        const expected = Number(scheduleItem.expectedAmount);
        const currentPaid = Number(scheduleItem.paidAmount);
        const dueOnThisDay = expected - currentPaid;

        if (dueOnThisDay <= 0) continue;

        if (unallocatedAmount >= dueOnThisDay) {
          // Fully pay this day
          await tx.collectionSchedule.update({
            where: { id: scheduleItem.id },
            data: {
              paidAmount: expected,
              status: 'PAID',
              paidAt: paymentDate,
            },
          });
          unallocatedAmount -= dueOnThisDay;
        } else {
          // Partially pay this day
          await tx.collectionSchedule.update({
            where: { id: scheduleItem.id },
            data: {
              paidAmount: currentPaid + unallocatedAmount,
              status: 'PARTIAL',
              paidAt: paymentDate,
            },
          });
          unallocatedAmount = 0;
        }
      }

      // 3. Check if finance is fully paid -> Mark COMPLETED
      const newTotalCollected = currentTotalCollected + paymentAmount;
      const isCompletedNow = newTotalCollected >= totalToCollect;

      if (isCompletedNow && finance.status === 'ACTIVE') {
        await tx.finance.update({
          where: { id: finance.id },
          data: { status: 'COMPLETED' },
        });
      }

      return { newPayment, isCompletedNow, newTotalCollected };
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'PAYMENT_RECORD',
      entityType: 'Payment',
      entityId: result.newPayment.id,
      metadata: {
        financeId: finance.id,
        customerId: validatedData.customerId,
        amount: paymentAmount,
        totalCollectedNow: result.newTotalCollected,
        isCompleted: result.isCompletedNow,
      },
    });

    return NextResponse.json(
      {
        payment: result.newPayment,
        message: 'Payment recorded successfully',
        isCompleted: result.isCompletedNow,
        totalCollected: result.newTotalCollected,
        remainingAmount: Math.max(0, totalToCollect - result.newTotalCollected),
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}
