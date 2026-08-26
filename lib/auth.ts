import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { createAuditLog } from './audit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email / Username', type: 'text', placeholder: 'admin@finance.local' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email/Username and Password are required');
        }

        const cleanEmail = credentials.email.trim().toLowerCase();

        try {
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            throw new Error('Invalid email or password');
          }

          // Non-blocking audit log record
          createAuditLog({
            userId: user.id,
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user.id,
            metadata: { email: user.email },
          }).catch((err) => console.error('Login audit log failed:', err));

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          console.error('NextAuth authorize error:', error);
          throw new Error(error.message || 'Invalid email or password');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'a4f89d31b2e67c80512f4b3e8c9d1a0b5c6d7e8f90123456789abcdef0123456',
};
