// API Base URL - uses environment variables with fallbacks
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === "production"
    ? "http://backend:8000/api" // Docker service name in production
    : "http://localhost:8000/api"); // Development

// Export server-side only API URL that doesn't rely on NEXT_PUBLIC_ prefix
// This is important for server components that need to make API calls
export const SERVER_API_URL = 
  process.env.API_URL ||
  (process.env.NODE_ENV === "production" 
    ? "http://backend:8000/api" 
    : "http://localhost:8000/api");
