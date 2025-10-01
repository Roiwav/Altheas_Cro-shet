import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const FeedbackTab = ({ isDarkMode }) => {
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, name: 'Jane Doe', email: 'jane.d@example.com', message: 'Absolutely love the crochet flowers! The quality is amazing and they look beautiful in my living room.', created_at: '2023-10-26T10:00:00Z' },
    { id: 2, name: 'John Smith', email: 'john.s@example.com', message: 'Great customer service and fast shipping. The packaging was also very lovely. Will definitely buy again!', created_at: '2023-10-25T14:30:00Z' },
    { id: 3, name: 'Emily White', email: 'emily.w@example.com', message: 'The sunflower is so cheerful and well-made. It brightens up my desk.', created_at: '2023-10-25T11:20:00Z' },
  ]);

  const handleDeleteFeedback = (feedbackId) => {
    // This will be a backend call later. For now, it just updates the UI state.
    setFeedbacks(currentFeedbacks => currentFeedbacks.filter(f => f.id !== feedbackId));
    // You can add a toast notification here for better UX, e.g., toast.success("Feedback deleted!");
  };

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer Feedback</h2>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
        <table className="w-full text-left">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Customer</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Message</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Received On</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan="4" className={`px-6 py-10 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No feedback received yet.
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id} className={isDarkMode ? 'hover:bg-gray-700/50' : ''}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{feedback.name}</div>
                    <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{feedback.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-md whitespace-normal`}>{feedback.message}</p>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(feedback.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      className="flex items-center text-red-600 transition-colors hover:text-red-800"
                      title="Delete Feedback"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackTab;