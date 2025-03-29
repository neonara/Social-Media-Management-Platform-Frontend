"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation"; // For navigation
import darkLogo from "@/assets/logos/logo_white.png";
import logo from "@/assets/logos/logo_black.png";
import { Checkbox } from "@/components/FormElements/checkbox";
import InputGroup from "@/components/FormElements/InputGroup";
import { EmailIcon, PasswordIcon } from "@/assets/icons";

export default function SignIn() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Error state
  const router = useRouter();

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
      const response = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
        credentials: "include", // Include cookies if needed
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || "Login failed. Please try again.");
        return;
      }

      // Clear existing tokens from localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // Store tokens securely in localStorage
      localStorage.setItem("access_token", responseData.access_token);
      localStorage.setItem("refresh_token", responseData.refresh_token);

      // Redirect to reset password page with email in the URL
      router.push(
        `/first-reset-password?email=${encodeURIComponent(data.email)}`,
      );
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="flex flex-wrap items-center">
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

              <InputGroup
                type="password"
                label="Password"
                className="mb-5 [&_input]:py-[15px]"
                placeholder="Enter your password"
                name="password"
                handleChange={handleChange}
                value={data.password}
                icon={<PasswordIcon />}
              />

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

                <Link
                  href="/auth/forgot-password"
                  className="hover:text-primary dark:text-white dark:hover:text-primary"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="mb-4.5">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
                  disabled={loading}
                >
                  Log In
                  {loading && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p>
                Don’t have an account?{" "}
                <Link href="/auth/sign-up" className="text-primary">
                  Sign Up
                </Link>
              </p>
            </div>
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
