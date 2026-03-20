import React from 'react';

export default function AccountCard({ account }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency || 'USD',
    }).format(amount);
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'checking':
        return 'C';
      case 'savings':
        return 'S';
      case 'credit':
        return 'CR';
      default:
        return 'A';
    }
  };

  const getIconBgColor = (type) => {
    switch (type) {
      case 'checking':
        return 'bg-blue-600';
      case 'savings':
        return 'bg-green-600';
      case 'credit':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600 uppercase tracking-wide">
            {account.type}
          </p>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {account.account_number}
          </p>
        </div>
        <div className={`w-12 h-12 ${getIconBgColor(account.type)} rounded-full flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{getAccountIcon(account.type)}</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(account.balance)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Available Balance</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${account.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
            }`}
        >
          {account.status}
        </span>
      </div>
    </div>
  );
}
