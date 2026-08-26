'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Phone, MapPin, Plus, ArrowLeft, Wallet, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { formatDateReadable } from '@/lib/date';
import PaymentModal from '@/components/payment-modal';
import ReceiptModal from '@/components/receipt-modal';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'finances' | 'payments'>('finances');

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  // Receipt modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchCustomerProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      }
    } catch (err) {
      console.error('Failed to fetch customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomerProfile();
  }, [customerId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-rose-500 font-bold">Customer profile not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <Link href="/customers" className="inline-flex items-center space-x-1 text-sm font-semibold text-sky-600 hover:text-sky-700">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customers List</span>
      </Link>

      {/* Customer Header Card */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold">{customer.fullName}</h1>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                customer.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {customer.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{customer.address}</span>
            </div>
          </div>

          {customer.notes && <p className="text-xs text-slate-400 italic">Notes: {customer.notes}</p>}
        </div>

        <Link
          href={`/finances/new?customerId=${customer.id}`}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-lg shadow flex items-center space-x-1.5 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Finance Loan</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-4">
        <button
          onClick={() => setActiveTab('finances')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'finances' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Finance Records ({customer.finances?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'payments' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Payment History ({customer.payments?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          {customer.finances?.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400">
              No finance loan records for this customer yet.
            </div>
          ) : (
            customer.finances.map((fin: any) => {
              const amountGiven = Number(fin.amountGiven);
              const totalToCollect = Number(fin.totalAmountToCollect);
              const dailyAmount = Number(fin.dailyCollectionAmount);
              const extraProfit = totalToCollect - amountGiven;
              const totalCollected = fin.payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);
              const remaining = Math.max(0, totalToCollect - totalCollected);
              const missedCount = fin.collectionSchedules.filter((s: any) => s.status === 'MISSED').length;

              return (
                <div key={fin.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
                  {/* Finance Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-500">ID: {fin.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            fin.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : fin.status === 'COMPLETED'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {fin.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Start: {formatDateReadable(fin.startDate)} | Duration: {fin.numberOfCollectionDays} days
                      </p>
                    </div>

                    {fin.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setSelectedCollection({
                            financeId: fin.id,
                            customerId: customer.id,
                            customerName: customer.fullName,
                            expectedAmount: dailyAmount,
                            remainingOnLoan: remaining,
                            dailyAmount: dailyAmount,
                          });
                          setIsPaymentModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>

                  {/* Finance Financial Breakdown Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Amount Given:</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatINR(amountGiven)}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Total To Collect:</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatINR(totalToCollect)}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Daily Amount:</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatINR(dailyAmount)} / day</p>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <span className="text-emerald-800 font-medium">Extra / Profit Amount:</span>
                      <p className="text-base font-extrabold text-emerald-700 mt-0.5">{formatINR(extraProfit)}</p>
                    </div>
                  </div>

                  {/* Progress & Balances */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-slate-500">Collected So Far:</span>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatINR(totalCollected)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-slate-500">Remaining Balance:</span>
                      <p className="text-sm font-bold text-sky-600 mt-0.5">{formatINR(remaining)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-slate-500">Missed Collections:</span>
                      <p className={`text-sm font-bold mt-0.5 ${missedCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {missedCount} days missed
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Finance ID</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customer.payments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  customer.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{formatDateReadable(p.paymentDate)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatINR(p.amount)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{p.paymentMethod}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.financeId}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">{p.notes || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setReceiptData({
                              id: p.id,
                              customerName: customer.fullName,
                              customerPhone: customer.phone,
                              financeId: p.financeId,
                              amount: Number(p.amount),
                              paymentDate: p.paymentDate,
                              paymentMethod: p.paymentMethod,
                              notes: p.notes,
                              totalCollected: 0,
                              remainingAmount: 0,
                            });
                            setIsReceiptModalOpen(true);
                          }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 underline"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchCustomerProfile}
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
