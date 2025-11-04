"use client";

import { Chat } from "@/components/chat/Chat";
import { useUser } from "@/context/UserContext";

export default function ChatPage() {
  const { userProfile: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Please log in to access chat</p>
        </div>
      </div>
    );
  }

  return <Chat currentUserId={user.id} />;
}
