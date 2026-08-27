import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-cookie';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const finance = await prisma.finance.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        payments: true,
        collectionSchedules: { orderBy: { scheduledDate: 'asc' } },
      },
    });

    if (!finance) {
      return NextResponse.json({ error: 'Finance loan not found' }, { status: 404 });
    }

    return NextResponse.json(finance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch finance record' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amountGiven, totalAmountToCollect, dailyCollectionAmount, status, notes } = body;

    const updatedFinance = await prisma.finance.update({
      where: { id: params.id },
      data: {
        amountGiven: amountGiven !== undefined ? parseFloat(amountGiven) : undefined,
        totalAmountToCollect: totalAmountToCollect !== undefined ? parseFloat(totalAmountToCollect) : undefined,
        dailyCollectionAmount: dailyCollectionAmount !== undefined ? parseFloat(dailyCollectionAmount) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: 'FINANCE_UPDATE',
      entityType: 'Finance',
      entityId: updatedFinance.id,
      metadata: { financeId: updatedFinance.id, status: updatedFinance.status },
    });

    return NextResponse.json(updatedFinance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update finance record' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete schedules, payments, and finance record in transaction
    await prisma.$transaction([
      prisma.collectionSchedule.deleteMany({ where: { financeId: params.id } }),
      prisma.payment.deleteMany({ where: { financeId: params.id } }),
      prisma.finance.delete({ where: { id: params.id } }),
    ]);

    await createAuditLog({
      userId: session.id,
      action: 'FINANCE_DELETE',
      entityType: 'Finance',
      entityId: params.id,
    });

    return NextResponse.json({ success: true, message: 'Finance loan deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete finance loan' }, { status: 500 });
  }
}
