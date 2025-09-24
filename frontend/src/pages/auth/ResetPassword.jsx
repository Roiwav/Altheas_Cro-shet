// src/pages/auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import EyeIcon from '../../assets/images/icons/eye.png';
import EyeSlashIcon from '../../assets/images/icons/hidden.png';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password successfully reset! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setError('Request failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-red-600 text-center mt-10">
        Invalid or missing token.
      </p>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-teal-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            autoComplete="new-password"
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-pink-400 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 transform -translate-y-1/2"
            onClick={togglePasswordVisibility}
          >
            <img
              src={showPassword ? EyeSlashIcon : EyeIcon}
              alt="Toggle"
              className="w-5 h-5"
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 bg-pink-500 text-white py-2 rounded hover:bg-pink-600 transition mt-4 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          )}
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
      </form>
    </div>
  );
}

export default ResetPassword;
