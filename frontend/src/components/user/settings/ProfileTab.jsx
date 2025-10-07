import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Image as ImageIcon, Mail, Save } from "lucide-react";

import Field from "../../common/Field.jsx";
import { useUser } from "../../../context/useUser.js";

export default function ProfileTab() {
  const { user, token, updateUser } = useUser();

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    avatar: "",
  });
  const [profilePassword, setProfilePassword] = useState("");

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
    } else {
      setProfile({ fullName: "", username: "", email: "", avatar: "" });
    }
  }, [user]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((p) => ({ ...p, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profilePassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }
    if (!user?.id || !token) {
      toast.error("You must be logged in to save changes.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: profile.username,
          avatar: profile.avatar,
          password: profilePassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await res.json();
      updateUser(data.user);

      setProfile({
        fullName: data.user.fullName || "",
        username: data.user.username || "",
        email: data.user.email || "",
        avatar: data.user.avatar || "",
      });
      setProfilePassword("");
      toast.success("Profile updated");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={profile.avatar || defaultAvatar}
          alt="Avatar"
          className="object-cover w-20 h-20 border border-gray-200 rounded-full dark:border-gray-700"
        />
        <div>
          <label htmlFor="avatarUpload" className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 cursor-pointer rounded-xl dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
            <ImageIcon className="w-4 h-4" />
            Change avatar
          </label>
          <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input
            value={profile.fullName}
            onChange={() => {}}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder=""
            readOnly
            title="Full name changes are not available here. Contact support to update."
          />
        </Field>
        <Field label="Username">
          <input
            value={profile.username}
            onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder=""
          />
        </Field>
        <Field label="Email">
          <div className="relative">
            <Mail className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
            <input
              type="email"
              value={profile.email}
              onChange={() => {}}
              className="w-full py-2 pr-3 text-gray-900 bg-white border border-gray-200 pl-9 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="you@example.com"
              readOnly
              title="Email changes are not available here. Contact support to update."
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Confirm password">
          <input
            type="password"
            value={profilePassword}
            onChange={(e) => setProfilePassword(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Enter your account password to confirm"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button onClick={saveProfile} className="inline-flex items-center gap-2 px-5 py-2 text-white bg-pink-600 rounded-xl hover:bg-pink-700">
          <Save className="w-4 h-4" /> Save changes
        </button>
      </div>
    </div>
  );
}
