import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import useBubbles from '../../hooks/useBubbles';
import axios from 'axios';
import emailjs from '@emailjs/browser';

// --- Constants ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://altheascroshetbackend.vercel.app";
const API_URL = `${API_BASE_URL}/api/v1/auth`;

/**
 * Renders the "Forgot Password" page.
 * This component allows users to enter their email to receive a password reset link.
 * It communicates with the backend to generate a token and then uses EmailJS to send the email.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  // Background bubbles effect
  useBubbles('forgot-container', { count: 16, sizeRange: [6, 14], durationRange: [10, 18], opacity: 0.18 });

  /**
   * Handles the form submission to request a password reset link.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Request the backend to generate a secure, short-lived reset token.
      const { data } = await axios.post(`${API_URL}/forgot-password`, { email });
      console.log("Forgot Password API Response:", data);

      if (!data.success || !data.token) {
        throw new Error(data.message || "Failed to generate reset link.");
      }

      // Step 2: Construct the full reset link, appending 'from=admin' if the request originated from the admin portal.
      const resetLink = fromAdmin
        ? `${window.location.origin}/reset-password?token=${data.token}&from=admin`
        : `${window.location.origin}/reset-password?token=${data.token}`;

      // Step 3: Prepare the parameters for the EmailJS template.
      const templateParams = {
        to_email: email.trim(),         // FIX: must match EmailJS recipient variable
        user_name: data.name || "User",
        reset_link: resetLink,
      };

      console.log("EmailJS Template Params:", templateParams); // Debug

      // Step 4: Send the email using the EmailJS service.
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_USER_ID
      );

      setMessage(data.message || "A password reset link has been sent to your email.");
      setEmail('');
    } catch (err) {
      console.error("Forgot Password Error:", err);

      const msg =
        err.response?.data?.message ||  // Axios backend error
        err.text ||                     // EmailJS error
        err.message ||                  // JS error
        'Failed to send reset link. Please try again.';

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 forgot-container">
      <div className="relative w-full max-w-md overflow-hidden border shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border-white/20 dark:border-gray-700/50">
        <div className="absolute w-40 h-40 rounded-full -top-20 -right-20 bg-pink-500/10 blur-3xl"></div>
        <div className="absolute w-40 h-40 rounded-full -bottom-20 -left-20 bg-blue-500/10 blur-3xl"></div>

        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
            </Link>
          </div>

          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter your email address and we'll send you a reset link
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/30">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-4 mb-6 border-l-4 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/30">
              <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="block w-full py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors duration-200 border border-transparent shadow-sm rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 -ml-1 animate-spin" /> Sending...
                </div>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-sm text-center text-gray-600 dark:text-gray-400">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
