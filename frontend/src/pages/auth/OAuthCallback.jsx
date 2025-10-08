// frontend/src/pages/auth/OAuthCallback.jsx
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/useUser';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

// Helpers for robust user parsing without lint errors
const tryJSON = (str) => {
  try { return JSON.parse(str); } catch { return null; }
};
const safe = (fn) => { try { return fn(); } catch { return null; } };
const parseUserParam = (raw) => {
  if (!raw) return null;
  return (
    tryJSON(raw) ||
    safe(() => tryJSON(decodeURIComponent(raw))) ||
    safe(() => tryJSON(atob(raw)))
  );
};

const OAuthCallback = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRunRef = useRef(false);
  
  // Get the full URL with the token
  const { search } = location;
  const params = new URLSearchParams(search);
  const token = params.get('token');
  const userData = params.get('user');
  const error = params.get('error');
  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    // Guard for dev StrictMode double-invoke and re-mounts
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

        // Update the auth context
        await login(parsed, token, { isOAuth: true });
        
        // Show success message once
        toast.success('Successfully logged in with Google!', { toastId: 'oauth-success' });
        
        // Admins go straight to the admin dashboard
        if (parsed?.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }

        // If signup preserved cart state exists, restore flow specific redirect
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
        // Default redirect for non-admins when no preserved state
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
  }, [location.search, error, login, navigate, redirect, token, userData]);

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