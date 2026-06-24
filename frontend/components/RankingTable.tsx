'use client';

import { useState, useEffect } from 'react';
import { getRanking } from '@/lib/api';

export default function RankingTable() {
  const [rankingData, setRankingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchRanking = async () => {
    try {
      const data = await getRanking();
      setRankingData(data);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and 30s interval
  useEffect(() => {
    fetchRanking();
    const interval = setInterval(fetchRanking, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update "seconds ago" counter every second
  useEffect(() => {
    const counter = setInterval(() => {
      setSecondsAgo(Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(counter);
  }, [lastUpdated]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500 font-bold bg-yellow-50/50';
      case 2:
        return 'text-gray-400 font-bold bg-gray-50/50';
      case 3:
        return 'text-amber-600 font-bold bg-amber-50/50';
      default:
        return 'text-gray-600';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return <span className="text-gray-400">#{rank}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full max-w-6xl mx-auto">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Global Leaderboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Top performers based on activity and balance</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <button 
            onClick={() => { setIsLoading(true); fetchRanking(); }}
            className="text-sm flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors mb-1 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <span className="text-xs text-gray-400">Last updated: {secondsAgo} seconds ago</span>
        </div>
      </div>

      {isLoading && !rankingData ? (
        <div className="p-8 flex justify-center items-center">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1 w-64">
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-gray-200 rounded col-span-2"></div>
                  <div className="h-2 bg-gray-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-blue-600 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Txns</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center border-l border-gray-100" title="Balance Score (40%)">Bal. Score</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center" title="Consistency Score (30%)">Consistency</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center" title="Frequency Score (20%)">Frequency</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center" title="Longevity Score (10%)">Longevity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingData?.ranking?.map((user: any, index: number) => (
                <tr key={user.user_id} className={`hover:bg-gray-50/50 transition-colors ${index < 3 ? 'bg-white' : ''}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-lg ${getRankStyle(user.rank)}`}>
                    <div className="flex items-center gap-2">
                      {getRankIcon(user.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600 bg-blue-50/30">
                    {(user.score * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-700">
                    ₹{user.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                    {user.transaction_count}
                  </td>
                  
                  {/* Score Breakdowns */}
                  <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-500 border-l border-gray-100">
                    {user.score_breakdown.balance_score.toFixed(3)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                    {user.score_breakdown.consistency_score.toFixed(3)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                    {user.score_breakdown.frequency_score.toFixed(3)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                    {user.score_breakdown.longevity_score.toFixed(3)}
                  </td>
                </tr>
              ))}
              
              {(!rankingData?.ranking || rankingData.ranking.length === 0) && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
