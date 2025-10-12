// src/components/admin/orders/StatusBadge.jsx
import React from 'react';

// Defines the CSS classes for different order statuses, supporting both light and dark modes.
const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

/**
 * Renders a styled badge for a given order status.
 * @param {object} props - The component props.
 * @param {string} props.status - The status of the order (e.g., 'pending', 'shipped').
 */
export default function StatusBadge({ status }) {
  const key = (status || 'pending').toLowerCase();
  const classes = STATUS_STYLES[key] || STATUS_STYLES.pending;
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
      {status || 'Pending'}
    </span>
  );
}
