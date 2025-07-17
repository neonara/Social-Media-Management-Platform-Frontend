"use server";

import { cookies } from "next/headers";
import { API_BASE_URL } from "@/config/api";

export interface TokenValidationResult {
  isValid: boolean;
  user?: {
    id: number;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    roles: {
      is_administrator: boolean;
      is_superadministrator: boolean;
      is_moderator: boolean;
      is_community_manager: boolean;
      is_client: boolean;
    };
  };
  error?: string;
}

export interface RoleValidationResult {
  hasAccess: boolean;
  userRoles: string[];
  error?: string;
}

/**
 * Validates JWT token with the backend server to ensure it's not tampered with
 * This replaces simple jwt.decode() with actual server verification
 */
export async function validateTokenWithServer(): Promise<TokenValidationResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return {
        isValid: false,
        error: "No access token found",
      };
    }

    // Call backend to validate token and get user info
    const response = await fetch(`${API_BASE_URL}/auth/validate-token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    if (!response.ok) {
      // Clear invalid token
      cookieStore.delete("access_token");
      await clearRoleCookies();

      return {
        isValid: false,
        error: `Token validation failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      isValid: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Validates user roles by checking with backend instead of trusting cookies
 */
export async function validateUserRoles(
  requiredRoles: string[],
): Promise<RoleValidationResult> {
  try {
    const tokenValidation = await validateTokenWithServer();

    if (!tokenValidation.isValid || !tokenValidation.user) {
      return {
        hasAccess: false,
        userRoles: [],
        error: "Token validation failed",
      };
    }

    const user = tokenValidation.user;
    const userRoles: string[] = [];

    // Map backend role flags to role strings
    if (user.roles.is_superadministrator) userRoles.push("super_administrator");
    if (user.roles.is_administrator) userRoles.push("administrator");
    if (user.roles.is_moderator) userRoles.push("moderator");
    if (user.roles.is_community_manager) userRoles.push("community_manager");
    if (user.roles.is_client) userRoles.push("client");

    // Check if user has any of the required roles
    const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

    return {
      hasAccess,
      userRoles,
    };
  } catch (error) {
    console.error("Role validation error:", error);
    return {
      hasAccess: false,
      userRoles: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown role validation error",
    };
  }
}

/**
 * Secure authentication check that validates with backend
 */
export async function isAuthenticated(): Promise<boolean> {
  const result = await validateTokenWithServer();
  return result.isValid;
}

/**
 * Check if user has admin privileges (administrator or super_administrator)
 */
export async function isUserAdmin(): Promise<boolean> {
  const roleValidation = await validateUserRoles([
    "administrator",
    "super_administrator",
  ]);
  return roleValidation.hasAccess;
}

/**
 * Check if user has moderator privileges
 */
export async function isUserModerator(): Promise<boolean> {
  const roleValidation = await validateUserRoles(["moderator"]);
  return roleValidation.hasAccess;
}

/**
 * Check if user has community manager privileges
 */
export async function isUserCommunityManager(): Promise<boolean> {
  const roleValidation = await validateUserRoles(["community_manager"]);
  return roleValidation.hasAccess;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const roleValidation = await validateUserRoles([role]);
  return roleValidation.hasAccess;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const roleValidation = await validateUserRoles(roles);
  return roleValidation.hasAccess;
}

/**
 * Get user's current roles from backend
 */
export async function getUserRoles(): Promise<string[]> {
  const roleValidation = await validateUserRoles([
    "super_administrator",
    "administrator",
    "moderator",
    "community_manager",
    "client",
  ]);
  return roleValidation.userRoles;
}

/**
 * Clear all role-related cookies (used when token is invalid)
 */
async function clearRoleCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("is_administrator");
  cookieStore.delete("is_superadministrator");
  cookieStore.delete("is_moderator");
  cookieStore.delete("is_community_manager");
  cookieStore.delete("is_client");
  cookieStore.delete("refresh_token");
  cookieStore.delete("csrftoken");
}

/**
 * Secure token refresh that validates with backend
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      // Clear invalid refresh token
      await clearRoleCookies();
      return false;
    }

    const data = await response.json();

    // Set new access token
    cookieStore.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    return false;
  }
}

/**
 * Logout user and clear all authentication data
 */
export async function secureLogout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (refreshToken) {
      // Notify backend to invalidate token
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
    }

    // Clear all authentication cookies
    cookieStore.delete("access_token");
    clearRoleCookies();
  } catch (error) {
    console.error("Logout error:", error);
    // Clear cookies even if backend call fails
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    await clearRoleCookies();
  }
}
