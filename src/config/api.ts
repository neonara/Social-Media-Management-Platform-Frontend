// API Base URL - automatically detects environment
export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "http://backend:8000/api" // Docker service name
    : "http://localhost:8000/api"; // Development
