'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, Plus, Search, Eye, Filter, RefreshCw } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { formatDateReadable } from '@/lib/date';

export default function FinancesPage() {
  const [finances, setFinances] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finances?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setFinances(data);
      }
    } catch (err) {
      console.error('Failed to fetch finances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, [statusFilter]);

  const filteredFinances = finances.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.customer?.fullName?.toLowerCase().includes(q) ||
      f.customer?.phone?.includes(q) ||
      f.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finances & Loans</h1>
          <p className="text-sm text-slate-500">Active agreements, collection schedules, and balances</p>
        </div>

        <Link
          href="/finances/new"
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Finance</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or ID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs font-semibold">
            {['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded ${statusFilter === st ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchFinances}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Finances Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount Given</th>
                <th className="px-4 py-3">Total To Collect</th>
                <th className="px-4 py-3">Daily Amount</th>
                <th className="px-4 py-3">Extra / Profit</th>
                <th className="px-4 py-3">Collected</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFinances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No finance records found.
                  </td>
                </tr>
              ) : (
                filteredFinances.map((fin) => (
                  <tr key={fin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{fin.customer?.fullName}</p>
                      <p className="text-xs text-slate-500">{fin.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(fin.amountGiven)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(fin.totalAmountToCollect)}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{formatINR(fin.dailyCollectionAmount)}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">{formatINR(fin.extraProfitAmount)}</td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">{formatINR(fin.totalCollected)}</td>
                    <td className="px-4 py-3.5 font-semibold text-sky-700">{formatINR(fin.remainingAmount)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          fin.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fin.status === 'COMPLETED'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {fin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/customers/${fin.customerId}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
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
