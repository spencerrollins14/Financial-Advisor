import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt, Calendar, AlertTriangle, Edit2, Check, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDeleteTransaction, onUpdateTransaction }) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filter === 'income') return t.type === 'income';
      if (filter === 'expense') return t.type !== 'income';
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [filtered]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    } catch (e) {
      return isoString;
    }
  };

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.merchant && editForm.amount) {
      onUpdateTransaction(editForm as Transaction);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteTransaction(deletingId);
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-white/20 flex flex-col h-[600px] relative">
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6 transition-all">
          <div className="bg-white shadow-2xl border border-red-100 rounded-xl p-6 w-full max-w-xs text-center transform scale-100">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Are you sure you want to remove this record?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Monthly Activity</h2>
        <div className="flex bg-blue-50 rounded-lg p-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
          >
            All
          </button>
          <button 
             onClick={() => setFilter('income')}
             className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'income' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
          >
            Income
          </button>
          <button 
             onClick={() => setFilter('expense')}
             className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'expense' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
          >
            Expense
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-blue-300">
            <Receipt size={48} className="mb-2 opacity-30" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="group p-3 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
              {editingId === t.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      value={editForm.merchant}
                      onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                      className="flex-1 text-sm border border-blue-200 rounded px-2 py-1"
                      placeholder="Merchant"
                    />
                    <input 
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                      className="w-20 text-sm border border-blue-200 rounded px-2 py-1 text-right"
                      placeholder="Amount"
                    />
                  </div>
                  <div className="flex gap-2 justify-between items-center">
                    <input 
                      type="date"
                      value={editForm.date ? editForm.date.split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, date: new Date(e.target.value).toISOString() })}
                      className="text-xs border border-blue-200 rounded px-2 py-1 text-gray-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCancelEdit} className="p-1 text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                      <button onClick={handleSaveEdit} className="p-1 text-blue-600 hover:text-blue-700">
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.merchant}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{t.category}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{t.type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(t)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(t.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className={`p-4 border-t border-gray-100 rounded-b-2xl flex justify-between items-center ${totalAmount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <span className="font-semibold text-gray-700">Total</span>
        <span className={`text-xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totalAmount >= 0 ? '+' : ''}${totalAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};