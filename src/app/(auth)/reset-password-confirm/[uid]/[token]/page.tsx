"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { resetPasswordConfirm } from "@/services/authService";
import Link from "next/link";

export default function ResetPasswordConfirmPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams(); // Get the parameters object

  const uid = Array.isArray(params.uid) ? params.uid[0] : params.uid;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  useEffect(() => {
    if (!uid || !token) {
      setError("Invalid reset link.");
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (!uid || !token) {
        throw new Error("Invalid reset link.");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const response = await resetPasswordConfirm(
        uid,
        token,
        newPassword,
        confirmPassword,
      );
      setMessage(response.message || "");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="w-full p-4 sm:p-12.5 xl:p-15">
        <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-black dark:text-white">
          Reset Your Password
        </h2>
        {message && <p className="mb-4 text-sm text-green-500">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {uid && token && !message && !error && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                className="block w-full rounded-md border border-gray-300 py-2 placeholder-gray-500 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary sm:text-sm"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="block w-full rounded-md border border-gray-300 py-2 placeholder-gray-500 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary sm:text-sm"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-primary p-2 text-white hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Go back to{" "}
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot Password
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
