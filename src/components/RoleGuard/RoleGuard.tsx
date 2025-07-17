"use client";

import React from "react";
import { useSecureAccess } from "@/components/SecureRoute/SecureRoute";

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Component that only renders children if user has admin privileges
 * Validates with backend instead of trusting client-side role cookies
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null,
  requiredRoles = ["administrator", "super_administrator"],
}) => {
  const { hasAccess, isLoading } = useSecureAccess(requiredRoles);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ModeratorOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders children if user has moderator privileges
 */
export const ModeratorOnly: React.FC<ModeratorOnlyProps> = ({
  children,
  fallback = null,
}) => {
  const { hasAccess, isLoading } = useSecureAccess(["moderator"]);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface CommunityManagerOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders children if user has community manager privileges
 */
export const CommunityManagerOnly: React.FC<CommunityManagerOnlyProps> = ({
  children,
  fallback = null,
}) => {
  const { hasAccess, isLoading } = useSecureAccess(["community_manager"]);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleBasedProps {
  children: React.ReactNode;
  requiredRoles: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false, user needs ANY role
}

/**
 * Generic component for role-based access control
 */
export const RoleBased: React.FC<RoleBasedProps> = ({
  children,
  requiredRoles,
  fallback = null,
  requireAll = false,
}) => {
  const { hasAccess, userRoles, isLoading } = useSecureAccess(requiredRoles);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  let shouldRender = hasAccess;

  // If requireAll is true, check that user has all required roles
  if (requireAll && requiredRoles.length > 0) {
    shouldRender = requiredRoles.every((role) => userRoles.includes(role));
  }

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
