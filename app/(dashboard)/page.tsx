'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  TrendingUp,
  Wallet,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
import { formatINR } from '@/lib/currency';
import PaymentModal from '@/components/payment-modal';
import ReceiptModal from '@/components/receipt-modal';

export default function DashboardPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  // Receipt Modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, todayRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/today'),
      ]);

      if (repRes.ok) setReportData(await repRes.json());
      if (todayRes.ok) setTodayData(await todayRes.json());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickMarkPaid = async (item: any) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financeId: item.financeId,
          customerId: item.customerId,
          amount: item.expectedAmount,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'CASH',
          notes: 'Quick mark paid from dashboard',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReceiptData({
          id: data.payment.id,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          financeId: item.financeId,
          amount: item.expectedAmount,
          paymentDate: data.payment.paymentDate,
          paymentMethod: 'CASH',
          totalCollected: data.totalCollected,
          remainingAmount: data.remainingAmount,
        });
        setIsReceiptModalOpen(true);
        fetchData();
      } else {
        alert(data.error || 'Failed to record quick payment');
      }
    } catch (err: any) {
      alert(err.message || 'Quick payment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-slate-500">Daily Money Lending & Collection Summary</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/finances/new"
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Finance</span>
          </Link>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Expected */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Today Expected</span>
            <div className="bg-sky-50 p-2 rounded-lg text-sky-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatINR(reportData?.todayStats?.expected || 0)}
          </p>
          <p className="text-xs text-slate-500">{todayData?.summary?.totalRecords || 0} collections scheduled today</p>
        </div>

        {/* Today's Collected */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today Collected</span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">
            {formatINR(reportData?.todayStats?.collected || 0)}
          </p>
          <p className="text-xs text-emerald-700 font-medium">
            {todayData?.summary?.paidCount || 0} paid today
          </p>
        </div>

        {/* Today's Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today Pending</span>
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">
            {formatINR(reportData?.todayStats?.pending || 0)}
          </p>
          <p className="text-xs text-slate-500">Remaining to collect today</p>
        </div>

        {/* Today's Missed / Overdue */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today Missed</span>
            <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600">
            {reportData?.todayStats?.missed || 0}
          </p>
          <p className="text-xs text-slate-500">Missed collections today</p>
        </div>
      </div>

      {/* Financial Portfolio Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Money Given</p>
          <p className="text-xl font-bold">{formatINR(reportData?.totalMoneyGiven || 0)}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Outstanding</p>
          <p className="text-xl font-bold text-sky-400">{formatINR(reportData?.totalOutstandingOverall || 0)}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Collected Overall</p>
          <p className="text-xl font-bold text-emerald-400">{formatINR(reportData?.totalCollectedOverall || 0)}</p>
        </div>

        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Extra / Profit</p>
          <p className="text-xl font-bold text-emerald-400">{formatINR(reportData?.totalExtraProfitOverall || 0)}</p>
        </div>
      </div>

      {/* TODAY'S COLLECTION LIST TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's Collection List</h2>
            <p className="text-xs text-slate-500">Quick 1-Click Payment Recording</p>
          </div>
          <Link
            href="/today"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
          >
            <span>View Full Daily Schedule</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Daily Amount</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {todayData?.collections?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No active daily collections scheduled for today.
                  </td>
                </tr>
              ) : (
                todayData?.collections?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{item.customerName}</p>
                      <p className="text-xs text-slate-500">{item.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{formatINR(item.dailyAmount)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(item.expectedAmount)}</td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">{formatINR(item.paidAmount)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'MISSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {item.status !== 'PAID' && (
                        <>
                          <button
                            onClick={() => handleQuickMarkPaid(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                          >
                            Mark {formatINR(item.expectedAmount)} Paid
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCollection(item);
                              setIsPaymentModalOpen(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300"
                          >
                            Custom Payment
                          </button>
                        </>
                      )}

                      <Link
                        href={`/customers/${item.customerId}`}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                        title="View Customer Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchData}
        collectionItem={selectedCollection}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
      />
    </div>
  );
}
