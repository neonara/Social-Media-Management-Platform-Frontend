"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  clientValidateRoles,
  isAuthenticated,
} from "@/utils/clientAuthWrapper";

interface SecureRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  adminOnly?: boolean;
  moderatorOnly?: boolean;
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Secure route component that validates authentication and authorization
 * with backend instead of trusting client-side cookies
 */
export const SecureRoute: React.FC<SecureRouteProps> = ({
  children,
  requiredRoles = [],
  adminOnly = false,
  moderatorOnly = false,
  fallbackPath = "/login",
  loadingComponent = <div>Loading...</div>,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const { userProfile, isLoading: userLoading, role } = useUser();

  useEffect(() => {
    const validateAccess = async () => {
      try {
        setIsLoading(true);

        // Wait for UserContext to finish loading
        if (userLoading) {
          return;
        }

        // Check if user is authenticated (UserContext already validated this)
        if (!userProfile) {
          console.warn("User not authenticated, redirecting to login");
          router.push(fallbackPath);
          return;
        }

        // Determine required roles based on props
        let rolesToCheck = [...requiredRoles];

        if (adminOnly) {
          rolesToCheck = ["administrator", "super_administrator"];
        } else if (moderatorOnly) {
          rolesToCheck = ["moderator"];
        }

        // If no specific roles required, just check authentication
        if (rolesToCheck.length === 0) {
          setHasAccess(true);
          return;
        }

        // Only validate roles if we need to check specific roles
        // UserContext has already validated the token
        const roleValidation = await clientValidateRoles(rolesToCheck);

        if (!roleValidation.hasAccess) {
          console.warn(
            `Access denied. Required roles: ${rolesToCheck.join(", ")}, User roles: ${roleValidation.userRoles.join(", ")}`,
          );
          router.push("/"); // Redirect to home if insufficient permissions
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Access validation error:", error);
        router.push(fallbackPath);
      } finally {
        setIsLoading(false);
      }
    };

    validateAccess();
  }, [
    requiredRoles,
    adminOnly,
    moderatorOnly,
    router,
    fallbackPath,
    userProfile,
    userLoading,
    role,
  ]);

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (!hasAccess) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

/**
 * Higher-order component for route protection
 */
export function withSecureRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<SecureRouteProps, "children"> = {},
) {
  return function SecureRouteWrapper(props: P) {
    return (
      <SecureRoute {...options}>
        <Component {...props} />
      </SecureRoute>
    );
  };
}

/**
 * Hook for checking access within components
 */
export function useSecureAccess(requiredRoles: string[] = []) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);

        const isAuth = await isAuthenticated();
        if (!isAuth) {
          setHasAccess(false);
          return;
        }

        if (requiredRoles.length === 0) {
          setHasAccess(true);
          return;
        }

        const roleValidation = await clientValidateRoles(requiredRoles);
        setHasAccess(roleValidation.hasAccess);
        setUserRoles(roleValidation.userRoles);
      } catch (error) {
        console.error("Access check error:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [requiredRoles]);

  return { hasAccess, userRoles, isLoading };
}
