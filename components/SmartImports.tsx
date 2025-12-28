import React, { useState, useRef } from 'react';
import { Transaction, CategoryEnum, TransactionType } from '../types';
import { analyzeBankStatement, analyzePaystub } from '../services/geminiService';
import { Loader2, Search, Upload, FileText, Check, X, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SmartImportsProps {
  onAddTransactions: (transactions: Transaction[]) => void;
}

export const SmartImports: React.FC<SmartImportsProps> = ({ onAddTransactions }) => {
  const [importType, setImportType] = useState<'statement' | 'paystub' | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [parsedItems, setParsedItems] = useState<Partial<Transaction>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importType) return;

    setIsAnalyzingFile(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        if (importType === 'statement') {
          const results = await analyzeBankStatement(base64Data, file.type);
          const mapped = results.map((r: any) => ({
            ...r,
            id: uuidv4(),
            include: true 
          }));
          setParsedItems(mapped);
        } else if (importType === 'paystub') {
          const result = await analyzePaystub(base64Data, file.type);
          if (result.amount) {
            setParsedItems([{
              id: uuidv4(),
              date: result.date || new Date().toISOString().split('T')[0],
              merchant: result.payer || 'Employer',
              amount: result.amount,
              type: 'income',
              category: CategoryEnum.Income,
              include: true
            }]);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleInclude = (index: number) => {
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], include: !updated[index].include };
    setParsedItems(updated);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  const confirmImport = () => {
    const toImport = parsedItems
      .filter(item => item.include)
      .map(item => ({
        id: item.id || uuidv4(),
        date: item.date || new Date().toISOString(),
        merchant: item.merchant || 'Unknown',
        amount: Number(item.amount) || 0,
        type: (item.type || 'spending') as TransactionType,
        category: item.category || 'Other'
      }));
    
    if (toImport.length > 0) {
      onAddTransactions(toImport);
    }
    setImportType(null);
    setParsedItems([]);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-white/20 flex flex-col gap-4">
         <div className="flex items-center gap-2 mb-2">
          <FileText className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Smart Imports</h3>
         </div>
         
         <button 
           onClick={() => setImportType('statement')}
           className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 group"
         >
           <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
               <Upload size={20} />
             </div>
             <div className="text-left">
               <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700">Import Banking Statements</p>
               <p className="text-xs text-gray-500">Bank statements</p>
             </div>
           </div>
           <Search size={16} className="text-blue-400" />
         </button>

         <button 
           onClick={() => setImportType('paystub')}
           className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all border border-green-100 group"
         >
           <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-lg text-green-600 shadow-sm">
               <DollarSign size={20} />
             </div>
             <div className="text-left">
               <p className="font-semibold text-gray-900 text-sm group-hover:text-green-700">Import Past Earnings</p>
               <p className="text-xs text-gray-500">Paystubs</p>
             </div>
           </div>
           <Search size={16} className="text-green-400" />
         </button>
      </div>

      {/* Import Modal */}
      {importType && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
              <h3 className="text-xl font-bold">
                {importType === 'statement' ? 'Import Transactions' : 'Import Earnings'}
              </h3>
              <button onClick={() => { setImportType(null); setParsedItems([]); }} className="p-1 hover:bg-blue-700 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {parsedItems.length === 0 ? (
                <div className="text-center py-12">
                   {isAnalyzingFile ? (
                     <div className="flex flex-col items-center">
                       <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                       <p className="text-lg font-medium text-gray-700">Gemini is analyzing your document...</p>
                       <p className="text-sm text-gray-500">Sorting and categorizing data...</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                         <Upload size={32} />
                       </div>
                       <h4 className="text-lg font-medium text-gray-900">Upload {importType === 'statement' ? 'Statement' : 'Paystub'}</h4>
                       <p className="text-gray-500 max-w-sm mx-auto">Upload a file (PDF) or image. Gemini will automatically extract, categorize, and remove duplicates.</p>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-transform hover:scale-105"
                       >
                         Select File
                       </button>
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/*,application/pdf"
                         onChange={handleFileSelect}
                       />
                     </div>
                   )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Review the extracted data. Gemini has auto-detected categories and flagged potential fixed bills.</p>
                  <div className="space-y-2">
                    {parsedItems.map((item, idx) => (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.include ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                        <button 
                          onClick={() => toggleInclude(idx)}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${item.include ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                          {item.include && <Check size={14} />}
                        </button>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                           <input 
                             value={item.date} 
                             onChange={(e) => updateItem(idx, 'date', e.target.value)}
                             className="text-sm border-gray-200 rounded px-2 py-1"
                           />
                           <input 
                             value={item.merchant} 
                             onChange={(e) => updateItem(idx, 'merchant', e.target.value)}
                             className="text-sm font-medium border-gray-200 rounded px-2 py-1 md:col-span-2"
                           />
                           <input 
                             type="number"
                             value={item.amount} 
                             onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                             className="text-sm font-bold text-right border-gray-200 rounded px-2 py-1"
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {parsedItems.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button 
                  onClick={() => { setParsedItems([]); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Start Over
                </button>
                <button 
                  onClick={confirmImport}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium"
                >
                  Import {parsedItems.filter(i => i.include).length} Records
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};