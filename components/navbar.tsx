'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Landmark,
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
} from 'lucide-react';

const mobileNavItems = [
  { name: "Dashboard", href: '/', icon: LayoutDashboard },
  { name: "Today's Collection", href: '/today', icon: CalendarCheck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Finances', href: '/finances', icon: Wallet },
  { name: 'Payments', href: '/payments', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/login';
  };

  return (
    <>
      <header className="bg-slate-900 text-white md:hidden border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2.5">
            <div className="bg-sky-500 p-1.5 rounded-md text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight">Finance Manager</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1">
            {mobileNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Dad (Admin)</p>
                <p className="text-[11px] text-slate-400">dad@finance.com</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium py-1 px-2 rounded hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Fixed Bar for 1-Touch Quick Actions */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 md:hidden z-30 flex justify-around py-2 px-1">
        <Link
          href="/"
          className={`flex flex-col items-center text-[10px] font-medium ${
            pathname === '/' ? 'text-sky-400' : 'hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/today"
          className={`flex flex-col items-center text-[10px] font-medium ${
            pathname === '/today' ? 'text-sky-400' : 'hover:text-white'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span>Today</span>
        </Link>

        <Link
          href="/customers"
          className={`flex flex-col items-center text-[10px] font-medium ${
            pathname.startsWith('/customers') ? 'text-sky-400' : 'hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Customers</span>
        </Link>

        <Link
          href="/finances"
          className={`flex flex-col items-center text-[10px] font-medium ${
            pathname.startsWith('/finances') ? 'text-sky-400' : 'hover:text-white'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Finances</span>
        </Link>

        <Link
          href="/payments"
          className={`flex flex-col items-center text-[10px] font-medium ${
            pathname.startsWith('/payments') ? 'text-sky-400' : 'hover:text-white'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Payments</span>
        </Link>
      </nav>
    </>
  );
}
