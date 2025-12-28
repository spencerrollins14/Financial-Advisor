import React from 'react';
import { Transaction } from '../types';
import { Download, FileSpreadsheet, Archive } from 'lucide-react';

interface ExportDataProps {
  transactions: Transaction[];
  selectedMonth: Date;
}

export const ExportData: React.FC<ExportDataProps> = ({ transactions, selectedMonth }) => {
  const convertToCSV = (data: Transaction[]) => {
    // Define headers
    const headers = ['Date', 'Merchant', 'Amount', 'Type', 'Category', 'ID'];
    
    // Map data to rows
    const rows = data.map(t => {
      const date = new Date(t.date).toLocaleDateString();
      const merchant = `"${t.merchant.replace(/"/g, '""')}"`; // Escape quotes
      const amount = t.amount.toFixed(2);
      return [date, merchant, amount, t.type, t.category, t.id];
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  };

  const triggerDownload = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportCurrentMonth = () => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth.getMonth() && 
             d.getFullYear() === selectedMonth.getFullYear();
    });
    
    if (monthTx.length === 0) {
      alert("No transactions to export for this month.");
      return;
    }

    const csv = convertToCSV(monthTx);
    const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const filename = `Financial_Advisor_${monthName.replace(/ /g, '_')}.csv`;
    triggerDownload(csv, filename);
  };

  const exportYearToDate = () => {
    const yearTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedMonth.getFullYear();
    });

    if (yearTx.length === 0) {
      alert("No transactions found for this year.");
      return;
    }

    const csv = convertToCSV(yearTx);
    const filename = `Financial_Advisor_${selectedMonth.getFullYear()}_YTD.csv`;
    triggerDownload(csv, filename);
  };

  const exportAll = () => {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }
    const csv = convertToCSV(transactions);
    const filename = `Financial_Advisor_All_History.csv`;
    triggerDownload(csv, filename);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
          <Download size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Export Data</h3>
          <p className="text-xs text-gray-500">Download your financial records</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <button 
          onClick={exportCurrentMonth}
          className="flex items-center justify-between w-full p-3 bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <FileSpreadsheet size={18} />
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Current Month
              </span>
              <span className="block text-[10px] text-gray-400">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <Download size={16} className="text-gray-300 group-hover:text-blue-500" />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={exportYearToDate}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
          >
            {selectedMonth.getFullYear()} YTD
          </button>
          <button 
            onClick={exportAll}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Archive size={14} />
            All History
          </button>
        </div>
      </div>
    </div>
  );
};