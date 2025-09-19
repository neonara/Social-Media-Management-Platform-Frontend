"use client";

import {
  validateTokenWithServer,
  validateUserRoles,
  secureLogout,
} from "@/utils/secureAuth";
import { tokenValidationCache } from "@/utils/tokenValidationCache";
import { getToken } from "@/utils/token";

/**
 * Client-side wrapper for token validation with caching
 * This calls the server action safely from client components
 */
export async function clientValidateToken() {
  try {
    const token = await getToken();
    if (!token) {
      return {
        isValid: false,
        error: "No token found",
      };
    }

    // Check cache first
    const cachedResult = tokenValidationCache.getCachedValidation(token);
    if (cachedResult) {
      return cachedResult;
    }

    // If not cached, validate with server
    console.log("Validating token with server (cache miss)");
    const result = await validateTokenWithServer();

    // Cache the result
    tokenValidationCache.setCachedValidation(token, result);

    return result;
  } catch (error) {
    console.error("Client token validation error:", error);
    const errorResult = {
      isValid: false,
      error: "Token validation failed",
    };

    // Cache error result briefly to prevent rapid retries
    try {
      const token = await getToken();
      if (token) {
        tokenValidationCache.setCachedValidation(token, errorResult);
      }
    } catch {
      // Ignore cache errors
    }

    return errorResult;
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
 * Client-side wrapper for logout with cache clearing
 */
export async function clientSecureLogout() {
  try {
    // Clear token validation cache
    tokenValidationCache.clearCache();

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

/**
 * Clear token validation cache (useful when token changes)
 */
export function clearTokenValidationCache(): void {
  tokenValidationCache.clearCache();
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
