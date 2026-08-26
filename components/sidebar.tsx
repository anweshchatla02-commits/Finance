'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Landmark,
} from 'lucide-react';

const navigation = [
  { name: "Dashboard", href: '/', icon: LayoutDashboard },
  { name: "Today's Collection", href: '/today', icon: CalendarCheck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Finances / Loans', href: '/finances', icon: Wallet },
  { name: 'Payments History', href: '/payments', icon: Receipt },
  { name: 'Reports & Export', href: '/reports', icon: BarChart3 },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
  { name: 'Settings & Backup', href: '/settings', icon: Settings },
];

export default function Sidebar() {
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
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        {/* App Branding */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-sky-500 p-2 rounded-lg text-white">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Finance Manager</h1>
            <p className="text-xs text-slate-400">Daily Collection System</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm font-semibold truncate text-slate-100">Dad (Admin)</p>
            <p className="text-xs text-slate-400 truncate">dad@finance.com</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
