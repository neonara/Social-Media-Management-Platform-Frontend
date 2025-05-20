import "@/css/lemon-milk.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
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
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
