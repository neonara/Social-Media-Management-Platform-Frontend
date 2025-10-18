/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { Alert } from "@/components/ui-elements/alert";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

type NotificationType = "success" | "error" | "warning";

interface NotificationContextType {
  showNotification: (
    message: string,
    type: NotificationType,
    title?: string,
  ) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Component for the actual notification UI that will be rendered in the portal
const NotificationPortal = ({
  showAlert,
  message,
  title,
  type,
}: {
  showAlert: boolean;
  message: string;
  title: string;
  type: NotificationType;
}) => {
  // Only render on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render anything during SSR or if alert is not shown
  if (!mounted || !showAlert) return null;

  // Create a portal to render the notification at the document root
  return createPortal(
    <div className="animate-fade-in fixed bottom-4 right-4 z-[9999]">
      <Alert variant={type} title={title} description={message} />
    </div>,
    document.body,
  );
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NotificationType>("success");

  const showNotification = (
    message: string,
    type: NotificationType = "success",
    title?: string,
  ) => {
    setMessage(message);
    setType(type);
    setTitle(
      title ||
      (type === "success"
        ? "Success"
        : type === "error"
          ? "Error"
          : "Warning"),
    );
    setShowAlert(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  const hideNotification = () => {
    setShowAlert(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
      }}
    >
      {children}
      <NotificationPortal
        showAlert={showAlert}
        message={message}
        title={title}
        type={type}
      />
    </NotificationContext.Provider>
  );
};
