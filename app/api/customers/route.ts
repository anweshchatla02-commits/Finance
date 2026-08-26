import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';
import { getAuthSession } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url || 'http://localhost:3000', 'http://localhost:3000');
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';

  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: status ? status : undefined,
        OR: search
          ? [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      include: {
        finances: {
          select: {
            id: true,
            status: true,
            amountGiven: true,
            totalAmountToCollect: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    const existingPhone = await prisma.customer.findFirst({
      where: { phone: validatedData.phone.trim() },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: 'A customer with this phone number already exists' },
        { status: 400 }
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        fullName: validatedData.fullName.trim(),
        phone: validatedData.phone.trim(),
        address: validatedData.address.trim(),
        notes: validatedData.notes ? validatedData.notes.trim() : null,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: 'CUSTOMER_CREATE',
      entityType: 'Customer',
      entityId: newCustomer.id,
      metadata: { fullName: newCustomer.fullName, phone: newCustomer.phone },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
