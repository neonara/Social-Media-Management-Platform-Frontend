"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { LogOutIcon, SettingsIcon } from "./icons";
import { logout } from "@/services/authService";
import { useUser } from "@/context/UserContext";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile, refreshUserProfile } = useUser();
  const isInitialMount = useRef(true);
  const isRefreshing = useRef(false);

  // Refresh user profile when component mounts
  useEffect(() => {
    // Only refresh on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      isRefreshing.current = true;
      refreshUserProfile().finally(() => {
        isRefreshing.current = false;
      });
    }
  }, [refreshUserProfile]);

  // Separate effect to handle profile updates from event listeners
  useEffect(() => {
    // Listen for profile update events
    const handleProfileUpdate = () => {
      // Don't refresh if we triggered the event ourselves
      if (!isRefreshing.current && refreshUserProfile) {
        console.log("UserInfo detected external profile update, refreshing...");
        isRefreshing.current = true;
        refreshUserProfile().finally(() => {
          isRefreshing.current = false;
        });
      }
    };

    // Add event listener for the custom userProfileUpdated event
    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, [refreshUserProfile]);

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          <Image
            src={userProfile?.user_image || "/images/user/user-03.png"}
            className="size-12"
            alt={`Avatar of ${userProfile?.full_name || "user"}`}
            role="presentation"
            width={200}
            height={200}
          />
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{userProfile?.full_name || userProfile?.email}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image
            src={userProfile?.user_image || "/images/user/user-03.png"}
            className="size-12"
            alt={`Avatar for ${userProfile?.full_name || "user"}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {userProfile?.full_name || userProfile?.email}
            </div>

            <div className="leading-none text-gray-6">{userProfile?.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
