import React, { useState } from 'react';
import { transactionsAPI } from '../services/api';

export default function SmartTransfer({ onTransferComplete }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTransfer = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await transactionsAPI.smartTransfer(message);
      setResult(response.data);
      if (response.data.success) {
        setMessage('');
        setTimeout(() => {
          onTransferComplete();
        }, 1000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data?.detail || 'Transfer failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'linear-gradient(135deg,#FF6B00,#FFB800)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Smart Transfer</h3>
          <p className="text-sm text-gray-600">Natural language money transfers</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tell me what you want to transfer
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., Send $50 to account 1001234568 for dinner"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            rows="3"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading || !message.trim()}
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
              Processing...
            </>
          ) : (
            'Execute Transfer'
          )}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg ${result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}
          >
            <p
              className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'
                }`}
            >
              {result.success ? 'Success: ' : 'Error: '}
              {result.message || result.error}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Note: AI-powered feature. Verify details before confirming.
        </p>
      </div>
    </div>
  );
}
