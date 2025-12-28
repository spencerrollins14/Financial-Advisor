import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, CATEGORIES } from '../types';
import { 
  TrendingUp, DollarSign, Zap, Home, ChevronDown, ChevronUp, Edit2, Trash2
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  selectedMonth: Date;
  onAddTransactions: (transactions: Transaction[]) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1', '#ef4444', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  selectedMonth,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  // --- Tile Expansion States ---
  const [expandedTile, setExpandedTile] = useState<'income' | 'fixed' | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  // --- Filter Transactions by Selected Month ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    });
  }, [transactions, selectedMonth]);

  // --- Statistics ---
  const stats = useMemo(() => {
    let income = 0;
    let fixed = 0;
    let flexible = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'fixed_bill') fixed += t.amount;
      else if (t.type === 'flexible_bill' || t.type === 'spending') flexible += t.amount;
    });

    return {
      income,
      expenses: fixed + flexible,
      balance: income - (fixed + flexible),
      fixed,
      flexible
    };
  }, [filteredTransactions]);

  // --- Money Spent List (Entire Month, No Income) ---
  const moneySpentList = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type !== 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  const moneySpentTotal = useMemo(() => {
    return moneySpentList.reduce((acc, curr) => acc + curr.amount, 0);
  }, [moneySpentList]);

  // --- Category Data ---
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type !== 'income');
    const groups: Record<string, number> = {};
    expenses.forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + t.amount;
    });
    return Object.keys(groups).map(key => ({
      name: key,
      value: groups[key]
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return categoryData.reduce((acc, cur) => acc + cur.value, 0);
  }, [categoryData]);

  // --- Helpers ---
  const toggleTile = (tile: 'income' | 'fixed') => {
    if (expandedTile === tile) setExpandedTile(null);
    else setExpandedTile(tile);
    setEditingTxId(null); // Reset edit mode when toggling
  };

  const startEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditForm({ ...tx });
  };

  const saveEdit = () => {
    if (editingTxId && editForm.amount && editForm.merchant) {
      onUpdateTransaction(editForm as Transaction);
      setEditingTxId(null);
      setEditForm({});
    }
  };

  const LogoPlaceholder = ({ name }: { name: string }) => {
    const [error, setError] = useState(false);
    
    // Simplistic attempt to get a logo domain
    const logoUrl = `https://logo.clearbit.com/${name.toLowerCase().replace(/\s/g, '')}.com`;

    if (error) {
       return (
         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 border border-red-100 shadow-sm">
            <DollarSign size={18} />
         </div>
       );
    }

    return (
      <img 
        src={logoUrl} 
        alt={name}
        onError={() => setError(true)}
        className="w-10 h-10 rounded-full object-contain bg-white border border-gray-100 shadow-sm" 
      />
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
             <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Balance</p>
            <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              ${stats.balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Income Tile */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20 relative group">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-gray-900">${stats.income.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => toggleTile('income')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors">
              {expandedTile === 'income' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          {expandedTile === 'income' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-blue-100 p-4 z-20 max-h-60 overflow-y-auto w-full md:w-[150%]">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Income for {selectedMonth.toLocaleDateString('en-US', {month: 'long'})}</h4>
              <div className="space-y-2">
                {filteredTransactions.filter(t => t.type === 'income').map(t => (
                  <div key={t.id} className="p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100">
                    {editingTxId === t.id ? (
                      <div className="space-y-2 bg-blue-50 p-2 rounded-lg">
                        <div>
                           <label className="text-xs text-gray-500 font-medium ml-1">Source</label>
                           <input 
                              value={editForm.merchant} 
                              onChange={e => setEditForm({...editForm, merchant: e.target.value})}
                              className="w-full text-sm border border-blue-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                               <label className="text-xs text-gray-500 font-medium ml-1">Amount</label>
                               <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-gray-400 text-xs">$</span>
                                  <input 
                                      type="number" 
                                      value={editForm.amount} 
                                      onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                                      className="w-full text-sm border border-blue-200 rounded p-1.5 pl-5 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs text-gray-500 font-medium ml-1">Date</label>
                               <input 
                                  type="date"
                                  value={editForm.date ? editForm.date.split('T')[0] : ''}
                                  onChange={e => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                                  className="w-full text-sm border border-blue-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                               />
                           </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                           <button onClick={() => setEditingTxId(null)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded">Cancel</button>
                           <button onClick={saveEdit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm">
                         <span className="font-medium text-gray-800">{t.merchant}</span>
                         <div className="flex items-center gap-3">
                           <span className="text-green-600 font-bold">+${t.amount.toFixed(2)}</span>
                           <div className="flex gap-1">
                             <button onClick={() => startEdit(t)} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                             <button onClick={() => onDeleteTransaction(t.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                           </div>
                         </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredTransactions.filter(t => t.type === 'income').length === 0 && (
                   <p className="text-sm text-gray-400 text-center py-2">No income recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bills Tile */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20 relative group">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <Home size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fixed Bills</p>
                <p className="text-2xl font-bold text-gray-900">${stats.fixed.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => toggleTile('fixed')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-purple-600 transition-colors">
              {expandedTile === 'fixed' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          {expandedTile === 'fixed' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-purple-100 p-4 z-20 max-h-80 overflow-y-auto w-full md:w-[150%]">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Fixed Bills for {selectedMonth.toLocaleDateString('en-US', {month: 'long'})}</h4>
              <div className="space-y-2">
                {filteredTransactions.filter(t => t.type === 'fixed_bill').map(t => (
                  <div key={t.id} className="p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100">
                    {editingTxId === t.id ? (
                      <div className="space-y-2 bg-purple-50 p-2 rounded-lg border border-purple-100">
                        <div>
                           <label className="text-xs text-gray-500 font-medium ml-1">Merchant</label>
                           <input 
                              value={editForm.merchant} 
                              onChange={e => setEditForm({...editForm, merchant: e.target.value})}
                              className="w-full text-sm border border-purple-200 rounded p-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
                              placeholder="Merchant"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                               <label className="text-xs text-gray-500 font-medium ml-1">Amount</label>
                               <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-gray-400 text-xs">$</span>
                                  <input 
                                      type="number" 
                                      value={editForm.amount} 
                                      onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                                      className="w-full text-sm border border-purple-200 rounded p-1.5 pl-5 focus:ring-2 focus:ring-purple-500 outline-none"
                                      placeholder="Amount"
                                  />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs text-gray-500 font-medium ml-1">Due Date</label>
                               <input 
                                  type="date"
                                  value={editForm.date ? editForm.date.split('T')[0] : ''}
                                  onChange={e => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                                  className="w-full text-sm border border-purple-200 rounded p-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
                               />
                           </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                           <button onClick={() => setEditingTxId(null)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded">Cancel</button>
                           <button onClick={saveEdit} className="px-2 py-1 text-xs bg-purple-600 text-white rounded shadow-sm hover:bg-purple-700">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="font-medium text-gray-800 text-sm">{t.merchant}</p>
                            <p className="text-xs text-gray-500">{t.category} - {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="font-bold text-gray-900 text-sm">${t.amount.toFixed(2)}</span>
                           <div className="flex gap-1">
                             <button onClick={() => startEdit(t)} className="p-1 text-gray-400 hover:text-purple-500"><Edit2 size={14} /></button>
                             <button onClick={() => onDeleteTransaction(t.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                           </div>
                         </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredTransactions.filter(t => t.type === 'fixed_bill').length === 0 && (
                   <p className="text-sm text-gray-400 text-center py-2">No fixed bills.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Spent Tile (Flexible) */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-pink-100 rounded-full text-pink-600">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Spent</p>
                <p className="text-2xl font-bold text-gray-900">${stats.flexible.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections - Stacked for better width and visibility */}
      
      {/* Spending Habits by Category - Streamlined List View */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
           <div>
             <h3 className="text-xl font-bold text-gray-800">Spending Habits by Category</h3>
             <p className="text-sm text-gray-500 mt-1">Breakdown of your spending for this month</p>
           </div>
           <div className="text-right">
             <p className="text-sm text-gray-500">Total Expenses</p>
             <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
           </div>
        </div>

        {categoryData.length > 0 ? (
          <div className="space-y-5">
            {categoryData.map((item, index) => {
              const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
              return (
                <div key={item.name} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">${item.value.toFixed(2)}</span>
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-14 text-center">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: COLORS[index % COLORS.length] 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <TrendingUp size={32} className="mb-2 opacity-50" />
             <p>No spending data available for this month.</p>
           </div>
        )}
      </div>

      {/* Money Spent (List View) */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20 flex flex-col">
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Money Spent</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-xl font-bold text-gray-900">${moneySpentTotal.toFixed(2)}</p>
          </div>
        </div>
         
         <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2">
           {moneySpentList.length > 0 ? (
             moneySpentList.map((t) => (
               <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                     <LogoPlaceholder name={t.merchant} />
                     <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.merchant}</p>
                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-gray-900">-${t.amount.toFixed(2)}</p>
                     <span className="text-[10px] text-gray-400 uppercase">{t.category}</span>
                  </div>
               </div>
             ))
           ) : (
             <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
               No spending recorded for this month.
             </div>
           )}
         </div>
      </div>
    </div>
  );
};