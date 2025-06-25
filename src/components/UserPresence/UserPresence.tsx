"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Root as DropdownMenuRoot,
  Trigger as DropdownMenuTrigger,
  Content as DropdownMenuContent,
} from "@radix-ui/react-dropdown-menu";
import {
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
  Content as TooltipContent,
  Provider as TooltipProvider,
} from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { getToken } from "@/utils/token";
import { getUserPresenceWebSocketUrl } from "@/utils/websocket";
import { getImageUrl } from "@/utils/image-url";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
}

interface UserPresenceProps {
  className?: string;
  maxVisible?: number;
}

const borderColors = [
  "border-red-400",
  "border-blue-400",
  "border-green-400",
  "border-yellow-400",
  "border-purple-400",
  "border-pink-400",
  "border-indigo-400",
  "border-orange-400",
  "border-teal-400",
  "border-cyan-400",
];

export default function UserPresence({
  className,
  maxVisible = 5,
}: UserPresenceProps) {
  const [presentUsers, setPresentUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const pathname = usePathname();
  const socketRef = useRef<WebSocket | null>(null);
  const { userProfile } = useUser();

  useEffect(() => {
    const initializeWebSocket = async () => {
      const token = await getToken();
      if (!token) {
        console.warn("No access token found in cookies");
        return;
      }

      socketRef.current = new WebSocket(getUserPresenceWebSocketUrl(token));

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "user-joined") {
          setPresentUsers((prev) => {
            const userExists = prev.some((user) => user.id === data.user.id);
            if (userExists) return prev; // Prevent duplicates
            return [...prev, data.user];
          });
        } else if (data.type === "user-left") {
          setPresentUsers((prev) =>
            prev.filter((user) => user.id !== data.userId),
          );
        }
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    };

    initializeWebSocket();

    return () => {
      if (socketRef.current) {
        console.log("Disconnecting WebSocket on component unmount");
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!pathname.includes("/calendar") && socketRef.current) {
      console.log("Disconnecting WebSocket due to route change");
      socketRef.current.close();
    }
  }, [pathname]);

  // Get a random color from the borderColors array
  const getRandomColor = (userId: string) => {
    // Use the user ID to consistently get the same color for the same user
    const index =
      (typeof userId === "string" ? userId : String(userId))
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      borderColors.length;
    return borderColors[index];
  };

  // const presentUsers = [
  //   {
  //     id: "1",
  //     name: "You",
  //     email: "email@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "2",
  //     name: "User 2",
  //     email: "user2@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "3",
  //     name: "User 3",
  //     email: "user3@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "4",
  //     name: "User 4",
  //     email: "user4@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "5",
  //     name: "User 5",
  //     email: "user5@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "6",
  //     name: "User 6",
  //     email: "user6@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "7",
  //     name: "User 7",
  //     email: "user7@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "8",
  //     name: "User 8",
  //     email: "user8@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "9",
  //     name: "User 9",
  //     email: "user9@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  //   {
  //     id: "10",
  //     name: "User 10",
  //     email: "user10@example.com",
  //     profilePicture: "/avatar_placeholder.svg",
  //   },
  // ];

  const visibleUsers = presentUsers.slice(0, maxVisible);
  const remainingUsers =
    presentUsers.length > maxVisible ? presentUsers.slice(maxVisible) : [];
  const hasMoreUsers = remainingUsers.length > 0;

  // Remove the current user from the list
  useEffect(() => {
    if (userProfile) {
      setPresentUsers((prev) =>
        prev.filter((user) => user.id !== String(userProfile.id)),
      );
    }
  }, [userProfile]);

  return (
    <div className="flex flex-col items-end p-2">
      <h2 className="mb-3 text-xl font-medium">Online Users</h2>
      <div className={cn("flex items-center justify-end", className)}>
        {/* Trigger to show all users */}

        <div className="flex flex-row-reverse items-center">
          {/* User avatars */}
          {visibleUsers.map((user, index) => (
            <TooltipProvider key={`${user.id}-${index}`} delayDuration={300}>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-full border-2 transition-all hover:shadow-md",
                      getRandomColor(user.id),
                      index !== 0 && "-mr-1",
                      "dark:hover:shadow-gray-700",
                    )}
                    style={{ zIndex: visibleUsers.length - index }}
                  >
                    <Image
                      src={getImageUrl(user.profilePicture)}
                      alt={user.name || `User with email ${user.email}`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/avatar_placeholder.svg";
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="mt-[6px] rounded-md bg-white px-2 py-1 font-medium text-black shadow-md dark:bg-gray-800 dark:text-white"
                >
                  <p>{user.name || user.email}</p>
                </TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          ))}

          {/* Show more users dropdown */}
          {hasMoreUsers && (
            <DropdownMenuRoot open={isOpen} onOpenChange={setIsOpen}>
              <TooltipProvider delayDuration={300}>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <div
                        className={cn(
                          "mr-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-gray-200 font-medium text-black",
                          "dark:bg-gray-700 dark:text-white",
                        )}
                        style={{ zIndex: visibleUsers.length + 1 }}
                      >
                        +{remainingUsers.length}
                      </div>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="mt-[6px] rounded-md bg-white px-2 py-1 text-black shadow-md dark:bg-gray-800 dark:text-white"
                  >
                    <p>{remainingUsers.length} more online users</p>
                  </TooltipContent>
                </TooltipRoot>
              </TooltipProvider>
              <DropdownMenuContent
                align="end"
                className="z-1 my-[6px] w-56 rounded-md bg-white p-1 shadow-md dark:bg-gray-800 dark:text-white"
              >
                <div className="max-h-80 overflow-auto">
                  {remainingUsers.map((user, index) => (
                    <div
                      key={`${user.id}-${index}`}
                      className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-1 truncate">
                        <p className="text-sm font-semibold text-black dark:text-white">
                          {user.name || user.email}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-full border-2",
                          getRandomColor(user.id),
                          "",
                        )}
                      >
                        <Image
                          src={getImageUrl(user.profilePicture)}
                          alt={user.name || `User with email ${user.email}`}
                          width={32}
                          height={32}
                          className="h-6 w-6 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/avatar_placeholder.svg";
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenuRoot>
          )}
        </div>

        {/* Button to show all users */}
        <DropdownMenuRoot open={showAllUsers} onOpenChange={setShowAllUsers}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-black outline-none transition-all",
                showAllUsers && "bg-gray-300 shadow-sm",
                "dark:bg-gray-700 dark:text-white dark:shadow-gray-800",
              )}
              aria-label="Show all users"
            >
              <Users size={18} />
            </button>
          </DropdownMenuTrigger>
          {presentUsers.length > 0 && (
            <DropdownMenuContent
              align="end"
              className="z-1 mt-[6px] w-56 rounded-md bg-white p-1 shadow-md dark:bg-gray-800 dark:text-white"
            >
              <div className="max-h-80 overflow-auto">
                {presentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex-1 truncate">
                      <p className="text-sm font-semibold text-black dark:text-white">
                        {user.name || user.email}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-full border-2",
                        getRandomColor(user.id),
                        "",
                      )}
                    >
                      <Image
                        src={getImageUrl(user.profilePicture)}
                        alt={user.name || `User with email ${user.email}`}
                        width={32}
                        height={32}
                        className="h-6 w-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/avatar_placeholder.svg";
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenuRoot>
      </div>
    </div>
  );
}
