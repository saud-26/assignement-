'use client';

import { useState, useEffect } from 'react';
import { postTransaction, getRanking } from '@/lib/api';
import { showToast } from './Toast';

export default function TransactionForm() {
  const [users, setUsers] = useState<{ user_id: string; name: string }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getRanking();
        if (data.ranking && data.ranking.length > 0) {
          setUsers(data.ranking);
          setUserId(data.ranking[0].user_id);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setIsSubmitting(true);
    
    // Generate idempotency_key: `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const idempotencyKey = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const data = await postTransaction({
        user_id: userId,
        amount: Number(amount),
        type,
        description,
        idempotency_key: idempotencyKey,
      });

      if (data.duplicate) {
        showToast('Duplicate request — already processed', 'warning');
      } else {
        showToast(`Transaction successful! New balance: ₹${data.new_balance}`, 'success');
        setAmount('');
        setDescription('');
      }
    } catch (error: any) {
      if (error.message.includes('Insufficient balance')) {
        showToast('Insufficient balance', 'error');
      } else if (error.message.includes('already being processed')) {
        showToast('Duplicate request — already processed', 'warning');
      } else {
        showToast(error.message || 'Transaction failed', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 max-w-md mx-auto w-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">New Transaction</h2>
        <p className="text-gray-500 text-sm mt-1">Process a secure payment</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select User</label>
          <div className="relative">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={isLoadingUsers}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
              required
            >
              {isLoadingUsers ? (
                <option value="">Loading users...</option>
              ) : users.length === 0 ? (
                <option value="">No users found</option>
              ) : (
                users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name}
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="text-gray-500">₹</span>
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-xl border flex items-center justify-center py-3 font-medium transition-all ${
              type === 'credit' 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="type"
                value="credit"
                checked={type === 'credit'}
                onChange={() => setType('credit')}
                className="sr-only"
              />
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Credit
            </label>
            <label className={`cursor-pointer rounded-xl border flex items-center justify-center py-3 font-medium transition-all ${
              type === 'debit' 
                ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="type"
                value="debit"
                checked={type === 'debit'}
                onChange={() => setType('debit')}
                className="sr-only"
              />
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              Debit
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="What is this for?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !userId || !amount}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Submit Transaction'
          )}
        </button>
      </form>
    </div>
  );
}
