import "@/assets/css/lemon-milk.css";
import "@/assets/css/style.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/context/UserContext";
import { NotificationProvider } from "@/context/NotificationContext";

export const metadata: Metadata = {
  title: {
    template: "%s | Brand And Com Social Media Management",
    default: "Brand And Com Social Media Management",
  },
  description:
    "Next.js admin dashboard toolkit with 200+ templates, UI components, and integrations for fast dashboard development.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" attribute="class">
          <UserProvider>
            <NotificationProvider>
              <NextTopLoader color="#5750F1" showSpinner={false} />
              {children}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  // Define default options
                  className: "",
                  duration: 4000,
                  style: {
                    background: "var(--toast-bg)",
                    color: "var(--toast-text)",
                    border: "1px solid var(--toast-border)",
                  },
                  // Default options for specific types
                  success: {
                    duration: 3000,
                    style: {
                      background: "var(--toast-success-bg)",
                      color: "var(--toast-success-text)",
                      border: "1px solid var(--toast-success-border)",
                    },
                    iconTheme: {
                      primary: "#10B981",
                      secondary: "white",
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: "var(--toast-error-bg)",
                      color: "var(--toast-error-text)",
                      border: "1px solid var(--toast-error-border)",
                    },
                    iconTheme: {
                      primary: "#EF4444",
                      secondary: "white",
                    },
                  },
                  loading: {
                    style: {
                      background: "var(--toast-loading-bg)",
                      color: "var(--toast-loading-text)",
                      border: "1px solid var(--toast-loading-border)",
                    },
                  },
                }}
              />
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
