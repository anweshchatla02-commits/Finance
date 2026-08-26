const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  const user = await prisma.user.findUnique({ where: { email: 'dad@finance.com' } });
  if (!user) {
    console.log('User dad@finance.com not found');
    return;
  }
  const match = await bcrypt.compare('admin123', user.password);
  console.log('✔ Login Verification for dad@finance.com:', match ? 'SUCCESSFUL (Password Verified)' : 'FAILED');
}

testLogin().catch(console.error).finally(() => prisma.$disconnect());
