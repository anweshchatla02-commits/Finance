'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarCheck, Calendar, Filter, RefreshCw, CheckCircle2, Eye, Clock, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { getTodayISTString, formatDateReadable } from '@/lib/date';
import PaymentModal from '@/components/payment-modal';
import ReceiptModal from '@/components/receipt-modal';

export default function TodayCollectionPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISTString());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchCollectionData = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/today?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch daily collection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData(selectedDate);
  }, [selectedDate]);

  const handleQuickMarkPaid = async (item: any) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financeId: item.financeId,
          customerId: item.customerId,
          amount: item.expectedAmount,
          paymentDate: selectedDate,
          paymentMethod: 'CASH',
          notes: `Marked paid for date ${selectedDate}`,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setReceiptData({
          id: json.payment.id,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          financeId: item.financeId,
          amount: item.expectedAmount,
          paymentDate: json.payment.paymentDate,
          paymentMethod: 'CASH',
          totalCollected: json.totalCollected,
          remainingAmount: json.remainingAmount,
        });
        setIsReceiptModalOpen(true);
        fetchCollectionData(selectedDate);
      } else {
        alert(json.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert(err.message || 'Payment error');
    }
  };

  const filteredCollections = data?.collections?.filter((c: any) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarCheck className="w-7 h-7 text-sky-600" />
            <span>Daily Collection Screen</span>
          </h1>
          <p className="text-sm text-slate-500">
            Showing scheduled collections for <span className="font-semibold text-slate-900">{formatDateReadable(selectedDate)}</span>
          </p>
        </div>

        {/* Date Selector Input */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
          </div>
          <button
            onClick={() => setSelectedDate(getTodayISTString())}
            className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300"
          >
            Today
          </button>
          <button
            onClick={() => fetchCollectionData(selectedDate)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Expected</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(data?.summary?.totalExpected || 0)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(data?.summary?.totalCollected || 0)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatINR(data?.summary?.totalPending || 0)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Missed</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{data?.summary?.missedCount || 0}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {['ALL', 'PENDING', 'PAID', 'PARTIAL', 'MISSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Borrower Name</th>
                <th className="px-4 py-3">Daily Target</th>
                <th className="px-4 py-3">Paid Amount</th>
                <th className="px-4 py-3">Remaining Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCollections?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No collection records found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredCollections?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{item.customerName}</p>
                      <p className="text-xs text-slate-500">{item.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(item.expectedAmount)}</td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">{formatINR(item.paidAmount)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{formatINR(item.remainingOnLoan)}</td>
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
                              setSelectedItem(item);
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
        onSuccess={() => fetchCollectionData(selectedDate)}
        collectionItem={selectedItem}
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
