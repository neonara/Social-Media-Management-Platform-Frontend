"use client";

import { useEffect } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Unhandled error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-red-600">
          Something went wrong
        </h2>

        <p className="mb-6 text-gray-700">
          {process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : error.message || "An unexpected error occurred"}
          {error.digest && process.env.NODE_ENV !== "production" && (
            <span className="mt-2 block text-xs text-gray-500">
              Error ID: {error.digest}
            </span>
          )}
        </p>

        <div className="flex justify-center">
          <button
            onClick={reset}
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
