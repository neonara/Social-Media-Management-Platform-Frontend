"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type CreateUserData = {
  email: string;
  role: string;
};

// This function now returns data for the client to store
export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch("http://localhost:8000/api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Invalid email or password");
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

    const response = await fetch("http://localhost:8000/api/auth/register/", {
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
