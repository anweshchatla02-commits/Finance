import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';
import { getAuthSession } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url || 'http://localhost:3000', 'http://localhost:3000');
  const financeId = url.searchParams.get('financeId');
  const customerId = url.searchParams.get('customerId');

  try {
    const payments = await prisma.payment.findMany({
      where: {
        financeId: financeId || undefined,
        customerId: customerId || undefined,
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        finance: { select: { amountGiven: true, totalAmountToCollect: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const finance = await tx.finance.findUnique({
        where: { id: validatedData.financeId },
        include: {
          payments: true,
          collectionSchedules: { orderBy: { scheduledDate: 'asc' } },
        },
      });

      if (!finance) {
        throw new Error('Finance loan record not found');
      }

      const totalPaidSoFar = finance.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const remainingBalance = Number(finance.totalAmountToCollect) - totalPaidSoFar;
      const paymentAmount = Number(validatedData.amount);

      if (paymentAmount > remainingBalance + 0.01) {
        throw new Error(`Payment amount (₹${paymentAmount}) cannot exceed remaining loan balance (₹${remainingBalance})`);
      }

      const paymentDate = new Date(validatedData.paymentDate);

      const newPayment = await tx.payment.create({
        data: {
          financeId: validatedData.financeId,
          customerId: finance.customerId,
          amount: validatedData.amount,
          paymentDate: paymentDate,
          paymentMethod: validatedData.paymentMethod || 'CASH',
          notes: validatedData.notes ? validatedData.notes.trim() : null,
          createdBy: session.id,
        },
      });

      // Distribute payment to schedules chronologically
      let unallocatedAmount = paymentAmount;

      for (const schedule of finance.collectionSchedules) {
        if (unallocatedAmount <= 0) break;

        const expected = Number(schedule.expectedAmount);
        const alreadyPaid = Number(schedule.paidAmount);
        const dueOnThisSchedule = expected - alreadyPaid;

        if (dueOnThisSchedule > 0) {
          const alloc = Math.min(unallocatedAmount, dueOnThisSchedule);
          const newPaid = alreadyPaid + alloc;
          const isFullyPaid = newPaid >= expected - 0.01;

          await tx.collectionSchedule.update({
            where: { id: schedule.id },
            data: {
              paidAmount: newPaid,
              status: isFullyPaid ? 'PAID' : 'PARTIAL',
              paidAt: isFullyPaid ? paymentDate : schedule.paidAt,
            },
          });

          unallocatedAmount -= alloc;
        }
      }

      // Check if loan is now fully completed
      const newTotalPaid = totalPaidSoFar + paymentAmount;
      if (newTotalPaid >= Number(finance.totalAmountToCollect) - 0.01) {
        await tx.finance.update({
          where: { id: finance.id },
          data: { status: 'COMPLETED' },
        });
      }

      return newPayment;
    });

    await createAuditLog({
      userId: session.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: result.id,
      metadata: { financeId: result.financeId, amount: result.amount },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 400 });
  }
}
