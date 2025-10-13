import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

// --- Constants ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://altheascroshetbackend.vercel.app";
const API_URL = `${API_BASE_URL}/api/v1/auth`;

/**
 * Renders the "Reset Password" page.
 * This component allows a user to set a new password using a token
 * received from a password reset link.
 */
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const fromAdmin = searchParams.get('from') === 'admin';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);
  const toggleConfirmVisibility = () => setShowConfirm(prev => !prev);

  /**
   * Handles the form submission to reset the user's password.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Call the backend endpoint to reset the password with the provided token.
      const { data } = await axios.post(`${API_URL}/reset-password`, { token, password });

      if (data.success) {
        const redirectUrl = fromAdmin ? '/admin/login' : '/login';
        setMessage(data.message || 'Password reset successfully! Redirecting to login...');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate(redirectUrl), 2000);
      } else {
        throw new Error(data.message || 'Something went wrong.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="mt-10 text-center text-red-600">
        Invalid or missing token.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md p-8 shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl sm:p-10">
        <h2 className="mb-6 text-3xl font-bold text-center text-transparent text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
          Reset Password
        </h2>

        {message && <p className="mb-4 text-center text-green-600">{message}</p>}
        {error && <p className="mb-4 text-center text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your new password"
              autoComplete="new-password"
              className="block w-full py-3 pl-4 pr-10 text-gray-900 placeholder-gray-500 transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute text-gray-400 top-9 right-3 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              className="block w-full py-3 pl-4 pr-10 text-gray-900 placeholder-gray-500 transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute text-gray-400 top-9 right-3 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={toggleConfirmVisibility}
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors duration-200 border border-transparent shadow-sm rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 -ml-1 animate-spin" /> Resetting...
              </div>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
