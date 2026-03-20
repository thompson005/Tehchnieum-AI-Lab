import React, { useState } from 'react';
import { transactionsAPI } from '../services/api';

export default function TransactionAnalyzer({ transactions }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [limit, setLimit] = useState(5);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis('');

    try {
      const response = await transactionsAPI.analyzeTransactions(limit);
      setAnalysis(response.data.analysis);
    } catch (error) {
      setAnalysis('<p class="text-red-600">Failed to analyze transactions.</p>');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'linear-gradient(135deg,#FF6B00,#FFB800)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Transaction Analyzer</h3>
          <p className="text-sm text-gray-600">AI-powered spending insights</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of transactions to analyze
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            disabled={loading}
          >
            <option value={5}>Last 5 transactions</option>
            <option value={10}>Last 10 transactions</option>
            <option value={20}>Last 20 transactions</option>
          </select>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || transactions.length === 0}
          className="w-full text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#FF6B00,#FFB800)' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing Portfolio...
            </>
          ) : (
            'Analyze Transactions'
          )}
        </button>

        {analysis && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Analysis:</h4>
            {/* VULNERABLE: Rendering HTML directly without sanitization */}
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: analysis }}
            />
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          AI generated insights. Not financial advice.
        </p>
      </div>
    </div>
  );
}
