'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, Save, Loader2 } from 'lucide-react';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  finance?: {
    id: string;
    amountGiven: number | string;
    totalAmountToCollect: number | string;
    dailyCollectionAmount: number | string;
    status: string;
    notes?: string | null;
  } | null;
}

export default function FinanceModal({ isOpen, onClose, onSuccess, finance }: FinanceModalProps) {
  const [amountGiven, setAmountGiven] = useState('');
  const [totalAmountToCollect, setTotalAmountToCollect] = useState('');
  const [dailyCollectionAmount, setDailyCollectionAmount] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (finance) {
      setAmountGiven(finance.amountGiven ? finance.amountGiven.toString() : '');
      setTotalAmountToCollect(finance.totalAmountToCollect ? finance.totalAmountToCollect.toString() : '');
      setDailyCollectionAmount(finance.dailyCollectionAmount ? finance.dailyCollectionAmount.toString() : '');
      setStatus(finance.status || 'ACTIVE');
      setNotes(finance.notes || '');
    }
    setError(null);
  }, [finance, isOpen]);

  if (!isOpen || !finance) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/finances/${finance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountGiven,
          totalAmountToCollect,
          dailyCollectionAmount,
          status,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update finance loan record');
        setLoading(false);
        return;
      }

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
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-lg">Edit Finance Loan #{finance.id}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Amount Given (₹) *
            </label>
            <input
              type="number"
              step="any"
              value={amountGiven}
              onChange={(e) => setAmountGiven(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 font-bold"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Daily Collection Rate (₹) *
            </label>
            <input
              type="number"
              step="any"
              value={dailyCollectionAmount}
              onChange={(e) => setDailyCollectionAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Loan Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DEFAULTED">DEFAULTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Loan terms / notes"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
            />
          </div>

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
              className="px-5 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Finance Loan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
