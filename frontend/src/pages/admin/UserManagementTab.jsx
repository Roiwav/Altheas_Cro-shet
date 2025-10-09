/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, MoreVertical, Trash2, Shield, ShieldOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Filter, ShoppingBag, Package, Calendar, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

const RoleBadge = ({ role }) => {
  const roleClasses = {
    Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Moderator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>{role}</span>;
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>{status}</span>;
};

export default function UserManagementTab({ isDarkMode }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'joinedDate', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // This is a placeholder URL. You'll need to create this endpoint in your backend.
      const response = await fetch('http://localhost:5001/api/users/all'); 
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data); // Assuming the API returns an array of users
    } catch (error) {
      toast.error(error.message);
      setUsers([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetchUsers(); // You can uncomment this when your backend is ready
    setLoading(false); // For now, just stop loading
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.name || user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user.id));
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
    if (sortConfig.direction === 'ascending') return <ArrowUp className="w-4 h-4 ml-1" />;
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const renderUserCard = (user) => (
    <div key={user.id} className="p-4 mb-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <input
            id={`checkbox-mobile-${user.id}`}
            type="checkbox"
            checked={selectedUsers.includes(user.id)}
            onChange={() => handleSelectOne(user.id)}
            className="w-4 h-4 mt-1 mr-3 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <img className="w-12 h-12 rounded-full" src={user.avatar} alt={`${user.name} avatar`} />
          <div className="ml-3">
            <p className="text-base font-semibold text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <MoreVertical className="w-5 h-5" />
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-600">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => ( <a href="#" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}> <Shield className="w-4 h-4 mr-3" /> Change Role </a> )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => ( <a href="#" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400`}> <ShieldOff className="w-4 h-4 mr-3" /> Suspend Account </a> )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => ( <a href="#" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400`}> <Trash2 className="w-4 h-4 mr-3" /> Delete Account </a> )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <UserCheck className="w-4 h-4 mr-2 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <UserCheck className="w-4 h-4 mr-2 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <StatusBadge status={user.status} />
            </div>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
              <p className="font-medium">{new Date(user.joinedDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        {user.role === 'Customer' && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Activity</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Items Bought</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{user.itemsBought}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-2 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{user.totalOrders}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Manage and monitor all user accounts.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-center justify-between mb-6 space-y-3 md:flex-row md:space-y-0 md:space-x-4">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
            />
          </div>
        </div>
        <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">
          <div className="flex items-center w-full space-x-3 md:w-auto">
            <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto focus:outline-none hover:bg-gray-100 hover:text-pink-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            {selectedUsers.length > 0 && (
              <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-700 bg-white border border-gray-200 rounded-lg md:w-auto focus:outline-none hover:bg-gray-100 hover:text-red-900 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-red-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-lg dark:bg-gray-800">
          <AlertTriangle className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Users Found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">There are no users in the system yet.</p>
        </div>
      ) : isMobile ? (
        paginatedUsers.length > 0 ? (
          paginatedUsers.map(renderUserCard)
        ) : (
          <div className="py-16 text-center">No users match your search.</div>
        )
      ) : (
      <div className="relative overflow-hidden bg-white shadow-md dark:bg-gray-800 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="p-4">
                  <div className="flex items-center">
                    <input id="checkbox-all" type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === users.length} className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>
                  <div className="flex items-center">User {getSortIcon('name')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('role')}>
                  <div className="flex items-center">Role {getSortIcon('role')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                  <div className="flex items-center">Status {getSortIcon('status')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('joinedDate')}>
                  <div className="flex items-center">Joined {getSortIcon('joinedDate')}</div>
                </th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="w-4 p-4">
                    <div className="flex items-center">
                      <input id={`checkbox-${user.id}`} type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelectOne(user.id)} className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                      <label htmlFor={`checkbox-${user.id}`} className="sr-only">checkbox</label>
                    </div>
                  </td>
                  <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                    <img className="w-10 h-10 rounded-full" src={user.avatar} alt={`${user.name} avatar`} />
                    <div className="pl-3">
                      <div className="text-base font-semibold">{user.name || user.fullName}</div>
                      <div className="font-normal text-gray-500">{user.email}</div>
                      {user.role === 'Customer' && (
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <ShoppingBag className="w-3 h-3 mr-1.5" />
                            <span>{user.itemsBought} items</span>
                          </div>
                          <div className="flex items-center">
                            <Package className="w-3 h-3 mr-1.5" />
                            <span>{user.totalOrders} orders</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4">{new Date(user.joinedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </Menu.Button>
                      <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-600">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <a href="#" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                                  <Shield className="w-4 h-4 mr-3" /> Change Role
                                </a>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <a href="#" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400`}>
                                  <ShieldOff className="w-4 h-4 mr-3" /> Suspend Account
                                </a>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <a href="#" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400`}>
                                  <Trash2 className="w-4 h-4 mr-3" /> Delete Account
                                </a>
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
        <nav className="flex flex-col items-start justify-between p-4 space-y-3 md:flex-row md:items-center md:space-y-0" aria-label="Table navigation">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{sortedUsers.length}</span>
          </span>
          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <li key={page}>
                <button onClick={() => setCurrentPage(page)} className={`flex items-center justify-center text-sm py-2 px-3 leading-tight ${currentPage === page ? 'text-pink-600 bg-pink-50 border-pink-300 dark:bg-gray-700 dark:text-white' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'} `}>
                  {page}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">
                <ArrowRight className="w-4 h-4" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
      )}
    </div>
  );
}