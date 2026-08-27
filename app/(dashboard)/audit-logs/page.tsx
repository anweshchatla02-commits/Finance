'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { formatDateTimeReadable } from '@/lib/date';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            <span>Admin System Audit Logs</span>
          </h1>
          <p className="text-sm text-slate-500">Security audit trail of system operations and user actions</p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans text-sm">
                    No audit log events recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {formatDateTimeReadable(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-sans font-medium">
                      {log.user?.email || 'System'}
                    </td>
                    <td className="px-4 py-3 font-bold text-sky-700">{log.action}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">{log.entityType}</td>
                    <td className="px-4 py-3 text-slate-500">{log.entityId || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-xs">
                      {typeof log.metadata === 'object' && log.metadata !== null
                        ? JSON.stringify(log.metadata)
                        : log.metadata || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
