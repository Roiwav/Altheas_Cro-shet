// frontend/src/pages/auth/OAuthCallback.jsx
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/useUser';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

/**
 * Safely attempts to parse a JSON string.
 * @param {string} str - The JSON string to parse.
 * @returns {object|null} The parsed object or null if parsing fails.
 */
const tryJSON = (str) => {
  try { return JSON.parse(str); } catch { return null; }
};

/**
 * Safely executes a function and returns its result, or null on error.
 * @param {function} fn - The function to execute.
 * @returns {any|null} The result of the function or null.
 */
const safe = (fn) => { try { return fn(); } catch { return null; } };

/**
 * Robustly parses the 'user' URL parameter, trying multiple decoding strategies.
 * @param {string|null} raw - The raw user data string from the URL.
 * @returns {object|null} The parsed user object or null.
 */
const parseUserParam = (raw) => {
  if (!raw) return null;
  return (
    tryJSON(raw) ||
    safe(() => tryJSON(decodeURIComponent(raw))) ||
    safe(() => tryJSON(atob(raw)))
  );
};

/**
 * A component that handles the callback from an OAuth provider (e.g., Google).
 * It processes the token and user data from the URL, logs the user in,
 * and redirects them to the appropriate page, handling any potential errors.
 * @component
 */
const OAuthCallback = () => {
  const { login, fetchUserData } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  // Ref to prevent the effect from running twice in React's Strict Mode.
  const hasRunRef = useRef(false);
  
  const { search } = location;
  const params = new URLSearchParams(search);
  const token = params.get('token');
  const userData = params.get('user');
  const error = params.get('error');
  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    /**
     * Guard to prevent the OAuth callback logic from running multiple times,
     * which can happen in React's Strict Mode or due to component re-mounts.
     */
    const doneKey = token ? `oauth_done_${token}` : null;
    if (hasRunRef.current) return;
    if (doneKey && sessionStorage.getItem(doneKey)) return;
    hasRunRef.current = true;
    if (doneKey) sessionStorage.setItem(doneKey, '1');

    const handleOAuthCallback = async () => {
      try {
        // Check for error first
        if (error) {
          throw new Error(error || 'Authentication failed');
        }

        if (!token || !userData) {
          throw new Error('Authentication data is missing');
        }

        const parsed = parseUserParam(userData);
        if (!parsed) {
          throw new Error('Invalid user data received');
        }

        /**
         * Persist the session data to `sessionStorage` for this tab.
         * This isolates the OAuth session and prevents it from being overwritten by other tabs.
         */
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(parsed));

        // Update the auth context
        await login(parsed, token, { isOAuth: true });
        // Immediately hydrate from API to ensure avatar/name are complete
        await fetchUserData(token);
        
        // Show success message once
        toast.success('Successfully logged in with Google!', { toastId: 'oauth-success' });
        
        // Admins go straight to the admin dashboard
        if (parsed?.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }

        /**
         * Check for preserved cart state from before the OAuth flow started.
         * This ensures a seamless experience for users who sign up during checkout.
         */
        const preserved = sessionStorage.getItem('oauth-cart-state') || sessionStorage.getItem('signup-cart-state');
        if (preserved) {
          try {
            const ps = JSON.parse(preserved);
            sessionStorage.removeItem('oauth-cart-state');
            sessionStorage.removeItem('signup-cart-state');
            if (ps.cartItems?.length || ps.product) {
              toast.success(`Welcome! Restoring your ${ps.cartItems?.length || 1} item(s)...`, { toastId: 'restore-cart' });
            }
            setTimeout(() => {
              if (ps.from?.includes('cart') && ps.cartItems?.length > 0) {
                navigate('/cart', { replace: true });
              } else if (ps.from?.includes('shop') && ps.product) {
                navigate('/checkout', { state: { product: ps.product }, replace: true });
              } else {
                navigate('/shop', { replace: true });
              }
            }, 400);
            return; // prevent falling through to default redirect
          } catch { /* ignore preserved-state parse */ }
        }

        // Default redirect if no specific state was preserved.
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast.error(err.message || 'Authentication failed. Please try again.', { toastId: 'oauth-error' });
        navigate('/login', { 
          replace: true,
          state: { error: err.message }
        });
      }
    };

    handleOAuthCallback();
  }, [location.search, error, login, fetchUserData, navigate, redirect, token, userData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Completing Sign In
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we log you in...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;