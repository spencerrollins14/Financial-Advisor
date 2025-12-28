import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { SmartImports } from './components/SmartImports';
import { MonthSelector } from './components/MonthSelector';
import { ExportData } from './components/ExportData';
import { Transaction } from './types';
import { loadTransactions, saveTransactions } from './services/storageService';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loaded = loadTransactions();
    setTransactions(loaded);
    setIsLoading(false);
  }, []);

  // Save data on change
  useEffect(() => {
    if (!isLoading) {
      saveTransactions(transactions);
    }
  }, [transactions, isLoading]);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, []);

  const addTransactions = useCallback((newTransactions: Transaction[]) => {
    setTransactions(prev => {
      // 1. Filter out redundancies (duplicates) based on strict matching
      const uniqueNew = newTransactions.filter(newTx => {
        const isDuplicate = prev.some(existingTx => 
          existingTx.date.split('T')[0] === newTx.date.split('T')[0] &&
          Math.abs(existingTx.amount - newTx.amount) < 0.01 && // float comparison
          existingTx.merchant.toLowerCase().trim() === newTx.merchant.toLowerCase().trim()
        );
        return !isDuplicate;
      });

      // 2. Identify "Fixed Bills" by comparing with previous history
      const processedNew = uniqueNew.map(tx => {
        if (tx.type === 'income') return tx;

        // Clean merchant name for better matching (remove "Zelle to", "Transfer to", etc.)
        const cleanName = (name: string) => 
          name.toLowerCase()
              .replace('zelle to ', '')
              .replace('zelle transfer to ', '')
              .replace('transfer to ', '')
              .trim();

        const currentName = cleanName(tx.merchant);

        const isRecurring = prev.some(existingTx => {
          if (existingTx.type === 'income') return false;
          
          const prevName = cleanName(existingTx.merchant);
          const nameMatch = prevName === currentName || prevName.includes(currentName) || currentName.includes(prevName);
          const amountMatch = Math.abs(existingTx.amount - tx.amount) < 10.00; // Allow slight variance for utilities
          const differentMonth = new Date(existingTx.date).getMonth() !== new Date(tx.date).getMonth();

          return nameMatch && amountMatch && differentMonth;
        });

        if (isRecurring) {
          return { ...tx, type: 'fixed_bill' as const };
        }
        
        // If Gemini already marked it as fixed_bill based on the memo (e.g. Rent), keep it.
        if (tx.type === 'fixed_bill') return tx;

        return tx;
      });
      
      return [...processedNew, ...prev];
    });
  }, []);

  const updateTransaction = useCallback((updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <Layout>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Financial Overview, Smart Imports, Form and History */}
        <div className="xl:col-span-1 space-y-6">
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          <SmartImports onAddTransactions={addTransactions} />
          <TransactionForm onAddTransaction={addTransaction} />
          <TransactionList 
            transactions={transactions} 
            onDeleteTransaction={deleteTransaction} 
            onUpdateTransaction={updateTransaction}
          />
        </div>

        {/* Right Column: Dashboard and Visualization */}
        <div className="xl:col-span-2 space-y-6">
          <Dashboard 
            transactions={transactions} 
            selectedMonth={selectedMonth}
            onAddTransactions={addTransactions}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
          />
          <ExportData transactions={transactions} selectedMonth={selectedMonth} />
        </div>
      </div>
    </Layout>
  );
};

export default App;