"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getCurrentUser } from "@/services/userService";
import { getUserRole, type GetUser } from "@/types/user";
import {
  clientValidateToken,
  clientSecureLogout,
} from "@/utils/clientAuthWrapper";
import { useRouter, usePathname } from "next/navigation";

interface UserContextType {
  userProfile: GetUser | null;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
  role: string; // Add role to the context
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userProfile, setUserProfile] = useState<GetUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string>(""); // State for role
  const router = useRouter(); // For redirection
  const pathname = usePathname(); // Get current path

  // Define public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/first-reset-password",
    "/password-reset",
    "/forgot_password",
    "/reset-password-confirm",
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some((publicPath) =>
    pathname?.startsWith(publicPath),
  );

  // Function to fetch the current user profile
  const refreshUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      // Skip token validation on public paths
      if (isPublicPath) {
        console.log("Skipping profile refresh on public path:", pathname);
        setUserProfile(null);
        setRole("");
        return;
      }

      // Use secure token validation instead of just checking for token existence
      const tokenValidation = await clientValidateToken();
      if (!tokenValidation.isValid) {
        console.warn("Token validation failed:", tokenValidation.error);
        setUserProfile(null);
        setRole("");
        await clientSecureLogout(); // Use secure logout
        router.push("/login");
        return;
      }

      // Use bypassCache: true to ensure we get fresh data after updates
      const userData = await getCurrentUser(true);

      if (userData && !userData.error) {
        setUserProfile(userData);
        setRole(getUserRole(userData)); // Set role from user data

        // Dispatch an event that other components can listen for
        const event = new CustomEvent("userProfileUpdated", {
          detail: userData,
        });
        window.dispatchEvent(event);
      } else if (userData?.error === "Token expired") {
        console.warn("Token expired. Logging out securely.");
        await clientSecureLogout();
        setUserProfile(null);
        setRole("");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router, isPublicPath, pathname]);

  // Initial fetch of user profile
  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        setIsLoading(true);

        // Skip token validation on public paths (login, password reset, etc.)
        if (isPublicPath) {
          console.log("Skipping token validation on public path:", pathname);
          setUserProfile(null);
          setRole("");
          setIsLoading(false);
          return;
        }

        // Use secure token validation instead of just checking for token existence
        const tokenValidation = await clientValidateToken();
        if (!tokenValidation.isValid) {
          console.warn(
            "No valid token found or token validation failed:",
            tokenValidation.error,
          );
          setUserProfile(null);
          setRole("");
          router.push("/login");
          return;
        }

        const userData = await getCurrentUser();
        if (userData && !userData.error) {
          setUserProfile(userData);
          setRole(getUserRole(userData)); // Set role from user data
        } else if (userData?.error === "Token expired") {
          console.warn(
            "Token expired during initial fetch. Logging out securely.",
          );
          await clientSecureLogout();
          setUserProfile(null);
          setRole("");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching initial user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialProfile();
  }, [router, pathname, isPublicPath]);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        refreshUserProfile,
        isLoading,
        role, // Provide role in the context
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
