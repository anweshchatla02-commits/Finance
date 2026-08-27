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
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, phone, address, notes, status } = body;

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        address: address ? address.trim() : undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
        status: status || undefined,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: 'CUSTOMER_UPDATE',
      entityType: 'Customer',
      entityId: updatedCustomer.id,
      metadata: { fullName: updatedCustomer.fullName, phone: updatedCustomer.phone },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deletedCustomer = await prisma.customer.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId: session.id,
      action: 'CUSTOMER_DELETE',
      entityType: 'Customer',
      entityId: params.id,
      metadata: { fullName: deletedCustomer.fullName },
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
