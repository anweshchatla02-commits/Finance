import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url || 'http://localhost:3000', 'http://localhost:3000');
  const query = url.searchParams.get('query')?.trim() || '';
  const status = url.searchParams.get('status') || 'ACTIVE';

  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: status === 'ALL' ? undefined : status,
        OR: query
          ? [
              { fullName: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
              { address: { contains: query, mode: 'insensitive' } },
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
            dailyCollectionAmount: true,
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    const newCustomer = await prisma.customer.create({
      data: {
        fullName: validatedData.fullName.trim(),
        phone: validatedData.phone.trim(),
        address: validatedData.address.trim(),
        notes: validatedData.notes ? validatedData.notes.trim() : null,
        status: validatedData.status || 'ACTIVE',
      },
    });

    await createAuditLog({
      userId: (session.user as any).id,
      action: 'CUSTOMER_CREATE',
      entityType: 'Customer',
      entityId: newCustomer.id,
      metadata: { name: newCustomer.fullName, phone: newCustomer.phone },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
