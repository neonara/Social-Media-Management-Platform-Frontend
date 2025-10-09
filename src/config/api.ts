// API Base URL - uses environment variables with fallbacks
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"; // Always use localhost for testing
