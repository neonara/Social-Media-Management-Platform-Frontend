"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/services/authService';
import Link from 'next/link';
import { EmailIcon } from '@/assets/icons'; // You can still use the icon if you want to render it separately

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="w-full p-4 sm:p-12.5 xl:p-15">
        <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-black dark:text-white">
          Forgot Password
        </h2>
        {message && <p className="mb-4 text-sm text-green-500">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="email"
                id="email"
                className="block w-full py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                placeholder="Enter your registered email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {/* You can still position the icon if you have styling for it */}
              {/* <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <EmailIcon className="h-5 w-5 text-gray-400" />
              </div> */}
            </div>
          </div>
          <div className="mb-4.5">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}