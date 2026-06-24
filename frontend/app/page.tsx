'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import UserSummary from '@/components/UserSummary';
import RankingTable from '@/components/RankingTable';
import ToastContainer from '@/components/Toast';

type Tab = 'submit' | 'summary' | 'leaderboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('submit');

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-900 pb-20">
      <ToastContainer />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 md:py-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                Transaction & Ranking System
              </h1>
              <p className="text-gray-500 mt-1.5 font-medium">Full-stack financial ledger with real-time scoring</p>
            </div>
            
            {/* Tabs */}
            <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl">
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'submit'
                    ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgb(0,0,0,0.05)]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                Submit Transaction
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'summary'
                    ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgb(0,0,0,0.05)]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                User Summary
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgb(0,0,0,0.05)]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className={`transition-opacity duration-300 ${activeTab === 'submit' ? 'block' : 'hidden'}`}>
          <TransactionForm />
        </div>
        
        <div className={`transition-opacity duration-300 ${activeTab === 'summary' ? 'block' : 'hidden'}`}>
          <UserSummary />
        </div>
        
        <div className={`transition-opacity duration-300 ${activeTab === 'leaderboard' ? 'block' : 'hidden'}`}>
          <RankingTable />
        </div>
      </div>
    </main>
  );
}
