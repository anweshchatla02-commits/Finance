'use client';

import { Printer, X, Download } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { formatDateTimeReadable } from '@/lib/date';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    id: string;
    customerName: string;
    customerPhone: string;
    financeId: string;
    amount: number;
    paymentDate: string | Date;
    paymentMethod: string;
    notes?: string | null;
    totalCollected: number;
    remainingAmount: number;
  } | null;
}

export default function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptModalProps) {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between no-print">
          <h3 className="font-bold text-base">Payment Receipt</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Card Body */}
        <div id="printable-receipt" className="p-6 bg-white space-y-5 text-slate-900">
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">PRIVATE FINANCE MANAGER</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Daily Collection Payment Receipt</p>
            <p className="text-[11px] text-slate-400 mt-1">Receipt ID: {receiptData.id}</p>
          </div>

          {/* Amount Highlight */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Amount Received</p>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">{formatINR(receiptData.amount)}</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Payment Mode: {receiptData.paymentMethod}</p>
          </div>

          {/* Customer & Finance Details */}
          <div className="space-y-2 text-sm border-b border-slate-200 pb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{receiptData.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-semibold text-slate-800">{receiptData.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Finance Record ID:</span>
              <span className="font-mono text-xs font-semibold text-slate-700">{receiptData.financeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-medium text-slate-800">{formatDateTimeReadable(receiptData.paymentDate)}</span>
            </div>
            {receiptData.notes && (
              <div className="flex justify-between">
                <span className="text-slate-500">Notes:</span>
                <span className="font-medium text-slate-800 italic">{receiptData.notes}</span>
              </div>
            )}
          </div>

          {/* Balance Summary */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Collected So Far:</span>
              <span className="font-bold text-slate-900">{formatINR(receiptData.totalCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Remaining Balance:</span>
              <span className="font-bold text-sky-700">{formatINR(receiptData.remainingAmount)}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[11px] text-slate-400 italic">
            Thank you! Keep this receipt for your records.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
