import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function getAuthSession(): AuthUser | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('auth_session');
    if (!sessionCookie?.value) return null;

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const user = JSON.parse(decoded);
    if (!user || !user.id) return null;
    return user;
  } catch (err) {
    return null;
  }
}
