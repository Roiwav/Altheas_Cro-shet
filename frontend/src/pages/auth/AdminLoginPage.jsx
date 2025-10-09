// src/pages/auth/AdminLoginPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, Shield, Clock } from "lucide-react";
import { useUser } from "../../context/useUser";
import { toast } from "react-toastify";
import useBubbles from "../../hooks/useBubbles";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";

// Constants for login attempt limiting
const LOGIN_ATTEMPTS_KEY = 'adminLoginAttempts';
const LOGIN_BLOCK_UNTIL_KEY = 'adminLoginBlockUntil';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5* 60 * 1000; // 5 minutes

export default function AdminLoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);

  const from = location.state?.from?.pathname || "/admin";
  const errorParam = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  // Handle OAuth success redirects specifically for admins
  const handleOAuthRedirect = useCallback(async () => {
    if (searchParams.get("error")) return;

    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));

        // CRITICAL: Reject non-admin users
        if (parsedUser?.role !== 'admin') {
          toast.error("Access Denied. This login is for administrators only.");
          navigate('/admin/login', { replace: true });
          return;
        }

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(parsedUser));
        await login(parsedUser, token, { isOAuth: true });

        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        navigate('/admin', { replace: true });
      } catch (error) {
        console.error("Error processing Admin OAuth callback:", error);
        toast.error("Failed to process admin login. Please try again.", { toastId: "admin-oauth-error" });
      }
    }
  }, [login, navigate, searchParams]);

  useEffect(() => {
    if (errorParam) {
      const message = errorMessage || "An error occurred during login.";
      toast.error(message, { toastId: "admin-oauth-error" });
      setError(message);

      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("message");
      window.history.replaceState({}, document.title, url);
      return;
    }
    handleOAuthRedirect();
  }, [errorParam, errorMessage, handleOAuthRedirect]);

  // Check for login block on component mount
  useEffect(() => {
    const blockUntil = parseInt(localStorage.getItem(LOGIN_BLOCK_UNTIL_KEY), 10);
    if (blockUntil && blockUntil > Date.now()) {
      setIsBlocked(true);
      setBlockTime(blockUntil);

      const timer = setTimeout(() => {
        setIsBlocked(false);
        localStorage.removeItem(LOGIN_BLOCK_UNTIL_KEY);
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      }, blockUntil - Date.now());

      return () => clearTimeout(timer);
    }
  }, []);

  const getRemainingBlockTime = () => {
    return Math.ceil((blockTime - Date.now()) / 60000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) return setError("Email or Username is required"), false;
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
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Login failed");

      // CRITICAL: Reject non-admin users
      if (data?.user?.role !== 'admin') {
        throw new Error("Access Denied. You do not have administrator privileges.");
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token);
      
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      localStorage.removeItem(LOGIN_BLOCK_UNTIL_KEY);

      toast.success("Admin login successful!");
      navigate(from, { replace: true });

    } catch (err) {
      console.error("Admin Login error:", err);
      const errorMessage = err.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error(errorMessage);

      // Handle failed login attempt
      let attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY), 10) || 0;
      attempts++;

      if (attempts >= MAX_ATTEMPTS) {
        const newBlockUntil = Date.now() + BLOCK_DURATION_MS;
        localStorage.setItem(LOGIN_BLOCK_UNTIL_KEY, newBlockUntil);
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        setIsBlocked(true);
        setBlockTime(newBlockUntil);
      } else {
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bubbleOptions = useMemo(() => ({
    count: 20, sizeRange: [6, 16], durationRange: [10, 20], opacity: 0.1,
  }), []);

  useBubbles("admin-login-container", bubbleOptions);

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden admin-login-container">
        <div className="relative z-10 w-full max-w-md overflow-hidden border shadow-2xl bg-gray-800/70 backdrop-blur-lg rounded-2xl border-gray-700/50">
          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Admin Portal
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Please sign in to manage the dashboard
              </p>
            </div>

            {error && (
              <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-900/30">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            
            {isBlocked && (
              <div className="p-4 mb-6 text-center border-l-4 border-yellow-500 rounded-lg bg-yellow-900/30">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-300" />
                  <p className="text-sm text-yellow-300">
                    Too many failed attempts. Please try again in {getRemainingBlockTime()} minute(s).
                  </p>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <InputField
                label="Email or Username"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your admin credentials"
                disabled={isBlocked}
                icon={<Mail className="w-5 h-5 text-gray-400" />}
              />
              <PasswordField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                show={showPassword}
                setShow={setShowPassword}
                disabled={isBlocked}
              />
              <button
                type="submit"
                disabled={isLoading || isBlocked}
                className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors duration-200 bg-purple-600 border border-transparent shadow-sm rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 -ml-1 animate-spin" />
                ) : (
                  <div className="flex items-center">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </button>
              <div className="text-sm text-center">
                  <Link
                    to="/forgot-password?from=admin"
                    className="font-medium text-purple-400 hover:text-purple-300"
                  >
                    Forgot password?
                  </Link>
              </div>
            </form>

            <div className="mt-6 text-sm text-center text-gray-500">
              Return to <Link to="/" className="font-medium text-purple-400 underline hover:text-purple-300">main site</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable components (dark-theme adapted)
function InputField({ label, name, value, onChange, placeholder, icon, disabled }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-300">{label}</label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{icon}</div>
        <input
          name={name}
          type="text"
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full py-3 pl-10 pr-3 text-white placeholder-gray-400 transition-all duration-200 border border-gray-700 rounded-xl bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, show, setShow, disabled }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-300">{label}</label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Lock className="w-5 h-5 text-gray-400" /></div>
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          placeholder="Enter your password"
          disabled={disabled}
          className="block w-full py-3 pl-10 pr-10 text-white placeholder-gray-400 transition-all duration-200 border border-gray-700 rounded-xl bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors duration-200 hover:text-gray-300"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}