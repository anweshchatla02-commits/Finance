'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { getTodayISTString } from '@/lib/date';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collectionItem: {
    financeId: string;
    customerId: string;
    customerName: string;
    expectedAmount: number;
    remainingOnLoan: number;
    dailyAmount: number;
  } | null;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, collectionItem }: PaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayISTString());
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overpaymentWarning, setOverpaymentWarning] = useState<boolean>(false);

  if (!isOpen || !collectionItem) return null;

  const defaultSuggestedAmount = amount || String(collectionItem.expectedAmount || collectionItem.dailyAmount);

  const handleSubmit = async (e: React.FormEvent, forceOverpayment = false) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const numAmount = parseFloat(amount || defaultSuggestedAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than ₹0');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financeId: collectionItem.financeId,
          customerId: collectionItem.customerId,
          amount: numAmount,
          paymentDate,
          paymentMethod,
          notes,
          allowOverpayment: forceOverpayment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresConfirmation) {
          setOverpaymentWarning(true);
          setError(data.error);
        } else {
          setError(data.error || 'Failed to record payment');
        }
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Record Payment</h3>
            <p className="text-xs text-slate-300">{collectionItem.customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={(e) => handleSubmit(e, overpaymentWarning)} className="p-5 space-y-4">
          {error && (
            <div className={`p-3 rounded-lg text-sm flex items-start space-x-2 ${
              overpaymentWarning ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                {overpaymentWarning && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="mt-2 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 transition-colors"
                  >
                    Confirm Overpayment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Daily Expected:</span>
              <span className="font-semibold text-slate-900">{formatINR(collectionItem.expectedAmount || collectionItem.dailyAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining Loan Balance:</span>
              <span className="font-semibold text-sky-700">{formatINR(collectionItem.remainingOnLoan)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setOverpaymentWarning(false);
                  setError(null);
                }}
                placeholder={String(collectionItem.expectedAmount || collectionItem.dailyAmount)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>
            {/* Quick Fill Preset Buttons */}
            <div className="flex space-x-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(String(collectionItem.expectedAmount || collectionItem.dailyAmount))}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded border border-slate-200"
              >
                Exact: {formatINR(collectionItem.expectedAmount || collectionItem.dailyAmount)}
              </button>
              {collectionItem.remainingOnLoan < (collectionItem.expectedAmount || collectionItem.dailyAmount) && (
                <button
                  type="button"
                  onClick={() => setAmount(String(collectionItem.remainingOnLoan))}
                  className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium px-2.5 py-1 rounded border border-sky-200"
                >
                  Full Clear: {formatINR(collectionItem.remainingOnLoan)}
                </button>
              )}
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning cash payment"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
