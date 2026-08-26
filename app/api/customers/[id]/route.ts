import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        finances: {
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
            collectionSchedules: { orderBy: { scheduledDate: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer profile' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        fullName: validatedData.fullName.trim(),
        phone: validatedData.phone.trim(),
        address: validatedData.address.trim(),
        notes: validatedData.notes ? validatedData.notes.trim() : null,
        status: validatedData.status,
      },
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'CUSTOMER_EDIT',
      entityType: 'Customer',
      entityId: updatedCustomer.id,
      metadata: { name: updatedCustomer.fullName, status: updatedCustomer.status },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if customer has active financial records
    const activeFinances = await prisma.finance.count({
      where: { customerId: params.id, status: 'ACTIVE' },
    });

    if (activeFinances > 0) {
      // Soft-delete (archive) instead of deleting records with transactions
      const archived = await prisma.customer.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED' },
      });

      await createAuditLog({
        userId: (session.user as any).id,
        action: 'CUSTOMER_ARCHIVE',
        entityType: 'Customer',
        entityId: params.id,
        metadata: { reason: 'Has active finance records' },
      });

      return NextResponse.json({ message: 'Customer archived because active finances exist', customer: archived });
    }

    // Soft delete / archive
    const archived = await prisma.customer.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'CUSTOMER_ARCHIVE',
      entityType: 'Customer',
      entityId: params.id,
    });

    return NextResponse.json({ message: 'Customer archived successfully', customer: archived });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to archive customer' }, { status: 500 });
  }
}
