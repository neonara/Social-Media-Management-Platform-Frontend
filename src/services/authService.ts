"use server";

import { API_BASE_URL } from "@/config/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type CreateUserData = {
  email: string;
  role: string;
};

// This function now returns data for the client to store
export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 403) {
        throw new Error(errorData.message || "Authorization failed. Please check your credentials or account status.");
      } else {
        throw new Error(errorData.message || "Invalid email or password");
      }
    }

    const data = await response.json();
    console.log("API response:", data);

    // Extract tokens and user roles from the response
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    // Extract role booleans
    const isAdmin = data.is_administrator || false;
    const isModerator = data.is_moderator || false;
    const isCommunityManager = data.is_community_manager || false;
    const isClient = data.is_client || false;

    // Set secure cookies on the server side (these will be HTTP-only)
    const cookieStore = await cookies();

    // Set access token cookie (HTTP-only, Secure in production)
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    // Set refresh token cookie (HTTP-only, Secure in production)
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set role cookies
    cookieStore.set("is_administrator", String(isAdmin), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    cookieStore.set("is_moderator", String(isModerator), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    cookieStore.set("is_community_manager", String(isCommunityManager), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    cookieStore.set("is_client", String(isClient), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    // Return the tokens and user role for client-side storage
    return {
      success: true,
      profile: data.profile || {},
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Server action to check if user is admin
export async function isUserAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("is_administrator")?.value === "true";
}

// Modified to use localStorage instead of cookies
export async function createUser(data: CreateUserData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || "Failed to create user" };
    }

    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "An error occurred while creating user" };
  }
}

// Server action for logout
export async function logout() {
  const cookieStore = await cookies();

  // Clear all auth cookies
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");

  // Clear all role cookies
  cookieStore.delete("is_administrator");
  cookieStore.delete("is_moderator");
  cookieStore.delete("is_community_manager");
  cookieStore.delete("is_client");

  // Since this is a server action, we use redirect
  redirect("/login");
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend error response:", errorData);
      throw new Error(errorData.message || 'Failed to send reset email');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Forgot password error:', error);
    throw error;
  }
}

export async function resetPasswordConfirm(
  uid: string,
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
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

    const response = await fetch(`${API_BASE_URL}/reset-password-confirm/${uid}/${token}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        new_password: newPassword,
        confirm_password: confirmPassword, // Include confirm_password field
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend error response:", errorData);
      throw new Error(errorData.message || "Failed to reset password.");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Reset password error:", error);
    throw error;
  }
}