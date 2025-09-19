"use client";

import { useState, useEffect, useCallback } from "react";
import {
  clientValidateToken,
  isAuthenticated as checkAuth,
  isAdmin as checkAdmin,
} from "@/utils/clientAuthWrapper";

interface UseSecureRolesReturn {
  userRoles: string[];
  isAdmin: boolean;
  isModerator: boolean;
  isCommunityManager: boolean;
  isClient: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  refreshRoles: () => Promise<void>;
}

/**
 * Secure hook for role-based access control
 * Validates roles with backend instead of trusting client-side data
 */
export function useSecureRoles(): UseSecureRolesReturn {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check authentication first
      const authStatus = await checkAuth();
      setIsAuth(authStatus);

      if (!authStatus) {
        setUserRoles([]);
        return;
      }

      // Get user roles from backend by validating token
      const tokenValidation = await clientValidateToken();
      if (tokenValidation.isValid && tokenValidation.user) {
        const user = tokenValidation.user;
        const roles: string[] = [];

        // Extract roles from user data
        if (user.roles.is_administrator) roles.push("administrator");
        if (user.roles.is_superadministrator) roles.push("super_administrator");
        if (user.roles.is_moderator) roles.push("moderator");
        if (user.roles.is_community_manager) roles.push("community_manager");
        if (user.roles.is_client) roles.push("client");

        setUserRoles(roles);
      } else {
        setUserRoles([]);
        setIsAuth(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching user roles:", err);
      setUserRoles([]);
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  // Helper functions for common role checks
  const checkHasRole = useCallback(
    (role: string): boolean => {
      return userRoles.includes(role);
    },
    [userRoles],
  );

  const checkHasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => userRoles.includes(role));
    },
    [userRoles],
  );

  const checkHasAllRoles = useCallback(
    (roles: string[]): boolean => {
      return roles.every((role) => userRoles.includes(role));
    },
    [userRoles],
  );

  return {
    userRoles,
    isAdmin:
      userRoles.includes("administrator") ||
      userRoles.includes("super_administrator"),
    isModerator: userRoles.includes("moderator"),
    isCommunityManager: userRoles.includes("community_manager"),
    isClient: userRoles.includes("client"),
    isSuperAdmin: userRoles.includes("super_administrator"),
    isAuthenticated: isAuth,
    isLoading,
    error,
    hasRole: checkHasRole,
    hasAnyRole: checkHasAnyRole,
    hasAllRoles: checkHasAllRoles,
    refreshRoles,
  };
}

/**
 * Hook for admin-specific operations
 */
export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAdminAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const adminStatus = await checkAdmin();
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error("Admin access check failed:", error);
      setIsAdmin(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  return {
    isAdmin,
    isLoading,
    checkAdminAccess,
  };
}
