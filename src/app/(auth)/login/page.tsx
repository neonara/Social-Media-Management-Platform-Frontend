"use client"; // Required for React hooks like useState & useRouter

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // For navigation
import { Eye, EyeOff } from "lucide-react";
import darkLogo from "@/assets/logos/logo_white.png";
import logo from "@/assets/logos/logo_black.png";
import { Checkbox } from "@/components/ui/FormElements/checkbox";
import InputGroup from "@/components/ui/FormElements/InputGroup";
import { EmailIcon } from "@/assets/icons";
import { loginUser } from "@/services/authService";
import { checkAuthStatus } from "@/utils/token";

export default function Login() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "", // Ensure consistent value
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "", // Ensure consistent value
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Error state
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const router = useRouter();

  // Check if the user is already authenticated when the component mounts
  useEffect(() => {
    async function checkAuthentication() {
      if (await checkAuthStatus()) {
        router.push("/");
      }
    }
    checkAuthentication();
  }, [router]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error on input change
  };

  // Handle login request
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the loginUser service function
      const result = await loginUser(data.email, data.password, data.remember);

      // Check if login was successful
      if (result.success) {
        // Redirect to dashboard
        router.push("/");
      } else {
        // Handle login errors
        setError(result.error || "Login failed. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      // Handle network or unexpected errors
      console.error("Login error:", error);
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          setError(
            "Network error. Please check your connection and try again.",
          );
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log("Navigating to /forgot_password");
    router.push("/forgot_password");
  };

  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="flex max-w-[1200px] flex-wrap items-center">
        {/* Left Side - Login Form */}
        <div className="w-full xl:w-1/2">
          <div className="w-full p-4 sm:p-12.5 xl:p-15">
            <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-black dark:text-white">
              Log In
            </h2>
            <form onSubmit={handleSubmit}>
              <InputGroup
                type="email"
                label="Email"
                className="mb-4 [&_input]:py-[15px]"
                placeholder="Enter your email"
                name="email"
                handleChange={handleChange}
                value={data.email}
                icon={<EmailIcon />}
              />

              <div className="mb-5">
                <label className="mb-2.5 block font-medium text-dark dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    name="password"
                    value={data.password}
                    onChange={handleChange}
                    className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent py-[15px] pl-5 pr-12 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

              <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
                <Checkbox
                  label="Remember me"
                  name="remember"
                  withIcon="check"
                  minimal
                  radius="md"
                  onChange={(e) =>
                    setData({
                      ...data,
                      remember: e.target.checked,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="hover:text-primary dark:text-white dark:hover:text-primary"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="mb-4.5">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
                  disabled={loading}
                >
                  Log In
                  {loading && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Welcome Message */}
        <div className="hidden w-full p-7.5 xl:block xl:w-1/2">
          <div className="custom-gradient-1 overflow-hidden rounded-2xl px-12.5 pb-36 pt-28 dark:!bg-dark-2 dark:bg-none">
            <Link className="mb-6 inline-block" href="/">
              <Image
                className="hidden dark:block"
                src={darkLogo}
                alt="Logo"
                width={176}
                height={32}
              />
              <Image
                className="dark:hidden"
                src={logo}
                alt="Logo"
                width={176}
                height={32}
              />
            </Link>

            <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
              Welcome Back!
            </h1>

            <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-6">
              Please sign in to your account by completing the necessary fields
              below.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
