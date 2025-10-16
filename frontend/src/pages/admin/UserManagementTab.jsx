import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, MoreVertical, Trash2, ShieldOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Filter, ShoppingCart, Package, Calendar, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { SERVER_BASE_URL } from '../../utils/product.js';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

function getInitialsFromUser(user) {
  const raw = (user?.fullName || user?.name || user?.displayName || user?.username || user?.email || "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const token = parts[0];
  if (token.includes("@")) return token.split("@")[0].slice(0, 2).toUpperCase();
  return token.slice(0, 2).toUpperCase();
}

function bgClassForKey(key) {
  const palette = [
    "bg-pink-600","bg-blue-600","bg-green-600","bg-indigo-600","bg-orange-600",
    "bg-purple-600","bg-teal-600","bg-rose-600","bg-amber-600","bg-sky-600"
  ];
  const s = String(key || "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

const RoleBadge = ({ role }) => {
  const roleClasses = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    moderator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  const key = String(role || '').toLowerCase();
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown';
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleClasses[key] || 'bg-gray-100 text-gray-800'}`}>{label}</span>;
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export default function UserManagementTab({ isDarkMode, orders = [] }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'joinedDate', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const [cartCounts, setCartCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  const getUserStatus = useCallback((user) => {
    if (user && user.suspendedUntil) {
      const until = new Date(user.suspendedUntil);
      if (!Number.isNaN(until.getTime()) && until > new Date()) return 'Suspended';
    }
    return 'Active';
  }, []);

  // Fetch users from backend
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied. Admin privileges required.');
        } else {
          throw new Error('Failed to fetch users');
        }
        setUsers([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ✅ Map of delivered orders per user (derived, no state updates)
  const deliveredCountByUser = useMemo(() => {
    const map = {};
    if (Array.isArray(orders)) {
      orders.forEach(o => {
        if (String(o?.status || '').toLowerCase() === 'delivered') {
          const uid = (o && typeof o.userId === 'object' && o.userId?._id) ? o.userId._id : o?.userId;
          if (!uid) return;
          map[uid] = (map[uid] || 0) + 1;
        }
      });
    }
    return map;
  }, [orders]);

  // USER MANAGEMENT FUNCTIONS
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = users.filter(user =>
      (user.name || user.fullName || '').toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    );
    if (statusFilter === 'all') return list;
    return list.filter((u) => {
      const s = getUserStatus(u);
      return statusFilter === 'active' ? s === 'Active' : s === 'Suspended';
    });
  }, [users, searchQuery, statusFilter, getUserStatus]);

  const sortedUsers = useMemo(() => {
    const sortableUsers = [...filteredUsers];
    if (sortConfig.key) {
      const dir = sortConfig.direction === 'ascending' ? 1 : -1;
      sortableUsers.sort((a, b) => {
        const key = sortConfig.key;
        let av;
        let bv;
        switch (key) {
          case 'name':
            av = String(a.name || a.fullName || '').toLowerCase();
            bv = String(b.name || b.fullName || '').toLowerCase();
            break;
          case 'status':
            av = getUserStatus(a);
            bv = getUserStatus(b);
            break;
          case 'joinedDate':
            av = new Date(a.joinedDate || a.createdAt).getTime() || 0;
            bv = new Date(b.joinedDate || b.createdAt).getTime() || 0;
            break;
          default:
            av = a[key];
            bv = b[key];
        }
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig, getUserStatus]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  // ✅ FETCH CART ITEMS COUNT PER USER FOR CURRENT PAGE ONLY (stores in cartCounts, not users)
  useEffect(() => {
    if (!paginatedUsers || paginatedUsers.length === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          paginatedUsers.map(async (u) => {
            try {
              // ✅ FIXED: Add null check and validation for user ID
              if (!u || !u._id) {
                console.warn('User without _id found:', u);
                return { id: null, cartItems: 0 };
              }

              const res = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/cart?userId=${u._id}`, {
                headers: { 'Content-Type': 'application/json' }
              });

              if (!res.ok) {
                console.warn(`Cart fetch failed for user ${u._id}:`, res.status);
                return { id: u._id, cartItems: 0 };
              }

              const data = await res.json();
              const items = Array.isArray(data?.items) ? data.items : [];
              const cartItems = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
              return { id: u._id, cartItems };
            } catch (error) {
              console.error(`Error fetching cart for user ${u._id}:`, error);
              return { id: u._id, cartItems: 0 };
            }
          })
        );

        if (cancelled) return;

        setCartCounts(prev => {
          let changed = false;
          const next = { ...prev };
          for (const { id, cartItems } of results) {
            if (id && next[id] !== cartItems) {
              next[id] = cartItems;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      } catch (e) {
        console.error('Error in cart fetching effect:', e);
      }
    })();

    return () => { cancelled = true; };
  }, [paginatedUsers]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="w-4 h-4 inline ml-1" />;
    return <ArrowDown className="w-4 h-4 inline ml-1" />;
  };

  // ✅ FIXED: Suspend user function with proper validation
  const handleSuspendUser = async (userId) => {
    // ✅ Add validation for userId
    if (!userId || userId === 'undefined') {
      console.error('Invalid userId for suspension:', userId);
      toast.error('Cannot suspend user: Invalid user ID');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days suspension
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to suspend user`);
      }

      toast.success('User suspended successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error(`Failed to suspend user: ${error.message}`);
    }
  };

  // ✅ FIXED: Unsuspend user function with proper validation  
  const handleUnsuspendUser = async (userId) => {
    // ✅ Add validation for userId
    if (!userId || userId === 'undefined') {
      console.error('Invalid userId for unsuspension:', userId);
      toast.error('Cannot unsuspend user: Invalid user ID');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/users/${userId}/unsuspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to unsuspend user`);
      }

      toast.success('User unsuspended successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error(`Failed to unsuspend user: ${error.message}`);
    }
  };

  // ✅ FIXED: Delete user function with proper validation
  const handleDeleteUser = async (userId) => {
    // ✅ Add validation for userId
    if (!userId || userId === 'undefined') {
      console.error('Invalid userId for deletion:', userId);
      toast.error('Cannot delete user: Invalid user ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://altheascroshetbackend.vercel.app/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to delete user`);
      }

      toast.success('User deleted successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        <span className="ml-2 text-lg">Loading users...</span>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and monitor all user accounts.</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Users Found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No users match your search criteria.' : 'There are no users in the system yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('name')}>
                    User {getSortIcon('name')}
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('role')}>
                    Role {getSortIcon('role')}
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('status')}>
                    Status {getSortIcon('status')}
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('joinedDate')}>
                    Joined {getSortIcon('joinedDate')}
                  </th>
                  <th className="px-4 py-3 text-left">Cart Items</th>
                  <th className="px-4 py-3 text-left">Delivered Orders</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectOne(user._id)}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="relative">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || user.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            getInitialsFromUser(user) === '?' ? (
                              <img
                                src={DEFAULT_AVATAR}
                                alt="Default Avatar"
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full ${bgClassForKey(user._id)} flex items-center justify-center text-white font-medium text-sm`}>
                                {getInitialsFromUser(user)}
                              </div>
                            )
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || user.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                      {String(user.role || '').toLowerCase() === 'customer' && (
                        <UserCheck className="w-4 h-4 inline ml-2 text-blue-500" />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={getUserStatus(user)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(user.joinedDate || user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <ShoppingCart className="w-4 h-4 text-pink-600 mr-2" />
                        <span className="text-sm font-medium">{cartCounts[user._id] || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium">{deliveredCountByUser[user.id || user._id] || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Menu as="div" className="relative inline-block text-left">
                        <div>
                          <Menu.Button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreVertical className="w-4 h-4" />
                          </Menu.Button>
                        </div>

                        <Transition
                          as={React.Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              {getUserStatus(user) === 'Active' ? (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleSuspendUser(user._id)}
                                      className={`${
                                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                      } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left`}
                                    >
                                      <ShieldOff className="w-4 h-4 mr-3 text-yellow-600" />
                                      Suspend User
                                    </button>
                                  )}
                                </Menu.Item>
                              ) : (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleUnsuspendUser(user._id)}
                                      className={`${
                                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                      } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full text-left`}
                                    >
                                      <UserCheck className="w-4 h-4 mr-3 text-green-600" />
                                      Unsuspend User
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className={`${
                                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    } flex items-center px-4 py-2 text-sm text-red-600 w-full text-left`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-3" />
                                    Delete User
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedUsers.length)} of {sortedUsers.length} users
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === page
                            ? 'bg-pink-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}