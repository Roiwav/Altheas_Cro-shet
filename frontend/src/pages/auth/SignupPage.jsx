// src/pages/auth/SignupPage.jsx (ALTERNATIVE - no auto-login, redirect to login with preserved state)
import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, User, Mail, Lock, X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import useBubbles from "../../hooks/useBubbles";

// Axios defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const API_URL = `${API_BASE_URL}/api/v1/auth`;

/**
 * Renders the user registration (sign-up) page.
 * It allows new users to create an account with standard credentials or via Google OAuth.
 * It also handles preserving cart state if the user signs up during a checkout flow.
 *
 * @component
 */
export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get navigation state (cart info from shop/cart pages)
  const fromCart = location.state?.from?.includes('cart') || false;
  const fromShop = location.state?.from?.includes('shop') || false;
  const cartData = location.state?.cartItems || null;
  const productData = location.state?.product || null;

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

  /**
   * Handles changes to form input fields.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
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

  /**
   * Handles the form submission for creating a new account.
   * After successful registration, it preserves any existing cart state and redirects to the login page.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      // Special case: Determine if the user is signing up with admin credentials.
      let role = "customer";
      if (
        formData.username === "admin" &&
        formData.email === "altheascroshet@gmail.com" &&
        formData.password === "admin123"
      ) {
        role = "admin";
      }

      // Log context for debugging cart preservation.
      console.log(" Signing up user with cart context:", { 
        fromCart, 
        fromShop, 
        hasCartData: !!cartData, 
        hasProductData: !!productData,
        cartItemCount: cartData?.length || 0
      });

      // Call register endpoint
      const registerResponse = await axios.post(`${API_URL}/register`, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: role,
      });

      if (!registerResponse.data) {
        throw new Error("Registration failed. Please try again.");
      }

      toast.success("Account created successfully! Please sign in to access your cart.");

      // Preserve cart state in sessionStorage to be picked up after login.
      if ((cartData && cartData.length > 0) || productData) {
        const cartStateToPreserve = {
          from: location.state.from,
          cartItems: cartData,
          product: productData,
          email: formData.email, // Pre-fill email on login page
          timestamp: Date.now(),
          preserveCart: true // Flag to indicate cart should be preserved
        };
        
        sessionStorage.setItem('signup-cart-state', JSON.stringify(cartStateToPreserve));
        console.log(" Cart state preserved in sessionStorage for login");
      }

      // Redirect to the login page, passing along state to pre-fill email and show a success message.
      navigate("/login", { 
        state: {
          ...location.state, // Preserve original navigation state
          fromSignup: true,
          email: formData.email, // Pre-fill email
          successMessage: (cartData && cartData.length > 0) 
            ? `Account created! Sign in to access your ${cartData.length} cart items.`
            : "Account created successfully! Please sign in."
        },
        replace: true 
      });

    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Registration failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates the Google OAuth login flow.
   * It preserves cart state in sessionStorage before redirecting to the Google auth endpoint.
   */
  const handleOAuthLogin = (provider) => {
    if ((cartData && cartData.length > 0) || productData) {
      const cartStateToPreserve = {
        from: location.state.from,
        cartItems: cartData,
        product: productData,
        timestamp: Date.now(),
        preserveCart: true
      };
      
      sessionStorage.setItem('oauth-cart-state', JSON.stringify(cartStateToPreserve));
    }

    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  const bubbleOptions = useMemo(() => ({
    count: 20,
    sizeRange: [6, 16],
    durationRange: [10, 20],
    opacity: 0.18,
  }), []);

  useBubbles("signup-container", bubbleOptions);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden signup-container">
        <div className="relative z-10 w-full max-w-md overflow-hidden border shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border-white/20 dark:border-gray-700/50">
          <Link
            to="/"
            className="absolute z-20 text-gray-500 transition-colors top-4 right-4 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-transparent text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
                Create Account
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {fromCart ? "Join us to save your cart items!" : "Join us today and start your journey"}
              </p>
              
              {/* ✅ Show cart context to user */}
              {(fromCart || fromShop) && (
                <div className="p-3 mt-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <p className="mb-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                    🛒 Cart Items Ready
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {cartData?.length > 0 && `Your ${cartData.length} items will be waiting after you sign in`}
                    {productData && "Your selected product will be ready for checkout"}
                    {!cartData && !productData && "Your cart items will be preserved"}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/30">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <InputField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                placeholder="Enter your fullname"
                icon={<User className="w-5 h-5 text-gray-400" />}
                onChange={handleChange}
              />
              <InputField
                label="Username"
                name="username"
                value={formData.username}
                placeholder="Enter your username"
                icon={<User className="w-5 h-5 text-gray-400" />}
                onChange={handleChange}
              />
              <InputField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                placeholder="Enter your email"
                icon={<Mail className="w-5 h-5 text-gray-400" />}
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="terms"
                  className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  I agree to the{" "}
                  <Link
                    to="/service-terms"
                    className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Service Terms
                  </Link>{" "}
                  of Althea's Crochet{" "}
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <button
                onClick={() => handleOAuthLogin("google")}
                type="button"
                className="flex items-center justify-center w-full gap-3 px-4 py-3 mt-6 text-sm font-medium text-gray-700 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {/* Google SVG */}
                <svg
                  className="w-5 h-5"
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
                <span>Sign Up with Google</span>
              </button>

              <div className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  state={{
                    ...location.state, // Preserve original navigation state
                    email: formData.email // Pre-fill email if they've started typing
                  }}
                  className="font-medium text-purple-600 underline hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A reusable input field component for the sign-up form.
 * @param {object} props - The component props.
 * @param {string} props.label - The label for the input field.
 * @param {string} props.name - The name attribute for the input.
 * @param {string} props.value - The current value of the input.
 * @param {string} props.placeholder - The placeholder text.
 * @param {React.ReactNode} props.icon - The icon to display inside the input.
 * @param {function} props.onChange - The change handler for the input.
 * @param {string} [props.type="text"] - The input type.
 */
function InputField({
  label,
  name,
  value,
  placeholder,
  icon,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {icon}
        </div>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="block w-full py-3 pl-10 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-xl dark:border-gray-700 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 dark:text-white dark:placeholder-gray-400"
        />
      </div>
    </div>
  );
}

/**
 * A reusable password field component with a show/hide toggle for the sign-up form.
 * @param {object} props - The component props.
 * @param {string} props.label - The label for the input field.
 * @param {string} props.name - The name attribute for the input.
 * @param {string} props.value - The current value of the input.
 * @param {boolean} props.show - Whether the password is currently visible.
 * @param {function} props.setShow - Function to toggle password visibility.
 * @param {function} props.onChange - The change handler for the input.
 */
function PasswordField({ label, name, value, show, setShow, onChange }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••"
          className="block w-full py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-xl dark:border-gray-700 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 dark:text-white dark:placeholder-gray-400"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}