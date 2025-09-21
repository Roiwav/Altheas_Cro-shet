import { useEffect, useState } from "react";
import { useUser } from "../../../context/UserContext";

// Update this URL to match the backend endpoint for fetching orders
const backendURL = "http://localhost/croshet_db/get-orders.php"; // Make sure this is correct

export default function OrdersTab() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map order statuses to colors
  const statusColors = {
    Delivered: "text-green-600 bg-green-100",
    Processing: "text-yellow-600 bg-yellow-100",
    Cancelled: "text-red-600 bg-red-100",
  };

  // Fetch the orders when the component mounts or when user changes
  useEffect(() => {
    if (!user?.id) return; // If user is not available, don't fetch orders

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${backendURL}?user_id=${user.id}`);
        const data = await res.json();

        if (data.status === 'success') {
          setOrders(data.orders); // Assuming data.orders is the correct format
        } else {
          console.error("Failed to fetch orders:", data.message);
        }
      } catch (err) {
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false); // Stop loading once the data is fetched
      }
    };

    fetchOrders();
  }, [user]); // Re-fetch if the user changes

  return (
    <div className="text-pink-800">
      <h2 className="text-4xl font-extrabold mb-8 text-center text-pink-600">
        My Purchases
      </h2>

      {loading ? (
        <p className="text-center text-gray-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-center bg-pink-50 py-6 rounded-lg shadow text-gray-500">
          You haven’t placed any orders yet. ✨ Start shopping and fill your cart with joy!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow text-sm md:text-base">
            <thead className="bg-pink-100 text-pink-700 text-left">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b hover:bg-pink-50 transition duration-200"
                >
                  <td className="px-4 py-3 font-medium">{order.id}</td>
                  <td className="px-4 py-3">{order.date}</td>
                  <td className="px-4 py-3">{order.items}</td>
                  <td className="px-4 py-3 font-semibold text-pink-600">
                    ₱{parseFloat(order.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        statusColors[order.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
