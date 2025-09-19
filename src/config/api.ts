// API Base URL - uses environment variables with fallbacks
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"; // Always use localhost for testing

// Export server-side only API URL that doesn't rely on NEXT_PUBLIC_ prefix
// This is important for server components that need to make API calls
export const SERVER_API_URL =
  process.env.API_URL || "http://localhost:8000/api"; // Always use localhost for testing
