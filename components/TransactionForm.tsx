import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, CategoryEnum, CATEGORIES } from '../types';
import { classifyTransaction, parseReceipt } from '../services/geminiService';
import { Plus, Loader2, Sparkles, Camera } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TransactionFormProps {
  onAddTransaction: (transaction: Transaction) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('spending');
  const [category, setCategory] = useState<string>(CategoryEnum.Other);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically set category to Income if type is Income
  useEffect(() => {
    if (type === 'income') {
      setCategory(CategoryEnum.Income);
    }
  }, [type]);

  const handleMerchantBlur = async () => {
    if (merchant.trim().length > 2 && !isClassifying && !isAnalyzingReceipt) {
      setIsClassifying(true);
      const suggestedCategory = await classifyTransaction(merchant);
      setCategory(suggestedCategory);
      
      if (suggestedCategory === CategoryEnum.Income) {
        setType('income');
      } else if (suggestedCategory === CategoryEnum.Housing || suggestedCategory === CategoryEnum.Utilities) {
        setType('fixed_bill');
      } else if (
        suggestedCategory === CategoryEnum.Food || 
        suggestedCategory === CategoryEnum.Shopping || 
        suggestedCategory === CategoryEnum.Entertainment ||
        suggestedCategory === CategoryEnum.PersonalCare
      ) {
        setType('spending');
      } else {
        setType('flexible_bill');
      }
      
      setIsClassifying(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingReceipt(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        const result = await parseReceipt(base64Data, mimeType);
        if (result) {
          if (result.merchant) {
            setMerchant(result.merchant);
            const cat = await classifyTransaction(result.merchant);
            setCategory(cat);
          }
          if (result.amount) setAmount(result.amount.toString());
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Receipt error", error);
    } finally {
      setIsAnalyzingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    const newTransaction: Transaction = {
      id: uuidv4(),
      date: new Date().toISOString(),
      merchant,
      amount: parseFloat(amount),
      type,
      category,
    };

    onAddTransaction(newTransaction);
    
    setMerchant('');
    setAmount('');
    setType('spending');
    setCategory(CategoryEnum.Other);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Add Transaction</h2>
        {isClassifying && !isAnalyzingReceipt && (
          <span className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
            <Sparkles size={12} className="mr-1" /> AI Categorizing...
          </span>
        )}
        {isAnalyzingReceipt && (
          <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full animate-pulse">
            <Camera size={12} className="mr-1" /> Analyzing Receipt...
          </span>
        )}
      </div>

      <div className="mb-4">
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg text-blue-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
        >
          <Camera size={20} />
          <span className="text-sm font-medium">Scan Receipt</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Source</label>
          <div className="relative">
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              onBlur={handleMerchantBlur}
              className="w-full px-4 py-2 bg-blue-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-blue-300 text-gray-900 transition-all"
              placeholder="e.g. Starbucks, Netflix, Salary"
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
               {(isClassifying || isAnalyzingReceipt) ? <Loader2 size={18} className="animate-spin text-blue-500" /> : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-blue-400">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-blue-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-blue-300 text-gray-900 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
             <select
               value={type}
               onChange={(e) => setType(e.target.value as TransactionType)}
               className="w-full px-4 py-2 bg-blue-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
             >
               <option value="spending">Spending</option>
               <option value="flexible_bill">Flexible Bill</option>
               <option value="fixed_bill">Fixed Bill</option>
               <option value="income">Income</option>
             </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={type === 'income'} // Disable manual category if income
            className={`w-full px-4 py-2 bg-blue-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 ${type === 'income' ? 'opacity-70' : ''}`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isAnalyzingReceipt}
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
        >
          <Plus size={18} className="mr-2" />
          Add Transaction
        </button>
      </form>
    </div>
  );
};