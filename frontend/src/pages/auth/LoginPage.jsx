// src/pages/auth/LoginPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, X } from "lucide-react";
import { useUser } from "../../context/useUser";
import { toast } from "react-toastify";
import useBubbles from "../../hooks/useBubbles";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Support both Location object and string for `state.from`
  const rawFrom = location.state?.from;
  const from = typeof rawFrom === 'string' ? rawFrom : rawFrom?.pathname || "/";
  const errorParam = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  // ✅ Handle OAuth success redirects (skip if we already have an error in URL)
  const handleOAuthRedirect = useCallback(async () => {
    if (searchParams.get("error")) return; // avoid double-handling

    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (token && user) {
      try {
        // Parse the user data from the URL
        const parsedUser = JSON.parse(decodeURIComponent(user));

        // ✅ Use sessionStorage to isolate the OAuth login to the current tab
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(parsedUser));

        // Call the login function from UserContext with isOAuth flag
        await login(parsedUser, token, { isOAuth: true });

        // Clean up the URL by removing the token and user data
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Redirect admins to the admin dashboard; others to intended page unless it's admin-only
        if (parsedUser?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          const dest = from && !from.startsWith('/admin') && !from.startsWith('/login') ? from : '/';
          navigate(dest, { replace: true });
        }
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
        toast.error("Failed to process login. Please try again.", { toastId: "oauth-error" });
      }
    }
  }, [login, navigate, from, searchParams]);
  // ✅ Handle OAuth error messages (once) and success redirect
  useEffect(() => {
    if (errorParam) {
      const errorMessages = {
        google_auth_failed: "Google sign-in was canceled.",
        oauth_failed: "Google login failed. Please try again.",
        oauth_error: errorMessage || "An error occurred during login.",
        no_user: "No account found with this email. Please sign up first.",
        authentication_failed: "Authentication failed. Please try again.",
        invalid_state: "Session expired. Please try logging in again.",
        oauth_init_failed: "Failed to start OAuth process. Please try again.",
        session_expired: "Your session has expired. Please try logging in again.",
      };

      const message = errorMessages[errorParam] || (errorMessage || "An error occurred during login.");

      toast.error(message, { toastId: "oauth-error" });
      setError(message);

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("message");
      window.history.replaceState({}, document.title, url);
      return; // prevent calling handleOAuthRedirect in the same tick
    }

    // Handle success redirect if present
    handleOAuthRedirect();
  }, [errorParam, errorMessage, handleOAuthRedirect]);


  // ✅ Controlled input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validation
  const validateForm = () => {
    if (!formData.identifier.trim())
      return setError("Email or Username is required"), false;

    // If it looks like an email, validate format; otherwise allow username
    if (formData.identifier.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier))
        return setError("Please enter a valid email address"), false;
    }

    if (!formData.password) return setError("Password is required"), false;
    setError("");
    return true;
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // ✅ Normal login flow
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save in context + storage
      // ✅ Use sessionStorage to isolate login state to the current tab
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      login(data.user, data.token); // Update context

      toast.success("Login successful!");
      // Redirect admins to /admin; others to intended page unless it's admin-only
      if (data?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        const dest = from && !from.startsWith('/admin') && !from.startsWith('/login') ? from : '/';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err.message ||
        "Login failed. Please check your credentials and try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const bubbleOptions = useMemo(() => ({
    count: 20,
    sizeRange: [6, 16],
    durationRange: [10, 20],
    opacity: 0.18,
  }), []);

  // ✅ Bubbles background effect
  useBubbles("login-container", bubbleOptions);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden login-container">
        <div className="relative z-10 w-full max-w-md overflow-hidden border shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border-white/20 dark:border-gray-700/50">
          <Link
            to="/"
            className="absolute z-20 text-gray-500 transition-colors top-4 right-4 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="absolute w-40 h-40 rounded-full -top-20 -right-20 bg-pink-500/10 blur-3xl"></div>
          <div className="absolute w-40 h-40 rounded-full -bottom-20 -left-20 bg-blue-500/10 blur-3xl"></div>

          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-transparent text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Sign in to access your account
              </p>
            </div>

            {error && (
              <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/30">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <InputField
                label="Email or Username"
                name="identifier"
                type="text"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your email or username"
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                autoComplete="username"
              />
              <PasswordField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                show={showPassword}
                setShow={setShowPassword}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors duration-200 bg-purple-600 border border-transparent shadow-sm rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 -ml-1 animate-spin" />
                ) : (
                  <div className="flex items-center">
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </button>
              <div className="text-sm text-center">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Forgot password?
                  </Link>
              </div>
            </form>

            <div className="mt-6">
              <Divider text="Or continue with" />
              <div className="grid grid-cols-1 gap-4 mt-6">
                <OAuthButton />
              </div>
            </div>

            <div className="mt-8 text-sm text-center text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-purple-600 underline transition-colors duration-200 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== Reusable components ==================
function InputField({ label, name, value, onChange, placeholder, icon, type = "text", autoComplete }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {icon}
        </div>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="block w-full py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, show, setShow }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          placeholder="Enter your password"
          autoComplete="current-password"
          className="block w-full py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors duration-200 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function OAuthButton() {
  const handleClick = (e) => {
    e.preventDefault();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    // Use the full Google OAuth URL
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
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
        <span className="px-2 text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400">
          {text}
        </span>
      </div>
    </div>
  );
}
