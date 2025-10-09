import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Image as ImageIcon, Mail, Save, User, Lock, Edit2, Check, X } from "lucide-react";
import Field from "../../common/Field.jsx";
import { useUser } from "../../../context/useUser.js";
import { SERVER_BASE_URL } from "../../../utils/product.js";

export default function ProfileTab() {
  const { user, token, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    avatar: "",
  });
  const [profilePassword, setProfilePassword] = useState("");
  const [errors, setErrors] = useState({});

  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!profile.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!profilePassword) newErrors.password = "Password is required to save changes";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(p => ({ ...p, avatar: reader.result }));
      if (!isEditing) setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!validateForm()) return;
    if (!user?.id || !token) {
      toast.error("You must be logged in to save changes.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          avatar: profile.avatar,
          password: profilePassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      await res.json(); // consume response body (not used)
      
      // Update the user context with the new data
      updateUser({
        ...user,  // Keep existing user data
        fullName: profile.fullName,
        avatar: profile.avatar
      });
      
      setProfilePassword("");
      setErrors({});
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        avatar: user.avatar || "",
      });
    }
    setProfilePassword("");
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your account's profile information and avatar
        </p>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-xl shadow-sm dark:bg-gray-800/50 md:flex-row">
        <div className="relative group">
          <img
            src={profile.avatar || defaultAvatar}
            alt="Profile"
            className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-lg dark:border-gray-800"
          />
          <label 
            htmlFor="avatarUpload" 
            className="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 text-white transition-all bg-pink-600 rounded-full cursor-pointer hover:bg-pink-700 group-hover:opacity-100 opacity-90"
            title="Change avatar"
          >
            <Edit2 className="w-4 h-4" />
            <input 
              id="avatarUpload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarUpload} 
            />
          </label>
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{profile.fullName || 'Your Name'}</h3>
          <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Member since {new Date(user?.createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 bg-white rounded-xl shadow-sm dark:bg-gray-800/50">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Full Name" error={errors.fullName}>
            <div className="relative">
              <User className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
              <input
                value={profile.fullName}
                onChange={(e) => {
                  setProfile(p => ({ ...p, fullName: e.target.value }));
                  setIsEditing(true);
                  if (errors.fullName) setErrors(e => ({ ...e, fullName: '' }));
                }}
                className={`w-full py-2 pl-10 pr-3 text-gray-900 bg-white border ${errors.fullName ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg dark:bg-gray-900 dark:text-white`}
                placeholder="Enter your full name"
              />
            </div>
          </Field>

          <Field label="Username">
            <div className="relative">
              <User className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
              <input
                value={profile.username}
                readOnly
                className="w-full py-2 pl-10 pr-3 text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                placeholder="Username"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Username cannot be changed</p>
          </Field>

          <Field label="Email Address">
            <div className="relative">
              <Mail className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full py-2 pl-10 pr-3 text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                placeholder="your@email.com"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Contact support to update your email
            </p>
          </Field>

          {isEditing && (
            <Field label="Confirm Password" error={errors.password}>
              <div className="relative">
                <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => {
                    setProfilePassword(e.target.value);
                    if (errors.password) setErrors(e => ({ ...e, password: '' }));
                  }}
                  className={`w-full py-2 pl-10 pr-3 text-gray-900 bg-white border ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg dark:bg-gray-900 dark:text-white`}
                  placeholder="Enter your password to confirm changes"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                For security, please confirm your password to save changes
              </p>
            </Field>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 sm:flex-row">
          {isEditing && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          )}
          <button
            onClick={isEditing ? saveProfile : () => setIsEditing(true)}
            disabled={isLoading}
            className={`flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
              isLoading
                ? 'bg-pink-400 cursor-not-allowed'
                : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 mr-2 -ml-1 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
