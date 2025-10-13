import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Search, Filter, Download, ArrowLeft, ArrowRight, ChevronDown, Clock, User, Package, CreditCard, Shield, Settings, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

const eventTypes = ['Order Update', 'Payment', 'User Action', 'Security', 'Product Edit', 'Order Creation', 'Customer Interaction'];
 
const getEventTypeStyle = (type) => {
  switch (type) {
    case 'Order Update':
    case 'Order Creation':
      return { icon: Package, color: 'blue' };
    case 'Payment':
      return { icon: CreditCard, color: 'green' };
    case 'Product Edit':
      return { icon: Settings, color: 'purple' };
    case 'User Action':
      return { icon: User, color: 'indigo' };
    case 'Security':
      return { icon: Shield, color: 'red' };
    case 'Customer Interaction':
      return { icon: MessageSquare, color: 'teal' };
    default:
      return { icon: Clock, color: 'gray' };
  }
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    Success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Failure: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  };
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>{status}</span>;
};

const LogsTab = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        setActivityLogs([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (selectedTypes.length > 0)
        selectedTypes.forEach(type => params.append('eventType', type));
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', 100); // allow plenty

      const response = await fetch(`http://localhost:5001/api/v1/logs/all?${params}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      const data = await response.json();
      setActivityLogs(data.logs || []);
    } catch (error) {
      toast.error(error.message);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTypes, searchQuery]);

  useEffect(() => { fetchActivityLogs(); }, [fetchActivityLogs]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(log.eventType);
      const searchMatch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [activityLogs, searchQuery, selectedTypes]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const renderLogItem = (log) => {
    const { icon: Icon, color } = getEventTypeStyle(log.eventType);
    const iconColorClass = `text-${color}-500 dark:text-${color}-400`;

    return (
      <div key={log._id || log.id || log.resourceId || log.timestamp} className="p-4 mb-3 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-start">
          <div className={`p-2 mr-4 rounded-full bg-${color}-100 dark:bg-gray-700`}>
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{log.eventType}</p>
              <p className="mt-1 text-xs text-gray-500 sm:mt-0 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{log.details}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1.5" />
                <span>{log.actor}</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono text-xs">ID: {log.resourceId}</span>
              </div>
              <StatusBadge status={log.status} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Track all system, user, and order events.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search by actor, resource ID, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Event Types {selectedTypes.length > 0 && `(${selectedTypes.length})`}
              <ChevronDown className="w-5 h-5 ml-2 -mr-1" />
            </Menu.Button>
            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-600">
                <div className="p-1">
                  {eventTypes.map(type => (
                    <Menu.Item key={type}>
                      <div
                        onClick={() => handleTypeToggle(type)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={selectedTypes.includes(type)}
                          className="w-4 h-4 mr-3 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span>{type}</span>
                      </div>
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
        ) :
        paginatedLogs.length > 0 ? (
          isMobile ? (
            <div>
              {paginatedLogs.map(renderLogItem)}
            </div>
          ) : (
            <div className="relative overflow-hidden bg-white shadow-md dark:bg-gray-800 sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Event</th>
                      <th scope="col" className="px-6 py-3">Actor</th>
                      <th scope="col" className="px-6 py-3">Details</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => {
                      const { icon: Icon, color } = getEventTypeStyle(log.eventType);
                      const iconColorClass = `text-${color}-500 dark:text-${color}-400`;

                      return (
                        <tr key={log._id || log.id || log.resourceId || log.timestamp} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                            <div className={`p-2 mr-3 rounded-full bg-${color}-100 dark:bg-gray-700`}>
                              <Icon className={`w-5 h-5 ${iconColorClass}`} />
                            </div>
                            {log.eventType}
                          </th>
                          <td className="px-6 py-4">
                            <div className="font-medium">{log.actor}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-600 dark:text-gray-300">{log.details}</div>
                            <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">ID: {log.resourceId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={log.status} />
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="py-16 text-center bg-white rounded-lg dark:bg-gray-800">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Logs Found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex flex-col items-center justify-between p-4 space-y-3 md:flex-row md:space-y-0" aria-label="Table navigation">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredLogs.length}</span>
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
      )}
    </div>
  );
};

export default LogsTab;