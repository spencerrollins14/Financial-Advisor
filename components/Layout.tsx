import React from 'react';
import { Wallet } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen font-sans bg-blue-600">
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Financial Advisor</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900 bg-blue-100 px-3 py-1 rounded-full shadow-sm">
                Gemini Powered
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};