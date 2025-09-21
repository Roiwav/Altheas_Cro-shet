import { useState, useEffect } from "react";
import { useUser } from "../../../context/UserContext";

const backendURL = "http://localhost/croshet_db"; // Ensure the URL is correct

export default function AddressTab() {
  const { user } = useUser(); // Access the user context
  const [addresses, setAddresses] = useState([]); // To hold the addresses
  const [form, setForm] = useState({ label: "", address: "" }); // Form state for new address
  const [editingIndex, setEditingIndex] = useState(null); // To keep track of which address is being edited

  // Fetch addresses from the backend
  useEffect(() => {
    if (!user?.id) return; // Only fetch if the user is logged in
    fetch(`${backendURL}/get-addresses.php?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setAddresses(data.addresses);
        } else {
          console.error("Failed to load addresses", data.message);
        }
      })
      .catch((err) => console.error("Fetch addresses error:", err));
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Reset the form after save
  const resetForm = () => {
    setForm({ label: "", address: "" });
    setEditingIndex(null);
  };

  // Save or update address
  const handleSave = async () => {
    if (!form.label.trim() || !form.address.trim()) {
      return alert("Please fill in both fields.");
    }

    const isEdit = editingIndex !== null;
    const payload = {
      user_id: user.id,
      label: form.label,
      address: form.address,
      isDefault: !isEdit && addresses.length === 0, // Mark as default if it's the first address
    };

    if (isEdit) payload.id = addresses[editingIndex].id;

    try {
      const res = await fetch(`${backendURL}/save-address.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === 'success') {
        // Update address list
        const updated = [...addresses];
        if (isEdit) {
          updated[editingIndex] = { ...updated[editingIndex], ...form };
        } else {
          updated.push({ ...form, id: data.id, isDefault: payload.isDefault });
        }
        setAddresses(updated);
        resetForm();
      } else {
        alert("Save failed: " + data.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Server error occurred.");
    }
  };

  // Edit address
  const handleEdit = (idx) => {
    setForm({ label: addresses[idx].label, address: addresses[idx].address });
    setEditingIndex(idx);
  };

  // Delete address
  const handleDelete = async (idx) => {
    const id = addresses[idx].id;

    try {
      const res = await fetch(`${backendURL}/delete-address.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, id }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setAddresses((prev) => prev.filter((_, i) => i !== idx));
      } else {
        alert("Delete failed: " + data.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error occurred.");
    }
  };

  // Set default address
  const handleSetDefault = async (idx) => {
    const id = addresses[idx].id;

    try {
      const res = await fetch(`${backendURL}/set-default-address.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, id }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        const updated = addresses.map((addr, i) => ({
          ...addr,
          isDefault: i === idx,
        }));
        setAddresses(updated);
      } else {
        alert("Set default failed: " + data.message);
      }
    } catch (err) {
      console.error("Set default error:", err);
      alert("Server error occurred.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-pink-800">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-pink-600">
        🏡 Address Book
      </h2>

      <div className="bg-pink-50 p-6 rounded-2xl shadow-lg">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          {editingIndex !== null ? "Update Address" : "Add New Address"}
        </label>
        <input
          type="text"
          name="label"
          placeholder="e.g. Home, Work, Grandma's"
          value={form.label}
          onChange={handleChange}
          className="w-full border border-pink-200 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <textarea
          rows={3}
          name="address"
          placeholder="e.g. Block 3, Lot 5, Daisy Street..."
          value={form.address}
          onChange={handleChange}
          className="w-full border border-pink-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          onClick={handleSave}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg transition shadow-md"
        >
          {editingIndex !== null ? "💾 Update Address" : "➕ Add Address"}
        </button>
      </div>

      {addresses.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-pink-700 mb-2">Saved Addresses</h3>
          {addresses.map((addr, idx) => (
            <div
              key={addr.id || idx}
              className={`border p-4 rounded-xl bg-white shadow-sm ${
                addr.isDefault ? "border-pink-400" : "border-gray-200"
              }`}
            >
              <p className="font-semibold text-pink-700">{addr.label}</p>
              <p className="text-gray-800 mb-2">{addr.address}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleSetDefault(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    addr.isDefault
                      ? "bg-green-200 text-green-700"
                      : "bg-gray-200 hover:bg-pink-100 text-gray-700"
                  }`}
                >
                  {addr.isDefault ? "✅ Default" : "Set as Default"}
                </button>
                <button
                  onClick={() => handleEdit(idx)}
                  className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(idx)}
                  className="bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded-full text-xs font-medium"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
