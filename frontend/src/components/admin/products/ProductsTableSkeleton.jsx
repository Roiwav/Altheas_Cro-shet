import React from 'react';

export default function ProductsTableSkeleton({ isDarkMode }) {
  const row = (
    <tr className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
      <td className="px-6 py-4">
        <div className={`h-4 w-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
          <div className="space-y-2 w-40">
            <div className={`h-3 w-32 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
            <div className={`h-3 w-24 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><div className={`h-3 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} /></td>
      <td className="px-6 py-4"><div className={`h-3 w-12 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} /></td>
      <td className="px-6 py-4"><div className={`h-3 w-24 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} /></td>
      <td className="px-6 py-4"><div className={`h-4 w-6 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} /></td>
      <td className="px-6 py-4"><div className={`h-4 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} /></td>
    </tr>
  );

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="px-6 py-3" />
              <th className="px-6 py-3" />
              <th className="px-6 py-3" />
              <th className="px-6 py-3" />
              <th className="px-6 py-3" />
              <th className="px-6 py-3" />
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>{row}</React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
