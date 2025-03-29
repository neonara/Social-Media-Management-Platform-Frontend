export const loginUser = async (email: string, password: string) => {
  const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  const data = await response.json();

  // Store tokens securely
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);

  // Store user role
  localStorage.setItem("user_role", getUserRole(data));

  return data;
};

// Function to determine the user role
const getUserRole = (user: any) => {
  if (user.is_administrator) return "administrator";
  if (user.is_moderator) return "moderator";
  if (user.is_community_manager) return "community_manager";
  if (user.is_client) return "client";
  return "unknown";
};
