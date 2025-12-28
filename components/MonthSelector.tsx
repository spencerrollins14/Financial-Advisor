import React from 'react';
import { Calendar } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => {
  const getMonthOptions = () => {
    const options = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i);
      const value = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = e.target.value.split('-');
    const newDate = new Date(parseInt(year), parseInt(month));
    onMonthChange(newDate);
  };

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-xl border border-white/20">
      <div className="flex items-center gap-2">
         <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
           <Calendar size={20} />
         </div>
         <span className="font-semibold text-gray-700">Financial Overview</span>
      </div>
      <select 
        value={`${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`}
        onChange={handleChange}
        className="bg-blue-50 border-none text-blue-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none cursor-pointer hover:bg-blue-100 transition-colors"
      >
        {getMonthOptions().map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};