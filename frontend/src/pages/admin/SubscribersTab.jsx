import React, { useState, useEffect } from 'react';

const SubscribersTab = ({ isDarkMode }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'subscribedAt', direction: 'descending' });

  useEffect(() => {
    // Placeholder for fetching subscribers from the backend
    const fetchSubscribers = async () => {
      setIsLoadingSubscribers(true);
      try {
        // In a real app, you would fetch from an API endpoint
        // For now, we'll use mock data after a short delay
        setTimeout(() => {
          setSubscribers([
            { _id: 'sub1', email: 'subscriber1@example.com', subscribedAt: '2023-11-01T10:00:00Z', isActive: true },
            { _id: 'sub2', email: 'subscriber2@example.com', subscribedAt: '2023-10-30T12:30:00Z', isActive: true },
            { _id: 'sub3', email: 'subscriber3@example.com', subscribedAt: '2023-10-29T15:00:00Z', isActive: false },
          ]);
          setIsLoadingSubscribers(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch subscribers:", error);
        setIsLoadingSubscribers(false);
      }
    };

    fetchSubscribers();
  }, []);

  const sortedSubscribers = React.useMemo(() => {
    return [...subscribers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [subscribers, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Newsletter Subscribers</h2>
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
        </span>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
        {isLoadingSubscribers ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-b-2 border-pink-500 rounded-full animate-spin"></div>
          </div>
        ) : subscribers.length === 0 ? (
          <div className={`p-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No subscribers yet. Your newsletter subscribers will appear here.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase cursor-pointer" onClick={() => requestSort('email')}>
                  <span className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Email {renderSortIndicator('email')}</span>
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase cursor-pointer" onClick={() => requestSort('subscribedAt')}>
                  <span className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Subscribed On {renderSortIndicator('subscribedAt')}</span>
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>Status</span>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {sortedSubscribers.map((subscriber) => (
                <tr key={subscriber._id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      <a href={`mailto:${subscriber.email}`} className={isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-800'}>
                        {subscriber.email}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(subscriber.subscribedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subscriber.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>{subscriber.isActive ? 'Active' : 'Unsubscribed'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SubscribersTab;