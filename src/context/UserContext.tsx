"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getCurrentUser } from "@/services/userService";
import type { GetUser } from "@/types/user";

interface UserContextType {
  userProfile: GetUser | null;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
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

  // Function to fetch the current user profile
  const refreshUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use bypassCache: true to ensure we get fresh data after updates
      const userData = await getCurrentUser(true);

      if (userData && !userData.error) {
        setUserProfile(userData);

        // Dispatch an event that other components can listen for
        const event = new CustomEvent("userProfileUpdated", {
          detail: userData,
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch of user profile
  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await getCurrentUser();
        if (userData && !userData.error) {
          setUserProfile(userData);
        }
      } catch (error) {
        console.error("Error fetching initial user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialProfile();
  }, []);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        refreshUserProfile,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
