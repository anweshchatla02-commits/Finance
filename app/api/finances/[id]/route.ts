import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const finance = await prisma.finance.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        collectionSchedules: { orderBy: { scheduledDate: 'asc' } },
      },
    });

    if (!finance) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    const totalCollected = finance.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalToCollect = Number(finance.totalAmountToCollect);
    const amountGiven = Number(finance.amountGiven);
    const remainingAmount = Math.max(0, totalToCollect - totalCollected);
    const progressPercentage = totalToCollect > 0 ? Math.min(100, (totalCollected / totalToCollect) * 100) : 0;
    const missedCount = finance.collectionSchedules.filter((s) => s.status === 'MISSED').length;

    return NextResponse.json({
      ...finance,
      amountGiven,
      totalAmountToCollect: totalToCollect,
      dailyCollectionAmount: Number(finance.dailyCollectionAmount),
      totalCollected,
      remainingAmount,
      progressPercentage: Number(progressPercentage.toFixed(1)),
      extraProfitAmount: totalToCollect - amountGiven,
      missedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch finance details' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, notes } = body;

    if (!['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid finance status' }, { status: 400 });
    }

    const updated = await prisma.finance.update({
      where: { id: params.id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'FINANCE_STATUS_CHANGE',
      entityType: 'Finance',
      entityId: params.id,
      metadata: { newStatus: status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update finance status' }, { status: 500 });
  }
}
