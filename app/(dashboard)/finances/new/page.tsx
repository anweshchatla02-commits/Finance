'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wallet, ArrowLeft, AlertTriangle, CheckCircle2, Calculator, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { getTodayISTString } from '@/lib/date';
import { calculateFinanceSchedule } from '@/lib/finance-calculations';

function NewFinanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState(preselectedCustomerId);
  const [amountGiven, setAmountGiven] = useState('20000');
  const [totalAmountToCollect, setTotalAmountToCollect] = useState('24000');
  const [dailyCollectionAmount, setDailyCollectionAmount] = useState('300');
  const [startDate, setStartDate] = useState(getTodayISTString());
  const [numberOfCollectionDays, setNumberOfCollectionDays] = useState('80');
  const [notes, setNotes] = useState('');

  const [schedulePreview, setSchedulePreview] = useState<any>(null);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customers?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setError(null);
    setMismatchWarning(null);

    const given = parseFloat(amountGiven);
    const total = parseFloat(totalAmountToCollect);
    const daily = parseFloat(dailyCollectionAmount);
    const days = parseInt(numberOfCollectionDays, 10);

    if (given > 0 && total >= given && daily > 0) {
      try {
        const preview = calculateFinanceSchedule({
          amountGiven: given,
          totalAmountToCollect: total,
          dailyCollectionAmount: daily,
          startDate: startDate ? new Date(startDate) : new Date(),
          numberOfCollectionDays: days || undefined,
        });

        setSchedulePreview(preview);
        if (preview.mismatchWarning) {
          setMismatchWarning(preview.mismatchWarning);
        }
      } catch (err: any) {
        setSchedulePreview(null);
      }
    } else {
      setSchedulePreview(null);
    }
  }, [amountGiven, totalAmountToCollect, dailyCollectionAmount, startDate, numberOfCollectionDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!customerId) {
      setError('Please select a customer');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          amountGiven: parseFloat(amountGiven),
          totalAmountToCollect: parseFloat(totalAmountToCollect),
          dailyCollectionAmount: parseFloat(dailyCollectionAmount),
          startDate,
          numberOfCollectionDays: parseInt(numberOfCollectionDays, 10) || undefined,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create finance record');
        setLoading(false);
        return;
      }

      router.push(`/customers/${customerId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Wallet className="w-7 h-7 text-sky-600" />
          <span>Create New Finance Record</span>
        </h1>
        <p className="text-sm text-slate-500">Configure loan amount, agreed collection, and daily schedule</p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-lg text-sm border border-rose-200 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Select Customer Borrower *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-sky-500"
            required
          >
            <option value="">-- Choose Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Amount Given (₹) *
            </label>
            <input
              type="number"
              step="any"
              value={amountGiven}
              onChange={(e) => setAmountGiven(e.target.value)}
              placeholder="20000"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Total To Collect (₹) *
            </label>
            <input
              type="number"
              step="any"
              value={totalAmountToCollect}
              onChange={(e) => setTotalAmountToCollect(e.target.value)}
              placeholder="24000"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Daily Collection (₹) *
            </label>
            <input
              type="number"
              step="any"
              value={dailyCollectionAmount}
              onChange={(e) => setDailyCollectionAmount(e.target.value)}
              placeholder="300"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Duration / Number of Days
            </label>
            <input
              type="number"
              value={numberOfCollectionDays}
              onChange={(e) => setNumberOfCollectionDays(e.target.value)}
              placeholder="80"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Agreement Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Borrower agreed to daily morning cash payment"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {schedulePreview && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-200 pb-2">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span>Calculated Schedule & Extra Profit Summary</span>
            </div>

            {mismatchWarning && (
              <div className="bg-amber-50 text-amber-900 p-3 rounded-lg text-xs border border-amber-200 flex items-start space-x-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{mismatchWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Extra / Profit Amount:</span>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                  {formatINR(schedulePreview.extraProfitAmount)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Total Duration:</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {schedulePreview.totalDays} Days
                </p>
              </div>
              <div>
                <span className="text-slate-500">Daily Amount:</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {formatINR(schedulePreview.dailyCollectionAmount)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Final Day Amount:</span>
                <p className="text-sm font-extrabold text-sky-700 mt-0.5">
                  {formatINR(schedulePreview.finalPaymentAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <Link
            href="/finances"
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !schedulePreview}
            className="px-6 py-2.5 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Finance Record...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Finance & Schedule</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewFinancePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/finances" className="inline-flex items-center space-x-1 text-sm font-semibold text-sky-600 hover:text-sky-700">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Finances List</span>
      </Link>

      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
        <NewFinanceForm />
      </Suspense>
    </div>
  );
}
