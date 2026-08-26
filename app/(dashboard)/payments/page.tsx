'use client';

import { useState, useEffect } from 'react';
import { Receipt, Search, Printer, RefreshCw } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { formatDateReadable, formatDateTimeReadable } from '@/lib/date';
import ReceiptModal from '@/components/receipt-modal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Receipt Modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments?limit=100');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.customer?.fullName?.toLowerCase().includes(q) ||
      p.customer?.phone?.includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-7 h-7 text-sky-600" />
            <span>Payments Transaction Log</span>
          </h1>
          <p className="text-sm text-slate-500">History of all collected daily payments and receipts</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={fetchPayments}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount Received</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Receipt Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No payment transaction records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {formatDateTimeReadable(p.paymentDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{p.customer?.fullName}</p>
                      <p className="text-xs text-slate-500">{p.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-600 text-base">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 italic">{p.notes || '-'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedReceipt({
                            id: p.id,
                            customerName: p.customer?.fullName,
                            customerPhone: p.customer?.phone,
                            financeId: p.financeId,
                            amount: p.amount,
                            paymentDate: p.paymentDate,
                            paymentMethod: p.paymentMethod,
                            notes: p.notes,
                            totalCollected: 0,
                            remainingAmount: 0,
                          });
                          setIsReceiptModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-lg hover:bg-sky-100"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
}
