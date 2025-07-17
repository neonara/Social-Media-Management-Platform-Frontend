"use client";

import {
  validateTokenWithServer,
  validateUserRoles,
  secureLogout,
} from "@/utils/secureAuth";

/**
 * Client-side wrapper for token validation
 * This calls the server action safely from client components
 */
export async function clientValidateToken() {
  try {
    return await validateTokenWithServer();
  } catch (error) {
    console.error("Client token validation error:", error);
    return {
      isValid: false,
      error: "Token validation failed",
    };
  }
}

/**
 * Client-side wrapper for role validation
 */
export async function clientValidateRoles(requiredRoles: string[]) {
  try {
    return await validateUserRoles(requiredRoles);
  } catch (error) {
    console.error("Client role validation error:", error);
    return {
      hasAccess: false,
      userRoles: [],
      error: "Role validation failed",
    };
  }
}

/**
 * Client-side wrapper for logout
 */
export async function clientSecureLogout() {
  try {
    await secureLogout();
  } catch (error) {
    console.error("Client logout error:", error);
  }
}

/**
 * Helper functions for common checks
 */
export async function isAuthenticated(): Promise<boolean> {
  const result = await clientValidateToken();
  return result.isValid;
}

export async function isAdmin(): Promise<boolean> {
  const result = await clientValidateRoles([
    "administrator",
    "super_administrator",
  ]);
  return result.hasAccess;
}

export async function isModerator(): Promise<boolean> {
  const result = await clientValidateRoles([
    "moderator",
    "administrator",
    "super_administrator",
  ]);
  return result.hasAccess;
}

export async function isCommunityManager(): Promise<boolean> {
  const result = await clientValidateRoles([
    "community_manager",
    "moderator",
    "administrator",
    "super_administrator",
  ]);
  return result.hasAccess;
}

export async function hasRole(role: string): Promise<boolean> {
  const result = await clientValidateRoles([role]);
  return result.hasAccess;
}

export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const result = await clientValidateRoles(roles);
  return result.hasAccess;
}
