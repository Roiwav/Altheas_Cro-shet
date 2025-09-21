import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import { useUser } from "../../context/useUser";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";


export default function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const errorParam = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  // Handle OAuth errors and success from the URL
  useEffect(() => {
    // Clear any existing error messages
    if (error) setError('');

    // Handle OAuth errors
    if (errorParam) {
      const errorMessages = {
        'oauth_failed': 'Google login failed. Please try again.',
        'oauth_error': errorMessage || 'An error occurred during login.',
        'no_user': 'No account found with this email. Please sign up first.',
        'authentication_failed': 'Authentication failed. Please try again.',
        'invalid_state': 'Session expired. Please try logging in again.',
        'oauth_init_failed': 'Failed to start OAuth process. Please try again.',
        'session_expired': 'Your session has expired. Please try logging in again.'
      };
      
      const message = errorMessages[errorParam] || 'An error occurred during login.';
      
      // Only show error if it's not already being shown
      if (error !== message) {
        toast.error(message);
        setError(message);
      }
      
      // Clear the error from URL to prevent showing it again on refresh
      const url = new URL(window.location.href);
      if (url.searchParams.has('error') || url.searchParams.has('message')) {
        url.searchParams.delete('error');
        url.searchParams.delete('message');
        window.history.replaceState({}, document.title, url);
      }
    }
  }, [errorParam, errorMessage, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) return setError("Email is required"), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return setError("Please enter a valid email address"), false;
    }
    if (!formData.password) return setError("Password is required"), false;
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || "Login failed");
      }

      // Store the token if remember me is checked
      if (rememberMe && data.token) {
        localStorage.setItem("token", data.token);
      }

      // Update user context
      login(data.user);
      
      // Show success message
      toast.success("Login successful!");
      
      // Redirect to the intended page or home
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.message || "Login failed. Please check your credentials and try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Store the current path to redirect back after login
      const redirectPath = from === "/" ? "" : from;
      
      // Create a secure state object with timestamp
      const stateObj = {
        path: redirectPath,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2, 15)
      };
      
      // Encode the state to prevent tampering
      const state = btoa(JSON.stringify(stateObj));
      
      // Store the state in sessionStorage to verify it later
      sessionStorage.setItem('oauth_state', state);
      
      // Redirect to the selected OAuth provider
      if (provider === 'google') {
        // Clear any existing OAuth state from URL if present
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('message');
        window.history.replaceState({}, document.title, cleanUrl.toString());
        
        // Redirect to the OAuth provider
        window.location.href = `${API_URL}/auth/google?state=${encodeURIComponent(state)}`;
      } else if (provider === 'facebook') {
        window.location.href = `${API_URL}/auth/facebook?state=${encodeURIComponent(state)}`;
      }
    } catch (err) {
      console.error('Error initiating OAuth:', err);
      toast.error('Failed to start login process. Please try again.');
    }
  };

  useEffect(() => {
    const container = document.querySelector(".login-container");
    const createParticle = () => {
      const particle = document.createElement("div");
      const size = Math.random() * 10 + 5;
      particle.className = "absolute rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-20";
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
      container?.appendChild(particle);
    };
    for (let i = 0; i < 15; i++) createParticle();

    return () => container?.querySelectorAll("div").forEach(el => el.style.animation?.includes("float") && el.remove());
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes float {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-1000px) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 relative overflow-hidden login-container">
      <div className="w-full max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50 relative">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to access your account
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
            />
            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              show={showPassword}
              setShow={setShowPassword}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700/50 transition-colors duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              ) : (
                <div className="flex items-center">
                  <span>Sign in</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-6">
            <Divider text="Or continue with" />
            <div className="mt-6 grid grid-cols-1 gap-4">
              <OAuthButton 
                provider="google" 
                onClick={() => handleOAuthLogin('google')}
              />
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-200">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable components
function InputField({ label, name, value, onChange, placeholder, icon, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, show, setShow }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          placeholder="Enter your password"
          className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function OAuthButton({ provider, onClick }) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onClick(provider)}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{text}</span>
      </div>
    </div>
  );
}
