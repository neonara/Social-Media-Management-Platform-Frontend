import axios from "axios";

// Define the base URL for your API
const BASE_URL = "http://localhost:8000/api"; // Update with your backend API URL

// Create an instance of axios with custom configurations (optional)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get all users (this can be customized for different roles, etc.)
export const getUsers = async () => {
  try {
    const response = await api.get("/users/");
    return response.data; // returns the user data
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error; // You can throw an error to be caught in the component
  }
};

