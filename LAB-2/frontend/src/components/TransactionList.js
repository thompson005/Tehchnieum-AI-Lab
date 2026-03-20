import React from 'react';

export default function TransactionList({ transactions }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'transfer':
        return { text: 'TFR', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'debit':
        return { text: 'DEB', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      case 'credit':
        return { text: 'CRD', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      default:
        return { text: 'TXN', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => {
              const badge = getTransactionBadge(tx.type);
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p>{tx.description}</p>
                      {tx.note && (
                        <p className="text-xs text-gray-500 mt-1">{tx.note}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bgColor} ${badge.textColor} mr-2`}>{badge.text}</span>
                      <span className="capitalize">{tx.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span
                      className={
                        tx.type === 'credit'
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
