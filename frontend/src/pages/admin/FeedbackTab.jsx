import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, CheckCircle, XCircle, Star, Loader2, ShieldCheck, ArrowUpDown, Filter, MoreVertical, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useMediaQuery } from 'react-responsive';
import { useTestimonials } from '../../context/TestimonialsContext';

const FeedbackTab = ({ isDarkMode }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'approved', 'pending'
  const [filterRating, setFilterRating] = useState(0); // 0 for 'all', 1-5 for specific ratings
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const { refetchTestimonials } = useTestimonials();

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
      if (newStatus) {
        refetchTestimonials(); // Refetch public testimonials on approval
      }
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

  const handleSelect = (feedbackId) => {
    setSelectedFeedbacks(prev =>
      prev.includes(feedbackId)
        ? prev.filter(id => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFeedbacks(processedFeedbacks.map(f => f._id));
    } else {
      setSelectedFeedbacks([]);
    }
  };

  const handleBatchApprove = async () => {
    const feedbacksToApprove = feedbacks.filter(
      f => selectedFeedbacks.includes(f._id) && !f.isApproved
    );

    if (feedbacksToApprove.length === 0) {
      toast.info("No pending feedbacks selected for approval.");
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${feedbacksToApprove.length} selected feedbacks?`)) {
      return;
    }

    const approvalPromises = feedbacksToApprove.map(f =>
      fetch(`http://localhost:5001/api/v1/testimonials/${f._id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      }).then(res => res.ok ? res.json() : Promise.reject(`Failed for ${f.author}`))
    );

    try {
      const results = await Promise.allSettled(approvalPromises);
      const successfulApprovals = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failedApprovals = results.filter(r => r.status === 'rejected');

      if (successfulApprovals.length > 0) {
        setFeedbacks(currentFeedbacks =>
          currentFeedbacks.map(f => {
            const updated = successfulApprovals.find(up => up._id === f._id);
            return updated ? updated : f;
          })
        );
        toast.success(`${successfulApprovals.length} feedbacks approved successfully.`);
        refetchTestimonials(); // Refetch public testimonials on batch approval
      }

      if (failedApprovals.length > 0) {
        toast.error(`${failedApprovals.length} approvals failed. Please try again.`);
      }

      setSelectedFeedbacks([]); // Clear selection after action
    } catch (error) {
      toast.error('An unexpected error occurred during batch approval.');
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedFeedbacks = useMemo(() => {
    let sortableItems = [...feedbacks];

    // Filtering
    if (filterStatus !== 'all') {
      sortableItems = sortableItems.filter(f =>
        (filterStatus === 'approved' && f.isApproved) ||
        (filterStatus === 'pending' && !f.isApproved)
      );
    }

    // Filtering by rating
    if (filterRating > 0) {
      sortableItems = sortableItems.filter(f => f.rating === filterRating);
    }

    // Sorting
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Handle boolean sorting for isApproved
        if (typeof a[sortConfig.key] === 'boolean') {
            if (a[sortConfig.key] === b[sortConfig.key]) return 0;
            const valA = a[sortConfig.key] ? 1 : 0;
            const valB = b[sortConfig.key] ? 1 : 0;
            return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        // Default string/number/date sorting
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [feedbacks, sortConfig, filterStatus, filterRating]);

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>;
    }

    if (processedFeedbacks.length === 0) {
      return (
        <div className={`px-6 py-10 text-center rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {feedbacks.length === 0 
              ? 'No feedback received yet.' 
              : 'No feedback matches the current filters.'}
          </h3>
        </div>
      );
    }

    if (isMobile) {
      // Mobile Card View
      return (
        <div className="space-y-4">
          {processedFeedbacks.map((feedback) => (
            <div key={feedback._id} className={`relative p-4 overflow-hidden border rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFeedbacks.includes(feedback._id)}
                    onChange={() => handleSelect(feedback._id)}
                    className="w-5 h-5 mt-1 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{feedback.author}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(feedback.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${feedback.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {feedback.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                ))}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{feedback.quote}</p>
              <div className="flex items-center justify-end pt-3 space-x-4 text-sm border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleApprovalToggle(feedback._id, feedback.isApproved)}
                  className={`flex items-center transition-colors ${feedback.isApproved ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700'}`}
                  title={feedback.isApproved ? 'Unapprove' : 'Approve'}
                >
                  {feedback.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteFeedback(feedback._id)}
                  className="flex items-center text-red-500 transition-colors hover:text-red-700"
                  title="Delete Feedback"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Desktop Table View
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow overflow-x-auto`}>
        <table className="w-full text-left">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={processedFeedbacks.length > 0 && selectedFeedbacks.length === processedFeedbacks.length}
                  disabled={processedFeedbacks.length === 0}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Customer</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Message</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Rating</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Received On</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {processedFeedbacks.map((feedback) => (
              <tr key={feedback._id} className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedFeedbacks.includes(feedback._id)}
                    onChange={() => handleSelect(feedback._id)}
                    className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </td>
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
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer Feedback</h2>
        {selectedFeedbacks.length > 0 && (
          <button
            onClick={handleBatchApprove}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Approve Selected ({selectedFeedbacks.length})</span>
          </button>
        )}
      </div>

      {/* Redesigned Filter & Sort Controls */}
      <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg md:flex-row md:items-center md:justify-between dark:bg-gray-800/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full md:w-auto px-2 py-1.5 text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-pink-500 focus:border-pink-500">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-rating" className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating</label>
            <select id="filter-rating" value={filterRating} onChange={e => setFilterRating(Number(e.target.value))} className="w-full md:w-auto px-2 py-1.5 text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-pink-500 focus:border-pink-500">
              <option value={0}>All</option>
              <option value={5}>5 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={2}>2 Stars</option>
              <option value={1}>1 Star</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</label>
          <select id="sort-by" value={`${sortConfig.key}-${sortConfig.direction}`} onChange={e => { const [key, direction] = e.target.value.split('-'); requestSort(key); setSortConfig({key, direction})}} className="w-full md:w-auto px-2 py-1.5 text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-pink-500 focus:border-pink-500">
            <option value="createdAt-descending">Newest First</option>
            <option value="createdAt-ascending">Oldest First</option>
            <option value="rating-descending">Rating (High to Low)</option>
            <option value="rating-ascending">Rating (Low to High)</option>
            <option value="author-ascending">Customer (A-Z)</option>
            <option value="author-descending">Customer (Z-A)</option>
          </select>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default FeedbackTab; 