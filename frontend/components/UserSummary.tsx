'use client';

import { useState, useEffect } from 'react';
import { getUserSummary, getRanking } from '@/lib/api';

export default function UserSummary() {
  const [users, setUsers] = useState<{ user_id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getRanking();
        if (data.ranking && data.ranking.length > 0) {
          setUsers(data.ranking);
          setSelectedUser(data.ranking[0].user_id);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    
    async function fetchSummary() {
      setIsLoading(true);
      try {
        const data = await getUserSummary(selectedUser);
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSummary();
  }, [selectedUser]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">User Dashboard</h2>
          <p className="text-gray-500 text-sm">Select a user to view their summary</p>
        </div>
        <div className="w-64 relative">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={isLoadingUsers}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all font-medium"
          >
            {isLoadingUsers ? (
              <option value="">Loading...</option>
            ) : users.length === 0 ? (
              <option value="">No users</option>
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

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-28">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-64">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      ) : summary ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all">
              <div className="text-gray-500 text-sm font-medium mb-1">Total Balance</div>
              <div className="text-3xl font-bold text-gray-800">
                ₹{summary.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all">
              <div className="text-gray-500 text-sm font-medium mb-1">Transactions</div>
              <div className="text-3xl font-bold text-gray-800">
                {summary.transaction_count}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60"></div>
              <div className="text-emerald-600 text-sm font-medium mb-1 relative z-10">Total Credited</div>
              <div className="text-3xl font-bold text-emerald-700 relative z-10">
                ₹{summary.total_credited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl opacity-60"></div>
              <div className="text-red-600 text-sm font-medium mb-1 relative z-10">Total Debited</div>
              <div className="text-3xl font-bold text-red-700 relative z-10">
                ₹{summary.total_debited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.recent_transactions.length > 0 ? (
                    summary.recent_transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-800'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tx.description || <span className="text-gray-400 italic">No description</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No transactions yet</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
