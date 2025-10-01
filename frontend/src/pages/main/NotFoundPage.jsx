import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../context/DarkModeContext.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const goBack = () => {
    // Go back to the previous page in history.
    // If there's no history, it will not do anything,
    // so having a link to the homepage is a good fallback.
    navigate(-1);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'
      }`}
    >
      <div className="text-center">
        <h1 className="font-extrabold text-purple-400 text-9xl drop-shadow-lg">
          404
        </h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Page Not Found
        </h2>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Oops! The page you’re looking for doesn’t exist.
        </p>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          You can either go back to the previous page or return to the homepage.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={goBack}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
          Go Back
          </button>
          <Link to="/" className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}