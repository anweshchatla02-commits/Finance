'use client';

import { useState } from 'react';
import { Settings, Download, Database, Shield, Globe, Landmark, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadBackup = () => {
    setDownloading(true);
    window.open('/api/backup', '_blank');
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-7 h-7 text-sky-600" />
          <span>Application Settings & Database Backup</span>
        </h1>
        <p className="text-sm text-slate-500">Business configuration, security settings, and data exports</p>
      </div>

      {/* System Defaults Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Globe className="w-5 h-5 text-sky-600" />
          <span>Regional & Business Defaults</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase">Business Name</span>
            <p className="text-sm font-bold text-slate-900 mt-1">Private Finance Manager</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase">Currency Format</span>
            <p className="text-sm font-bold text-slate-900 mt-1">Indian Rupee (INR - ₹)</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase">Timezone Standard</span>
            <p className="text-sm font-bold text-slate-900 mt-1">Asia/Kolkata (IST +05:30)</p>
          </div>
        </div>
      </div>

      {/* Database Backup & Disaster Recovery Strategy Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Database Backup & Export</h2>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download Database JSON Backup</span>
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
          <p className="font-bold text-slate-900 text-sm">Recommended Automated PostgreSQL Backup Setup:</p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
            <li>
              <strong>Daily Managed Snapshots</strong>: Configure daily automatic database backups in your PostgreSQL hosting provider (e.g. Supabase, Neon, Railway, or AWS RDS).
            </li>
            <li>
              <strong>CLI Dump Command (`pg_dump`)</strong>: Run regular offline SQL backups using:
              <code className="block bg-slate-900 text-slate-100 p-2 rounded mt-1 font-mono text-[11px]">
                pg_dump -U postgres -d daily_finance &gt; backup_$(date +%Y%m%d).sql
              </code>
            </li>
            <li>
              <strong>Weekly Offsite Archive</strong>: Click "Download Database JSON Backup" above to export all financial transaction JSON records safely to an offline hard drive or secure cloud storage.
            </li>
          </ul>
        </div>
      </div>

      {/* Admin Profile Account Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-sky-600" />
          <span>Admin Profile Security</span>
        </h2>

        <div className="text-xs space-y-2 text-slate-700">
          <p><span className="font-semibold text-slate-900">Logged in User:</span> {session?.user?.name || 'Admin User'}</p>
          <p><span className="font-semibold text-slate-900">Email Address:</span> {session?.user?.email || 'admin@finance.local'}</p>
          <p><span className="font-semibold text-slate-900">Role:</span> System Administrator</p>
        </div>
      </div>
    </div>
  );
}
