"use client";

import { validatePasswordStrength } from "@/services/password";
// import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { firstResetPassword } from "@/services/authService";

export default function FirstResetPasswordWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FirstResetPassword />
    </Suspense>
  );
}

function FirstResetPassword() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [tempPassword, setTempPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setError(""); // Clear errors before making the API call

    try {
      console.log("Calling authService.firstResetPassword", {
        email,
        password: tempPassword,
        new_password: password,
      });

      // If you have a CSRF token available in your app, pass it here
      const csrfToken = (window as any)?.csrfToken ?? null;

      const result = await firstResetPassword({
        email,
        password: tempPassword,
        new_password: password,
        csrfToken,
      });

      if (!result.ok) {
        console.error("Response error:", result.data);
        setError(
          result.data.password?.[0] ||
            result.data.email?.[0] ||
            "Something went wrong",
        );
        return;
      }

      setSuccess(true);
      setError(""); // Ensure error is cleared on success
    } catch (err) {
      console.error("Request failed:", err);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <>
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card sm:w-[60%] lg:w-1/2">
        <div className="flex flex-wrap items-center">
          <div className="w-full">
            <div className="w-full p-4 sm:p-8 xl:p-10">
              {success ? (
                <div className="text-center">
                  <div className="text-success-500 mb-4 text-4xl">✓</div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Password Reset Successfully
                  </h2>
                  <p className="mb-6">
                    Your password has been reset. You can now login with your
                    new password.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90"
                  >
                    Go to Login
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-black dark:text-white">
                    Create Your Password
                  </h2>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="dark:border-form-strokedark dark:bg-form-input w-full rounded-md border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:focus:border-primary"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Enter your temporary password"
                        className="dark:border-form-strokedark dark:bg-form-input w-full rounded-md border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:focus:border-primary"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="mb-2.5 block font-medium text-black dark:text-white">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="dark:border-form-strokedark dark:bg-form-input w-full rounded-md border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:focus:border-primary"
                        required
                      />
                    </div>

                    <div className="mb-6">
                      <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="dark:border-form-strokedark dark:bg-form-input w-full rounded-md border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:focus:border-primary"
                        required
                      />
                    </div>

                    {error && (
                      <div className="mb-6 rounded-md bg-red-50 p-3 text-red-500 dark:bg-red-500/10">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="flex w-full justify-center rounded bg-primary p-4 font-medium text-white"
                    >
                      Set Password
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
