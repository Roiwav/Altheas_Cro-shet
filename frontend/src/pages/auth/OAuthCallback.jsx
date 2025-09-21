import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../context/useUser';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (error) {
          throw new Error(error);
        }

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Store the token and user data
        const userData = {
          token,
          userId: searchParams.get('userId'),
          email: searchParams.get('email'),
          name: searchParams.get('name'),
          avatar: searchParams.get('avatar')
        };

        login(userData);
        
        // Show success message
        toast.success('Successfully logged in!');
        
        // Redirect to the intended URL or home
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast.error(`Authentication failed: ${err.message}`);
        navigate('/login', { 
          replace: true,
          state: { error: err.message }
        });
      }
    };

    handleOAuthCallback();
  }, [token, error, redirect, navigate, login, searchParams]);

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