'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Phone, MapPin, Edit3, Archive, Eye, RefreshCw } from 'lucide-react';
import CustomerModal from '@/components/customer-modal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);

  // Customer Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?query=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, statusFilter]);

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive customer ${name}?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to archive customer');
      }
    } catch (err: any) {
      alert(err.message || 'Archive error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500">Manage borrowers, contact info, and loan histories</p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
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

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded ${statusFilter === 'ACTIVE' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`px-3 py-1 rounded ${statusFilter === 'ARCHIVED' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
              Archived
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded ${statusFilter === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            >
              All
            </button>
          </div>

          <button
            onClick={fetchCustomers}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Customer List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400">
            No customers found matching your search query.
          </div>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{customer.fullName}</h3>
                    <div className="flex items-center space-x-1 text-slate-500 text-xs mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {customer.status}
                  </span>
                </div>

                <div className="mt-3 flex items-start space-x-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{customer.address}</span>
                </div>

                {customer.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic line-clamp-1">Note: {customer.notes}</p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {customer.finances?.length || 0} loan records
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingCustomer(customer);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Edit Customer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleArchive(customer.id, customer.fullName)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Archive Customer"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/customers/${customer.id}`}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Create/Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        customer={editingCustomer}
      />
    </div>
  );
}
