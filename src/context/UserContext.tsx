"use client";

import { getCurrentUser } from "@/services/userService";
import { getUserRole, type GetUser } from "@/types/user";
import {
  clientSecureLogout,
  clientValidateToken,
} from "@/utils/clientAuthWrapper";
import { usePathname, useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Define public paths that don't require authentication - static to avoid recreating
const PUBLIC_PATHS = [
  "/login",
  "/first-reset-password",
  "/password-reset",
  "/forgot-password",
  "/reset-password-confirm",
];

interface UserContextType {
  userProfile: GetUser | null;
  refreshUserProfile: (forceRefresh?: boolean) => Promise<void>;
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

  // Check if current path is public - memoize to prevent unnecessary recalculations
  const isPublicPath = useMemo(
    () => PUBLIC_PATHS.some((publicPath) => pathname?.startsWith(publicPath)),
    [pathname],
  );

  // Cache key for user profile
  const USER_PROFILE_CACHE_KEY = "user_profile_cache";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Function to get cached user profile
  const getCachedUserProfile = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < CACHE_DURATION) {
        return data;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(USER_PROFILE_CACHE_KEY);
        return null;
      }
    } catch (error) {
      console.error("Error reading user profile cache:", error);
      return null;
    }
  }, [CACHE_DURATION]);

  // Function to cache user profile
  const cacheUserProfile = useCallback((userData: GetUser) => {
    if (typeof window === "undefined") return;

    try {
      const cacheData = {
        data: userData,
        timestamp: Date.now(),
      };
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching user profile:", error);
    }
  }, []);

  // Function to clear user profile cache
  const clearUserProfileCache = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_PROFILE_CACHE_KEY);
  }, []);

  // Function to fetch the current user profile
  const refreshUserProfile = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        setIsLoading(true);

        // Skip token validation on public paths
        if (isPublicPath) {
          console.log("Skipping profile refresh on public path:", pathname);
          setUserProfile(null);
          setRole("");
          clearUserProfileCache();
          return;
        }

        // Check cache first if not forcing refresh
        if (!forceRefresh) {
          const cachedProfile = getCachedUserProfile();
          if (cachedProfile) {
            console.log("Using cached user profile");
            setUserProfile(cachedProfile);
            setRole(getUserRole(cachedProfile));
            setIsLoading(false);
            return;
          }
        }

        // Use secure token validation instead of just checking for token existence
        const tokenValidation = await clientValidateToken();
        if (!tokenValidation.isValid) {
          console.warn("Token validation failed:", tokenValidation.error);
          setUserProfile(null);
          setRole("");
          clearUserProfileCache();
          await clientSecureLogout(); // Use secure logout
          router.push("/login");
          return;
        }

        // Fetch data from API - let Redis handle caching unless forcing refresh
        console.log(
          forceRefresh
            ? "Fetching fresh user profile from API (bypassing cache)"
            : "Fetching user profile from API (using Redis cache)",
        );
        const userData = await getCurrentUser(forceRefresh);

        if (userData && !userData.error) {
          setUserProfile(userData);
          setRole(getUserRole(userData)); // Set role from user data
          cacheUserProfile(userData); // Cache the fresh data

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
          clearUserProfileCache();
          router.push("/login");
        }
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      router,
      isPublicPath,
      pathname,
      getCachedUserProfile,
      cacheUserProfile,
      clearUserProfileCache,
    ],
  );

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
          clearUserProfileCache();
          setIsLoading(false);
          return;
        }

        // If we already have a valid user profile and we're just navigating between pages,
        // don't make unnecessary API calls
        if (userProfile && !isPublicPath) {
          console.log(
            "User profile already loaded, skipping API call for route change",
          );
          setIsLoading(false);
          return;
        }

        // Check cache first for initial load
        const cachedProfile = getCachedUserProfile();
        if (cachedProfile) {
          console.log("Using cached user profile for initial load");
          setUserProfile(cachedProfile);
          setRole(getUserRole(cachedProfile));
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
          clearUserProfileCache();
          router.push("/login");
          return;
        }

        console.log("Fetching fresh user profile for initial load");
        const userData = await getCurrentUser();
        if (userData && !userData.error) {
          setUserProfile(userData);
          setRole(getUserRole(userData)); // Set role from user data
          cacheUserProfile(userData); // Cache the fresh data
        } else if (userData?.error === "Token expired") {
          console.warn(
            "Token expired during initial fetch. Logging out securely.",
          );
          await clientSecureLogout();
          setUserProfile(null);
          setRole("");
          clearUserProfileCache();
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching initial user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialProfile();
  }, [
    // Include all dependencies to avoid linting errors
    pathname,
    isPublicPath,
    userProfile,
    getCachedUserProfile,
    cacheUserProfile,
    clearUserProfileCache,
    router,
  ]);

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
