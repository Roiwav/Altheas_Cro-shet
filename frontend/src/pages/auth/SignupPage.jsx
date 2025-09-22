import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react";
import { useUser } from "../../context/useUser";
import { toast } from "react-toastify";
import axios from "axios";
import useBubbles from "../../hooks/useBubbles";

// Axios defaults
axios.defaults.withCredentials = true;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const API_URL = `${API_BASE_URL}/api/v1/auth`;

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useUser();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { fullName, username, email, password, confirmPassword } = formData;
    if (!fullName || !username || !email || !password || !confirmPassword) {
      toast.error("Please fill out all required fields.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    if (!agreed) {
      toast.error("You must agree to the Terms & Privacy Policy.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // Call register endpoint
      const { data } = await axios.post(`${API_URL}/register`, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (!data || !data.user || !data.token) {
        throw new Error("Registration failed. Please try again.");
      }

      // ✅ Auto-login: store token & set user
      login(data.token);
      toast.success("Welcome! Your account has been created.");
      navigate("/", { replace: true }); // send to home/dashboard

    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Registration failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  const handleOAuthRedirect = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("userId");
    const error = params.get("error");

    if (error) {
      toast.error(`OAuth error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userId) {
      login(token);
      toast.success("Successfully logged in!");
      const redirectUrl = params.get("redirect") || "/";
      navigate(redirectUrl, { replace: true });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login, navigate]);

  useEffect(() => {
    handleOAuthRedirect();
  }, [handleOAuthRedirect]);

  // Bubbles background effect
  useBubbles("signup-container", { count: 20, sizeRange: [6, 16], durationRange: [10, 20], opacity: 0.18 });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 relative overflow-hidden signup-container">
      <div className="w-full max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50 relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Join us today and start your journey
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <InputField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              placeholder="Enter your fullname"
              icon={<User className="h-5 w-5 text-gray-400" />}
              onChange={handleChange}
            />
            <InputField
              label="Username"
              name="username"
              value={formData.username}
              placeholder="Enter your username"
              icon={<User className="h-5 w-5 text-gray-400" />}
              onChange={handleChange}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              placeholder="Enter your email"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              onChange={handleChange}
            />
            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              show={showPassword}
              setShow={setShowPassword}
              onChange={handleChange}
            />
            <PasswordField
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
              onChange={handleChange}
            />

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor="terms"
                className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                I agree to the{" "}
                <Link
                  to="/data-policy"
                  className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Data Policy
                </Link>{" "}
                and{" "}
                <Link
                  to="/service-terms"
                  className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Service Terms
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <button
              onClick={() => handleOAuthLogin("google")}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 mt-6"
            >
              {/* Google SVG */}
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
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

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Reusable InputField
function InputField({ label, name, value, placeholder, icon, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="block w-full pl-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>
    </div>
  );
}

// Reusable PasswordField
function PasswordField({ label, name, value, show, setShow, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••"
          className="block w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
