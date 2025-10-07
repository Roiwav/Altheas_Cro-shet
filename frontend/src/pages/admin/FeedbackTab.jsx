import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, CheckCircle, XCircle, Star, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const FeedbackTab = ({ isDarkMode }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all feedbacks, including unapproved ones
      const response = await fetch('http://localhost:5001/api/v1/testimonials/all');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleApprovalToggle = async (feedbackId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await fetch(`http://localhost:5001/api/v1/testimonials/${feedbackId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedFeedback = await response.json();
      setFeedbacks(currentFeedbacks =>
        currentFeedbacks.map(f => (f._id === feedbackId ? updatedFeedback : f))
      );
      toast.success(`Feedback ${newStatus ? 'approved' : 'unapproved'}.`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to permanently delete this feedback?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/v1/testimonials/${feedbackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete feedback.');
      }

      setFeedbacks(currentFeedbacks => currentFeedbacks.filter(f => f._id !== feedbackId));
      toast.success('Feedback deleted successfully.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer Feedback</h2>
      {loading && <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
        <table className="w-full text-left">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Customer</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Message</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Rating</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Received On</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {!loading && feedbacks.length === 0 ? (
              <tr>
                <td colSpan="6" className={`px-6 py-10 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No feedback received yet.
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback._id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{feedback.author}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-md whitespace-normal`}>{feedback.quote}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(feedback.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${feedback.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {feedback.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleApprovalToggle(feedback._id, feedback.isApproved)}
                        className={`flex items-center transition-colors ${feedback.isApproved ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700'}`}
                        title={feedback.isApproved ? 'Unapprove' : 'Approve'}
                      >
                        {feedback.isApproved ? <XCircle className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        {feedback.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(feedback._id)}
                        className="flex items-center text-red-500 transition-colors hover:text-red-700"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
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