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
import { getToken, deleteToken } from "@/utils/token";
import { useRouter } from "next/navigation";

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

  // Function to fetch the current user profile
  const refreshUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check for valid token before calling getCurrentUser
      const token = await getToken();
      if (!token) {
        console.warn("No valid token found. Skipping user profile refresh.");
        setUserProfile(null);
        setRole("");
        router.push("/login"); // Redirect to login
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
        console.warn("Token expired. Deleting token and redirecting to login.");
        await deleteToken(); // Delete the expired token
        setUserProfile(null);
        setRole("");
        router.push("/login"); // Redirect to login
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Initial fetch of user profile
  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        setIsLoading(true);

        // Check for valid token before calling getCurrentUser
        const token = await getToken();
        if (!token) {
          console.warn(
            "No valid token found. Skipping initial user profile fetch.",
          );
          setUserProfile(null);
          setRole("");
          router.push("/login"); // Redirect to login
          return;
        }

        const userData = await getCurrentUser();
        if (userData && !userData.error) {
          setUserProfile(userData);
          setRole(getUserRole(userData)); // Set role from user data
        } else if (userData?.error === "Token expired") {
          console.warn(
            "Token expired. Deleting token and redirecting to login.",
          );
          await deleteToken(); // Delete the expired token
          setUserProfile(null);
          setRole("");
          router.push("/login"); // Redirect to login
        }
      } catch (error) {
        console.error("Error fetching initial user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialProfile();
  }, [router]);

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
