import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import productImages from '../../../assets/images/productImages';


export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getId } = useCart();
  const [selectedItemIds, setSelectedItemIds] = React.useState([]);

  const handleDelete = async () => {
    // Create a promise for each deletion
    const deletePromises = selectedItemIds.map(itemId => removeFromCart(itemId));
    
    try {
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("One or more items failed to delete:", err);
      toast.error("Could not delete all selected items.");
    }
    
    // Clear the selection after deletion
    setSelectedItemIds([]);
  };

  const handleCheckout = () => {
    const selected = cartItems.filter(item => selectedItemIds.includes(getId(item)));
    if (selected.length === 0) {
      // Using toast for consistency, but alert is also fine.
      toast.warn("Please select items to checkout.");
      return;
    }
    // Navigate to checkout page with the selected items
    navigate("/checkout", { state: { items: selected } });
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

  console.log('cartItems', cartItems);

  return (
    <div className="text-pink-800 w-full max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-pink-700">My Cart</h2>

      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <button
          onClick={() => navigate("/shop")}
          className="bg-white border border-pink-400 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition text-sm"
        >
          ← Continue Shopping
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleCheckout}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
          >
            ✅ Checkout
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow border border-pink-200 bg-white">
        <table className="min-w-full text-sm md:text-base">
          <thead className="bg-pink-100 text-pink-700">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-center">Price</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.length > 0 ? (
              cartItems.map((item, idx) => (
                <tr key={item.id} className="border-t hover:bg-pink-50">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(getId(item))}
                      onChange={() => {
                        const itemId = getId(item);
                        setSelectedItemIds(prev =>
                          prev.includes(itemId)
                            ? prev.filter(id => id !== itemId)
                            : [...prev, itemId]
                        );
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img
                      src={productImages[item.product_id]}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border border-pink-200"
                    />
                    <span className="font-medium">{item.name}</span>
                  </td>
                  <td className="text-center text-pink-600 font-semibold">
                    ₱{item.price.toFixed(2)}
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(getId(item), Math.max(1, item.qty - 1))
                        }
                        disabled={item.qty <= 1}
                        className="px-2 py-1 rounded-full bg-pink-300 text-white hover:bg-pink-400 disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="min-w-[24px] text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(getId(item), item.qty + 1)}
                        className="px-2 py-1 rounded-full bg-pink-300 text-white hover:bg-pink-400"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="text-center font-semibold text-pink-700">
                    ₱{(item.price * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Your cart is empty!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right text-lg font-semibold text-pink-700">
        Total: ₱{totalPrice}
      </div>
    </div>
  );
}
