import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { financeSchema } from '@/lib/schemas';
import { calculateFinanceSchedule } from '@/lib/finance-calculations';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url || 'http://localhost:3000', 'http://localhost:3000');
  const status = url.searchParams.get('status') || 'ACTIVE';
  const customerId = url.searchParams.get('customerId');

  try {
    const finances = await prisma.finance.findMany({
      where: {
        status: status === 'ALL' ? undefined : status,
        customerId: customerId || undefined,
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        payments: { select: { amount: true } },
        collectionSchedules: { select: { expectedAmount: true, paidAmount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(finances);
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

    const startDate = new Date(validatedData.startDate);
    const scheduleResult = calculateFinanceSchedule({
      amountGiven: validatedData.amountGiven,
      totalAmountToCollect: validatedData.totalAmountToCollect,
      dailyCollectionAmount: validatedData.dailyCollectionAmount,
      startDate: startDate,
      numberOfCollectionDays: validatedData.numberOfCollectionDays,
    });

    const newFinance = await prisma.$transaction(async (tx) => {
      const finance = await tx.finance.create({
        data: {
          customerId: validatedData.customerId,
          amountGiven: validatedData.amountGiven,
          totalAmountToCollect: validatedData.totalAmountToCollect,
          dailyCollectionAmount: validatedData.dailyCollectionAmount,
          startDate: startDate,
          numberOfCollectionDays: scheduleResult.totalDays,
          endDate: scheduleResult.endDate,
          status: 'ACTIVE',
          notes: validatedData.notes ? validatedData.notes.trim() : null,
        },
      });

      await tx.collectionSchedule.createMany({
        data: scheduleResult.schedule.map((sch) => ({
          financeId: finance.id,
          scheduledDate: sch.scheduledDate,
          expectedAmount: sch.expectedAmount,
          paidAmount: 0,
          status: 'PENDING',
        })),
      });

      return finance;
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'FINANCE_CREATE',
      entityType: 'Finance',
      entityId: newFinance.id,
      metadata: { customerId: newFinance.customerId, amountGiven: newFinance.amountGiven },
    });

    return NextResponse.json(newFinance, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create finance record' }, { status: 500 });
  }
}
