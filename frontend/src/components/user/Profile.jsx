import { useUser } from "../../../context/UserContext";
import { useState } from "react";

function Profile() {
  const { user, setUser } = useUser();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [image, setImage] = useState(user?.image || null);
  const [address, setAddress] = useState(user?.address || "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [zipCode, setZipCode] = useState(user?.zipCode || "");
  const [country, setCountry] = useState(user?.country || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");

  const handleSaveProfile = async () => {
    if (!password) return alert("Please enter your password to save changes.");

    const updatedUser = {
      ...user,
      displayName,
      fullName,
      image,
      contactNumber,
      address,
      city,
      state,
      zipCode,
      country,
    };

    try {
      const res = await fetch("http://localhost/croshet_db/update-profile.php", { // Update the URL if necessary
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedUser,
          id: user?.id, // backend usually needs this
          password,
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setPassword("");
        alert("Profile updated successfully! 🎉");
      } else {
        alert("Failed to update: " + data.message);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Server error occurred.");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-pink-700 text-center">My Profile</h2>

      <div className="flex flex-col items-center mb-8">
        <img
          src={image || "/default-profile.png"}
          alt="Preview"
          className="w-28 h-28 rounded-full object-cover shadow-md mb-2"
        />
        <input
          type="file"
          accept="image/*"
          className="text-sm mb-4"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file && file.size <= 1024 * 1024) {
              const url = URL.createObjectURL(file);
              setImage(url);
            } else {
              alert("Max 1MB image size only.");
            }
          }}
        />
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <Input label="Display Name" value={displayName} setValue={setDisplayName} />
        <Input label="Full Name" value={fullName} setValue={setFullName} />
        <Input label="Contact Number" value={contactNumber} setValue={setContactNumber} type="tel" />
        <TextArea label="Address" value={address} setValue={setAddress} />
        <Input label="City" value={city} setValue={setCity} />
        <Input label="State" value={state} setValue={setState} />
        <Input label="Zip Code" value={zipCode} setValue={setZipCode} />
        <Input label="Country" value={country} setValue={setCountry} />
        <Input label="Enter Password to Continue" value={password} setValue={setPassword} type="password" />
      </div>

      <div className="text-center mt-8">
        <button
          onClick={handleSaveProfile}
          className="bg-pink-500 text-white px-8 py-2 rounded-lg hover:bg-pink-600 transition text-sm shadow-md"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}

const Input = ({ label, value, setValue, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  </div>
);

const TextArea = ({ label, value, setValue }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <textarea
      rows={3}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  </div>
);

export default Profile;
