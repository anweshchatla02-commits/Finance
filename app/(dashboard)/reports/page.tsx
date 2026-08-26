'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Users, Wallet, Calendar, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatINR } from '@/lib/currency';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to fetch reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCSVExport = (type: string) => {
    window.open(`/api/export/csv?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-sky-600" />
            <span>Financial Reports & Export</span>
          </h1>
          <p className="text-sm text-slate-500">Business overview, collection trends, and record exports</p>
        </div>

        {/* CSV Export Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCSVExport('finances')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Finances CSV</span>
          </button>
          <button
            onClick={() => handleCSVExport('payments')}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Payments CSV</span>
          </button>
          <button
            onClick={() => handleCSVExport('customers')}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Customers CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Money Given</span>
          <p className="text-2xl font-extrabold text-slate-900">{formatINR(reportData?.totalMoneyGiven || 0)}</p>
          <p className="text-xs text-slate-400">Across all finance loans</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
          <p className="text-2xl font-extrabold text-emerald-600">{formatINR(reportData?.totalCollectedOverall || 0)}</p>
          <p className="text-xs text-emerald-700 font-medium">Actual repayments received</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
          <p className="text-2xl font-extrabold text-sky-600">{formatINR(reportData?.totalOutstandingOverall || 0)}</p>
          <p className="text-xs text-slate-400">Remaining to collect</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Extra / Profit</span>
          <p className="text-2xl font-extrabold text-emerald-600">{formatINR(reportData?.totalExtraProfitOverall || 0)}</p>
          <p className="text-xs text-emerald-700 font-medium">Agreed extra profit</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm text-center">
          <span className="text-xs text-slate-400 font-medium">Active Borrowers</span>
          <p className="text-xl font-extrabold mt-1">{reportData?.activeCustomersCount || 0}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm text-center">
          <span className="text-xs text-slate-400 font-medium">Active Finances</span>
          <p className="text-xl font-extrabold mt-1 text-sky-400">{reportData?.activeFinancesCount || 0}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm text-center">
          <span className="text-xs text-slate-400 font-medium">Completed Loans</span>
          <p className="text-xl font-extrabold mt-1 text-emerald-400">{reportData?.completedFinancesCount || 0}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm text-center">
          <span className="text-xs text-slate-400 font-medium">Total Missed Days</span>
          <p className="text-xl font-extrabold mt-1 text-rose-400">{reportData?.totalMissedSchedules || 0}</p>
        </div>
      </div>

      {/* Recharts Analytics Visualization */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <span>Daily Collection Revenue Trend (Last 30 Days)</span>
          </h2>
        </div>

        <div className="h-72 w-full pt-2">
          {reportData?.collectionTrends?.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No collection trend data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.collectionTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [formatINR(value), 'Collection']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="amount" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
