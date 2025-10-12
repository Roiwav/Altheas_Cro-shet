import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { SERVER_BASE_URL } from "../utils/product";

const getAuthToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");


export default function useOrders() {
   console.log('DEBUG: useOrders function called');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "descending" });
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [noToken, setNoToken] = useState(false);

  // === Fetch all orders (admin endpoint) ===
  const refetch = useCallback(async () => {
  try {
    setLoading(true);
    const token = getAuthToken();
    console.log('DEBUG: Token exists?', !!token); // ADD THIS
    if (!token) {
      setNoToken(true);
      setLoading(false);
      return;
    }
    setNoToken(false);
    const res = await fetch(`${SERVER_BASE_URL}/api/v1/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('DEBUG: Response status:', res.status); // ADD THIS
    if (!res.ok) throw new Error("Failed to fetch orders");
    const data = await res.json();
    
    // ADD THESE DEBUG LINES:
    console.log('DEBUG: Raw API response data:', data);
    console.log('DEBUG: Is data an array?', Array.isArray(data));
    console.log('DEBUG: data.orders exists?', !!data.orders);
    console.log('DEBUG: Final orders array:', Array.isArray(data) ? data : data.orders || []);
    
    setOrders(Array.isArray(data) ? data : data.orders || []);
  } catch (err) {
    console.error("Error fetching orders:", err);
    setOrders([]);
    toast.error("Failed to fetch orders.");
  } finally {
    setLoading(false);
  }
}, []);



  useEffect(() => {
    console.log('DEBUG: useOrders useEffect running'); // ADD THIS LINE
  const token = getAuthToken();
  console.log('DEBUG: Token from localStorage:', token ? 'EXISTS' : 'MISSING');
    if (token) {
      refetch();
    } else {
      setNoToken(true);
      setLoading(false);
    }
  }, [refetch]);

  // SEARCH
  const searchedOrders = useMemo(() => {
    if (!orders) return [];
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return orders;
    const query = trimmedQuery.toLowerCase();
    return orders.filter((order) => {
      if (!order) return false;
      if (order.orderNumber?.toLowerCase().includes(query)) return true;
      if (order._id?.toLowerCase().includes(query)) return true;
      if (order.username?.toLowerCase().includes(query)) return true;
      if (order.userId?.email?.toLowerCase().includes(query)) return true;
      if (order.status?.toLowerCase().includes(query)) return true;
      if (order.products?.some((p) => p.name?.toLowerCase().includes(query))) return true;
      if (order.shippingAddress) {
        const { line1, city, state, postalCode, country } = order.shippingAddress;
        if ([line1, city, state, postalCode, country].some((field) => field && field.toLowerCase().includes(query))) return true;
      }
      if (order.paymentMethod?.toLowerCase().includes(query)) return true;
      if (order.total?.toString().includes(query)) return true;
      return false;
    });
  }, [orders, searchQuery]);

  // FILTER
  const filteredOrders = useMemo(() => {
    if (!statusFilter) return searchedOrders;
    return searchedOrders.filter((order) => order.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [searchedOrders, statusFilter]);

  // SORT
  const sortedAndFilteredOrders = useMemo(() => {
    if (!sortConfig.key) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (["total", "shippingFee"].includes(sortConfig.key)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // PAGINATION
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredOrders.length / itemsPerPage);

  // SORTER
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // UPDATE STATUS
  const updateOrderStatus = async (orderId, newStatus, rejectionReason = "") => {
    const token = getAuthToken();
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      return;
    }
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/v1/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, rejectionReason, adminName: "Admin" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update order status");
      toast.success(`Order status updated to ${newStatus}`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, ...data.order } : o)));
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error(err.message || "Failed to update order status");
    }
  };

  // BULK STATUS UPDATE
  const updateMultipleStatuses = (newStatus) => {
    if (selectedOrders.length === 0) {
      toast.error("No orders selected.");
      return;
    }
    selectedOrders.forEach((orderId) => updateOrderStatus(orderId, newStatus));
    setSelectedOrders([]);
  };

  // EXPORT CSV
  const exportToCsv = () => {
    if (sortedAndFilteredOrders.length === 0) {
      toast.warn("No orders to export.");
      return;
    }
    const headers = [
      "Order ID",
      "Order Number",
      "Customer Name",
      "Order Date",
      "Status",
      "Total",
      "Shipping Fee",
      "Payment Method",
      "Products",
      "Shipping Address",
      "Rejection Reason",
    ];

    const rows = sortedAndFilteredOrders.map((order) => {
      const escapeCsvField = (field) => {
        const str = String(field || "").replace(/"/g, '""');
        return `"${str}"`;
      };
      const productDetails = order.products?.map((p) => `${p.name} (Qty: ${p.quantity})`).join("; ") || "N/A";
      const shippingAddr = order.shippingAddress
        ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
        : "N/A";
      return [
        order._id,
        order.orderNumber || "N/A",
        escapeCsvField(order.username),
        new Date(order.createdAt).toISOString(),
        order.status,
        order.total || 0,
        order.shippingFee || 0,
        order.paymentMethod,
        escapeCsvField(productDetails),
        escapeCsvField(shippingAddr),
        escapeCsvField(order.rejectionReason),
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported successfully!");
  };

  return {
    // data
    orders,
    loading,
    noToken, // can use to show "please log in and retry"
    // filters & search
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    // sorting & pagination
    sortConfig,
    requestSort,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    // selection
    selectedOrders,
    setSelectedOrders,
    // computed
    paginatedOrders,
    sortedAndFilteredOrders,
    // actions
    updateOrderStatus,
    updateMultipleStatuses,
    exportToCsv,
    refetch,
  };
}
